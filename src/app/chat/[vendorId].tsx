import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import { ChatThread } from '../../components/ChatThread';
import {
  getVendorMessages, sendVendorMessage, canMessageVendor, ChatMessageDTO,
} from '../../api/chat';

const QUICK_REPLIES = ['Where is my order?', 'Can we arrange delivery?', 'Is this still available?', 'Thank you!'];
const POLL_MS = 4000;

// Merge incoming messages into the list, de-duped by id and kept in time order.
function mergeMessages(prev: ChatMessageDTO[], incoming: ChatMessageDTO[]): ChatMessageDTO[] {
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function CustomerChatScreen() {
  const { vendorId, vendorName } = useLocalSearchParams<{ vendorId: string; vendorName?: string }>();
  const { user, token } = useContext(AuthContext);
  const { subscribe } = useWebSocket();
  const { showToast } = useToast();

  const vId = Array.isArray(vendorId) ? vendorId[0] : (vendorId ?? '');
  const displayName = Array.isArray(vendorName) ? vendorName[0] : (vendorName ?? 'Vendor Store');

  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const vendorUserIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !vId) return;
    try {
      const data = await getVendorMessages(vId, token);
      setMessages((prev) => mergeMessages(prev, data));
      setDisabledReason(null);
      // Learn the vendor's user id from any message so we can match WS events.
      const other = data.find((m) => m.from === 'them');
      if (other) vendorUserIdRef.current = other.sender_id;
    } catch (err: any) {
      if (err?.status === 403) {
        setDisabledReason('You can message this vendor after placing an order with them.');
      } else if (err?.status !== undefined) {
        // network/other — keep whatever we have, don't wipe the thread
      }
    } finally {
      setLoading(false);
    }
  }, [token, vId]);

  // Initial load + gate check.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token || !vId) return;
      const gate = await canMessageVendor(vId, token);
      if (!alive) return;
      if (!gate.allowed) {
        setDisabledReason(
          gate.reason === 'order_required'
            ? 'You can message this vendor after placing an order with them.'
            : 'Messaging is not available for this vendor.'
        );
        setLoading(false);
        return;
      }
      load();
    })();
    return () => { alive = false; };
  }, [token, vId, load]);

  // Poll for new messages (reliable delivery path).
  useEffect(() => {
    if (disabledReason || !token) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [disabledReason, token, load]);

  // Best-effort instant delivery via the realtime socket.
  useEffect(() => {
    if (!user?.id) return;
    return subscribe((event: any) => {
      if (event.type !== 'chat_message') return;
      // Only add if we can confirm it belongs to THIS vendor conversation.
      // Until the vendor's user id is known, polling picks it up instead —
      // this avoids leaking another conversation's message into this thread.
      const partner = vendorUserIdRef.current;
      if (!partner || (event.sender_id !== partner && event.receiver_id !== partner)) return;
      const isMe = event.sender_id === user.id;
      setMessages((prev) => mergeMessages(prev, [{ ...event, from: isMe ? 'me' : 'them' }]));
    });
  }, [subscribe, user?.id]);

  const handleSend = async (text: string) => {
    if (!token || sending) return;
    setSending(true);
    // Optimistic append.
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: ChatMessageDTO = {
      id: optimisticId, from: 'me', sender_id: user?.id ?? 'me', receiver_id: vendorUserIdRef.current ?? vId,
      text, time: '', created_at: new Date().toISOString(), is_read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendVendorMessage(vId, text, token);
      if (!vendorUserIdRef.current) vendorUserIdRef.current = saved.receiver_id;
      setMessages((prev) => mergeMessages(prev.filter((m) => m.id !== optimisticId), [saved]));
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      if (err?.status === 403) {
        setDisabledReason('You can message this vendor after placing an order with them.');
      } else {
        showToast(err?.message || 'Could not send message. Please try again.', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <ChatThread
      title={displayName}
      subtitle={disabledReason ? undefined : 'Usually replies within a day'}
      avatarIcon="storefront"
      messages={messages}
      loading={loading}
      sending={sending}
      onSend={handleSend}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
      disabledReason={disabledReason}
      quickReplies={QUICK_REPLIES}
      emptyHint="Ask about your order, delivery, or the products."
      headerAction={{ icon: 'storefront-outline', onPress: () => router.push(`/vendor/${vId}` as any) }}
    />
  );
}
