import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChatParticipant = 'me' | 'vendor';

export interface ChatMessage {
  id: string;
  vendorId: string;
  from: ChatParticipant;
  text: string;
  time: string;
  createdAt: string;
}

const STORAGE_KEY = '@local_chats';

async function getAllMessages(): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveAllMessages(messages: ChatMessage[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export async function getMessages(vendorId: string): Promise<ChatMessage[]> {
  const all = await getAllMessages();
  return all
    .filter(m => m.vendorId === vendorId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendMessage(
  vendorId: string,
  from: ChatParticipant,
  text: string
): Promise<ChatMessage> {
  const all = await getAllMessages();
  const now = new Date();
  const msg: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    vendorId,
    from,
    text,
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: now.toISOString(),
  };
  all.push(msg);
  await saveAllMessages(all);
  return msg;
}

const VENDOR_REPLIES = [
  "Thanks for your message! I'll get back to you shortly.",
  "Great question! Let me look into that for you.",
  "Sure, I can help with that! Give me a moment.",
  "Thank you for reaching out. We value your interest!",
  "I'll check on that and respond ASAP.",
];

export function getRandomVendorReply(): string {
  return VENDOR_REPLIES[Math.floor(Math.random() * VENDOR_REPLIES.length)];
}
