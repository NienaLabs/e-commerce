// ─────────────────────────────────────────────
// Recommendations API Client
// ─────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Types ────────────────────────────────────

export interface ProductCardItem {
  product_id: string;
  score: number;
  slot: string;
  reason_label: string;
  has_discount: boolean;
}

export interface RecommendationShelf {
  slot: string;
  label: string;
  products: ProductCardItem[];
}

export interface RecommendationResponse {
  user_id: string;
  shelves: RecommendationShelf[];
  contextual_cards: ProductCardItem[];
  profile_built_at: string | null;
}

export interface ColdStartCategory {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
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

// ── Recommendation Endpoints ─────────────────

/** GET /api/v1/recommendations/ — all recommendation shelves */
export async function getRecommendations(
  token: string,
  perShelf: number = 20
): Promise<RecommendationResponse> {
  const res = await fetch(
    `${BASE_URL}/api/v1/recommendations/?per_shelf=${perShelf}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return handleResponse<RecommendationResponse>(res);
}

/** GET /api/v1/recommendations/shelf/{slot} — single shelf */
export async function getRecommendationShelf(
  token: string,
  slot: string,
  limit: number = 20
): Promise<RecommendationShelf> {
  const res = await fetch(
    `${BASE_URL}/api/v1/recommendations/shelf/${slot}?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return handleResponse<RecommendationShelf>(res);
}

/** GET /api/v1/recommendations/product/{product_id}/cross-sell — cross-sell shelf for a product */
export async function getProductCrossSell(
  token: string | null | undefined,
  productId: string,
  limit: number = 15
): Promise<RecommendationShelf> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(
    `${BASE_URL}/api/v1/recommendations/product/${productId}/cross-sell?limit=${limit}`,
    { headers }
  );
  return handleResponse<RecommendationShelf>(res);
}

/** POST /api/v1/recommendations/event — log a user interaction event */
export async function logRecommendationEvent(
  token: string,
  payload: RecommendationEventPayload
): Promise<{ status: string; event_id: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/recommendations/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ status: string; event_id: string }>(res);
}

export interface RecommendationEventPayload {
  event_type: string;
  product_id?: string;
  vendor_id?: string;
  session_id?: string;
  referrer_source?: string;
  metadata?: Record<string, any>;
}

/** POST /api/v1/recommendations/batch-events — log multiple events efficiently */
export async function logBatchEvents(
  token: string,
  payloads: RecommendationEventPayload[]
): Promise<{ status: string; inserted_count: number }> {
  const res = await fetch(`${BASE_URL}/api/v1/recommendations/batch-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payloads),
  });
  return handleResponse<{ status: string; inserted_count: number }>(res);
}

/** GET /api/v1/recommendations/cold-start — onboarding categories (public) */
export async function getColdStartCategories(): Promise<{
  categories: ColdStartCategory[];
}> {
  const res = await fetch(`${BASE_URL}/api/v1/recommendations/cold-start`);
  return handleResponse<{ categories: ColdStartCategory[] }>(res);
}

// ── Slot metadata (icons + display names) ────

export const SHELF_META: Record<
  string,
  { icon: string; iconFamily?: string; gradient: [string, string] }
> = {
  taste_profile: {
    icon: 'heart-circle',
    gradient: ['#d93651', '#f97316'],
  },
  your_world: {
    icon: 'globe',
    gradient: ['#3a7ef5', '#06b6d4'],
  },
  people_like_you: {
    icon: 'people',
    gradient: ['#8b5cf6', '#d946ef'],
  },
  trending_near_you: {
    icon: 'trending-up',
    gradient: ['#f59e0b', '#ef4444'],
  },
  hot_right_now: {
    icon: 'flame',
    gradient: ['#ef4444', '#f97316'],
  },
  complete_the_set: {
    icon: 'grid',
    gradient: ['#10b981', '#06b6d4'],
  },
  product_cross_sell: {
    icon: 'pricetags',
    gradient: ['#10b981', '#3b82f6'],
  },
  price_drop: {
    icon: 'pricetag',
    gradient: ['#2d9e5f', '#06b6d4'],
  },
  rising_store: {
    icon: 'storefront',
    gradient: ['#8b5cf6', '#3a7ef5'],
  },
};
