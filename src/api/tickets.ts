// ─────────────────────────────────────────────────────────────────────────────
// Support Tickets API Client
// Endpoints: /tickets (user-facing — own tickets only)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export interface CreateTicketPayload {
  subject: string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /tickets — list the caller's tickets (newest first) */
export async function getMyTickets(token: string): Promise<SupportTicket[]> {
  const res = await fetch(`${BASE_URL}/tickets/`, {
    headers: authHeaders(token),
  });
  return handleResponse<SupportTicket[]>(res);
}

/** GET /tickets/:id — get a single ticket with all messages */
export async function getTicket(token: string, ticketId: string): Promise<SupportTicket> {
  const res = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
    headers: authHeaders(token),
  });
  return handleResponse<SupportTicket>(res);
}

/** POST /tickets — create a new ticket */
export async function createTicket(token: string, payload: CreateTicketPayload): Promise<SupportTicket> {
  const res = await fetch(`${BASE_URL}/tickets/`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<SupportTicket>(res);
}

/** POST /tickets/:id/reply — append a message to an existing ticket */
export async function replyToTicket(token: string, ticketId: string, text: string): Promise<SupportTicket> {
  const res = await fetch(`${BASE_URL}/tickets/${ticketId}/reply`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  return handleResponse<SupportTicket>(res);
}
