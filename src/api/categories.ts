// Routed through the shared helper so every module agrees on one origin.
// Modules that built their own URL hit http://127.0.0.1 while auth/vendors
// used localhost — different origins to a browser, and a second HTTP cache.
import { API_BASE_URL as BASE_URL } from './client';
// ─────────────────────────────────────────────
// Categories API Client
// ─────────────────────────────────────────────



// ── Types ────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  category_enum: string;
  parent_id?: string | null;
  icon_url?: string | null;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  category_enum: string;
  parent_id?: string | null;
  icon_url?: string | null;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
  category_enum?: string;
  parent_id?: string | null;
  icon_url?: string | null;
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
      detail?.detail?.[0]?.msg || detail?.message || 'API Request Failed'
    );
  }
  // 204 No Content won't have JSON body
  if (res.status === 204) {
    return null as unknown as T;
  }
  return res.json();
}

// ── Endpoints ────────────────────────────────

export async function listCategories(skip = 0, limit = 100): Promise<Category[]> {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', String(skip));
  if (limit !== undefined) params.append('limit', String(limit));

  const url = `${BASE_URL}/categories?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<Category[]>(res);
}

export async function createCategory(token: string, data: CategoryCreate): Promise<Category> {
  const url = `${BASE_URL}/categories`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Category>(res);
}

export async function getCategory(categoryId: string): Promise<Category> {
  const url = `${BASE_URL}/categories/${categoryId}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  return handleResponse<Category>(res);
}

export async function updateCategory(
  token: string,
  categoryId: string,
  data: CategoryUpdate
): Promise<Category> {
  const url = `${BASE_URL}/categories/${categoryId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Category>(res);
}

export async function deleteCategory(token: string, categoryId: string): Promise<void> {
  const url = `${BASE_URL}/categories/${categoryId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<void>(res);
}
