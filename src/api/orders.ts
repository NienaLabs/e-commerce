// ─────────────────────────────────────────────
// Orders API Client
// ─────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1';

// ── Types ────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: number;
  discount_price?: number | null;
  color_chosen?: string | null;
  product_name?: string | null;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  shipping_address: Record<string, any>;
  notes?: string | null;
  delivery_pin?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// ── Helpers ──────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      detail = { message: res.statusText };
    }
    throw new Error(
      detail?.message ?? detail?.detail ?? `Request failed (${res.status})`
    );
  }
  return res.json() as Promise<T>;
}

// ── Endpoints ─────────────────────────────────

/** GET /orders/me — authenticated user's order history */
export async function listMyOrders(
  token: string,
  params: { skip?: number; limit?: number } = {}
): Promise<Order[]> {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.set('skip', String(params.skip));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}/orders/me?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Order[]>(res);
}

/** GET /orders/me/{order_id} — single order by ID */
export async function getMyOrder(token: string, orderId: string): Promise<Order> {
  const res = await fetch(`${BASE_URL}/orders/me/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<Order>(res);
}

/** DELETE /orders/me/{order_id} — permanently delete a completed order */
export async function deleteMyOrder(token: string, orderId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders/me/${orderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      detail = { message: res.statusText };
    }
    throw new Error(
      detail?.message ?? detail?.detail ?? `Request failed (${res.status})`
    );
  }
}
