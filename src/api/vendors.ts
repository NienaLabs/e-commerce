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
  avg_rating: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface VendorDetail extends Vendor {
  followers: number;
  products: number;
  reviews: number;
}

export interface CreateVendorPayload {
  store_name: string;
  store_slug: string;
  bio?: string;
  logo_url?: string;
  banner_url?: string;
}

export type UpdateVendorPayload = Partial<CreateVendorPayload>;

export interface ListVendorsParams {
  skip?: number;
  limit?: number;
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
