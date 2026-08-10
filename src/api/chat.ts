// Chat REST client. Messaging is order-gated (a customer can only message a
// vendor after ordering from them) and reliable on Lambda: sending + history
// go over REST and screens poll; the WebSocket 'chat_message' event is a
// best-effort instant-delivery bonus, never the source of truth.
import { API_BASE_URL as BASE_URL } from './client';

export interface ChatMessageDTO {
  id: string;
  from: 'me' | 'them';
  sender_id: string;
  receiver_id: string;
  text: string;
  time: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  user_id: string;
  name: string;
  image?: string | null;
  last_message: string;
  time: string;
  created_at: string;
  unread: number;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Whether the current customer may message this vendor (has an order with them). */
export async function canMessageVendor(
  vendorId: string,
  token: string
): Promise<{ allowed: boolean; reason: string | null }> {
  const res = await fetch(`${BASE_URL}/chat/vendor/${vendorId}/can-message`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return { allowed: false, reason: 'error' };
  return res.json();
}

/** Customer: history with a vendor. Throws { status } so callers can detect 403 (gate). */
export async function getVendorMessages(vendorId: string, token: string): Promise<ChatMessageDTO[]> {
  const res = await fetch(`${BASE_URL}/chat/vendor/${vendorId}/messages`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw Object.assign(new Error('Failed to load messages'), { status: res.status });
  return res.json();
}

/** Customer: send a message to a vendor. */
export async function sendVendorMessage(
  vendorId: string,
  text: string,
  token: string
): Promise<ChatMessageDTO> {
  const res = await fetch(`${BASE_URL}/chat/vendor/${vendorId}/messages`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw Object.assign(new Error(detail?.detail || 'Failed to send message'), { status: res.status });
  }
  return res.json();
}

/** Vendor: list conversations (inbox). */
export async function getConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/chat/conversations`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json();
}

/** Vendor: history with a specific customer. */
export async function getConversationMessages(otherUserId: string, token: string): Promise<ChatMessageDTO[]> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${otherUserId}/messages`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw Object.assign(new Error('Failed to load messages'), { status: res.status });
  return res.json();
}

/** Vendor: reply to a customer. */
export async function sendConversationMessage(
  otherUserId: string,
  text: string,
  token: string
): Promise<ChatMessageDTO> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${otherUserId}/messages`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw Object.assign(new Error(detail?.detail || 'Failed to send message'), { status: res.status });
  }
  return res.json();
}

/** Badge count of unread messages addressed to the current user. */
export async function getUnreadChatCount(token: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/chat/unread-count`, { headers: authHeaders(token) });
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.unread ?? 0;
}
