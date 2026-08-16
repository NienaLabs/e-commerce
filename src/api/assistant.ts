// ─────────────────────────────────────────────
// Assistant API Client
// ─────────────────────────────────────────────
// Connecting a vendor's WhatsApp number to their store.
//
// The vendor is already signed in when they ask for a code, so the code only
// has to prove one further thing: that the phone sending it is theirs. Linking
// always starts here, in an authenticated session — never from a message
// arriving at the bot.

import { API_BASE_URL as BASE_URL } from './client';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      detail = { message: res.statusText };
    }
    throw new Error(detail?.detail ?? detail?.message ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Why the assistant is unavailable, when it is. Mirrors the backend gate. */
export type AssistantAccessReason =
  | 'ok'
  | 'platform_disabled'
  | 'vendor_not_enrolled'
  | 'suspended'
  | 'not_a_vendor';

export interface AssistantStatus {
  linked: boolean;
  masked_number: string | null;
  linked_at: string | null;
  /** Both the platform switch and this vendor's switch are on. */
  access_allowed: boolean;
  access_reason: AssistantAccessReason | string;
}

export interface LinkCode {
  /** Already prefixed, e.g. "LINK-ABCD2345" — send exactly as-is. */
  code: string;
  expires_at: string;
  /** Deep link that opens WhatsApp with the code prefilled. Null if the
   *  business number isn't configured yet, in which case show the code. */
  wa_link: string | null;
  business_number: string | null;
}

/** GET /assistant/status */
export async function getAssistantStatus(token: string): Promise<AssistantStatus> {
  const res = await fetch(`${BASE_URL}/assistant/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AssistantStatus>(res);
}

/** POST /assistant/whatsapp/link-code */
export async function createLinkCode(token: string): Promise<LinkCode> {
  const res = await fetch(`${BASE_URL}/assistant/whatsapp/link-code`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<LinkCode>(res);
}

/** POST /assistant/whatsapp/unlink */
export async function unlinkWhatsApp(token: string): Promise<{ unlinked: boolean }> {
  const res = await fetch(`${BASE_URL}/assistant/whatsapp/unlink`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ unlinked: boolean }>(res);
}
