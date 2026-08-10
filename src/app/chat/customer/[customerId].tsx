import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../../../context/AuthContext';
import { useWebSocket } from '../../../context/WebSocketContext';
import { useToast } from '../../../context/ToastContext';
import { ChatThread } from '../../../components/ChatThread';
import {
  getConversationMessages, sendConversationMessage, ChatMessageDTO,
} from '../../../api/chat';

const POLL_MS = 4000;

function mergeMessages(prev: ChatMessageDTO[], incoming: ChatMessageDTO[]): ChatMessageDTO[] {
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function VendorChatThreadScreen() {
  const { customerId, name } = useLocalSearchParams<{ customerId: string; name?: string }>();
  const { user, token } = useContext(AuthContext);
  const { subscribe } = useWebSocket();
  const { showToast } = useToast();

  const otherId = Array.isArray(customerId) ? customerId[0] : (customerId ?? '');
  const displayName = Array.isArray(name) ? name[0] : (name ?? 'Customer');

  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!token || !otherId) return;
    try {
      const data = await getConversationMessages(otherId, token);
      setMessages((prev) => mergeMessages(prev, data));
    } catch (err: any) {
      if (err?.status === 404) setMessages([]); // no conversation yet
    } finally {
      setLoading(false);
    }
  }, [token, otherId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!token) return;
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [token, load]);

  useEffect(() => {
    if (!user?.id) return;
    return subscribe((event: any) => {
      if (event.type !== 'chat_message') return;
      const involves = event.sender_id === otherId || event.receiver_id === otherId;
      if (!involves) return;
      const isMe = event.sender_id === user.id;
      setMessages((prev) => mergeMessages(prev, [{ ...event, from: isMe ? 'me' : 'them' }]));
    });
  }, [subscribe, user?.id, otherId]);

  const handleSend = async (text: string) => {
    if (!token || sending) return;
    setSending(true);
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: ChatMessageDTO = {
      id: optimisticId, from: 'me', sender_id: user?.id ?? 'me', receiver_id: otherId,
      text, time: '', created_at: new Date().toISOString(), is_read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendConversationMessage(otherId, text, token);
      setMessages((prev) => mergeMessages(prev.filter((m) => m.id !== optimisticId), [saved]));
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      showToast(err?.message || 'Could not send message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <ChatThread
      title={displayName}
      subtitle="Customer"
      avatarIcon="person-circle-outline"
      messages={messages}
      loading={loading}
      sending={sending}
      onSend={handleSend}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/vendor-dashboard/messages' as any))}
      emptyHint="Reply to your customer's question."
    />
  );
}
