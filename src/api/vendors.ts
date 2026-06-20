// ─────────────────────────────────────────────
// Vendors API Client
// ─────────────────────────────────────────────

import type { Product } from './products';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Types ────────────────────────────────────

export interface Vendor {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  bio: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  total_sales: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface VendorDetail extends Vendor {
  followers: number;
  products: number;
}

export interface CreateVendorPayload {
  store_name: string;
  store_slug: string;
  bio?: string;
  logo_url?: string;
  banner_url?: string;
  latitude?: number;
  longitude?: number;
}

export type UpdateVendorPayload = Partial<CreateVendorPayload>;

export interface ListVendorsParams {
  skip?: number;
  limit?: number;
}

// ── Helpers ──────────────────────────────────

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: any;
    try {
      detail = await res.json();
    } catch {
      detail = { message: res.statusText };
    }
    throw new ApiError(
      detail?.message ?? detail?.detail ?? `Request failed (${res.status})`,
      res.status
    );
  }
  return res.json() as Promise<T>;
}

export { ApiError };

// ── Vendor Endpoints ─────────────────────────

/** GET /vendors/ — paginated list of all vendors */
export async function listVendors(params: ListVendorsParams = {}): Promise<Vendor[]> {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.set('skip', String(params.skip));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}/vendors/?${query.toString()}`);
  return handleResponse<Vendor[]>(res);
}

/** GET /vendors/{vendor_id} — single vendor with stats */
export async function getVendor(vendorId: string): Promise<VendorDetail> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}`);
  return handleResponse<VendorDetail>(res);
}

/** GET /vendors/{vendor_id}/products — vendor's product list */
export async function getVendorProducts(
  vendorId: string,
  params: { skip?: number; limit?: number } = {}
): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.set('skip', String(params.skip));
  if (params.limit !== undefined) query.set('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/products?${query.toString()}`);
  return handleResponse<Product[]>(res);
}

/** GET /vendors/me — current authenticated user's vendor profile */
export async function getVendorMe(token: string): Promise<VendorDetail> {
  const res = await fetch(`${BASE_URL}/vendors/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<VendorDetail>(res);
}

/** POST /vendors/ — register as a vendor (requires auth token) */
export async function createVendor(
  token: string,
  payload: CreateVendorPayload
): Promise<Vendor> {
  const res = await fetch(`${BASE_URL}/vendors/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Vendor>(res);
}

/** PATCH /vendors/{vendor_id} — update your own vendor profile */
export async function updateVendor(
  token: string,
  vendorId: string,
  payload: UpdateVendorPayload
): Promise<Vendor> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Vendor>(res);
}

/** DELETE /vendors/{vendor_id} — delete your vendor profile */
export async function deleteVendor(token: string, vendorId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete vendor (${res.status})`);
  }
}

export interface VendorOrder {
  id: string;
  customer_name: string;
  items_count: number;
  total_amount: number;
  status: string;
  created_at: string;
}

export interface VendorAnalytics {
  total_revenue: number;
  total_orders: number;
  active_orders: number;
  recent_transactions: VendorOrder[];
}

export async function getVendorOrders(token: string, vendorId: string): Promise<VendorOrder[]> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<VendorOrder[]>(res);
}

/** GET /vendors/me/orders/{order_id} */
export async function getVendorOrderDetail(token: string, orderId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/vendors/me/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<any>(res);
}

/** GET /vendors/{vendor_id}/analytics */
export async function getVendorAnalytics(token: string, vendorId: string): Promise<VendorAnalytics> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<VendorAnalytics>(res);
}

/** GET /vendors/{vendor_id}/follow-status */
export async function getVendorFollowStatus(token: string, vendorId: string): Promise<{ following: boolean }> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/follow-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ following: boolean }>(res);
}

/** POST /vendors/{vendor_id}/follow */
export async function toggleVendorFollow(token: string, vendorId: string): Promise<{ following: boolean }> {
  const res = await fetch(`${BASE_URL}/vendors/${vendorId}/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<{ following: boolean }>(res);
}
