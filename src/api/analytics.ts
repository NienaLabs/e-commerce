// ─────────────────────────────────────────────
// Analytics API Client
// ─────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Types ────────────────────────────────────

export interface VendorSummary {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_reviews: number;
  avg_rating: number;
  total_followers: number;
  pending_orders: number;
  revenue_this_month: number;
  orders_this_month: number;
}

export interface RevenueDataPoint {
  period: string; // "2024-01" or "2024-01-15"
  revenue: number;
  order_count: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_revenue: number;
  units_sold: number;
  avg_rating: number;
  view_count: number;
}

export interface OrderStatusBreakdown {
  status: string;
  count: number;
  total_value: number;
}

export interface RecentEvent {
  event_type: string;
  count: number;
  last_occurred: string | null;
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

/** GET /analytics/vendor/summary */
export async function getVendorSummary(token: string): Promise<VendorSummary> {
  const res = await fetch(`${BASE_URL}/analytics/vendor/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<VendorSummary>(res);
}

/** GET /analytics/vendor/revenue */
export async function getVendorRevenue(
  token: string,
  params: { granularity?: 'daily' | 'monthly'; days?: number } = {}
): Promise<RevenueDataPoint[]> {
  const query = new URLSearchParams();
  if (params.granularity) query.set('granularity', params.granularity);
  if (params.days !== undefined) query.set('days', String(params.days));
  const res = await fetch(`${BASE_URL}/analytics/vendor/revenue?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<RevenueDataPoint[]>(res);
}

/** GET /analytics/vendor/top-products */
export async function getVendorTopProducts(
  token: string,
  limit = 10
): Promise<TopProduct[]> {
  const res = await fetch(`${BASE_URL}/analytics/vendor/top-products?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<TopProduct[]>(res);
}

/** GET /analytics/vendor/orders/breakdown */
export async function getVendorOrdersBreakdown(
  token: string
): Promise<OrderStatusBreakdown[]> {
  const res = await fetch(`${BASE_URL}/analytics/vendor/orders/breakdown`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<OrderStatusBreakdown[]>(res);
}

/** GET /analytics/vendor/events */
export async function getVendorEvents(
  token: string,
  days = 30
): Promise<RecentEvent[]> {
  const res = await fetch(`${BASE_URL}/analytics/vendor/events?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<RecentEvent[]>(res);
}
