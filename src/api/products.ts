// ─────────────────────────────────────────────
// Products API Client
// ─────────────────────────────────────────────

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Types ────────────────────────────────────

export interface HeroBanner {
  id: string;
  title?: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  image_url: string;  // matches backend field name
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hex?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  actual_price: number;
  discount_price?: number | null;
  stock_quantity: number;
  warranty_info?: string | null;
  is_active: boolean;
  vendor_id: string;
  vendor_name?: string | null;
  vendor_logo_url?: string | null;
  category_id: string;
  avg_rating: number;
  review_count: number;
  like_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  colors: ProductColor[];
}

export interface ListProductsParams {
  skip?: number;
  limit?: number;
  category_id?: string;
  has_discount?: boolean;
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

// ── Utility: Map API product to ProductCard-friendly shape ───

export function mapProductToCard(product: Product) {
  // Backend field is image_url, not url
  const primaryImage = product.images?.find(img => img.is_primary);
  const firstImage = (primaryImage ?? product.images?.[0])?.image_url
    ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600';
  return {
    id: product.id,
    name: product.name,
    price: product.actual_price,
    salePrice: product.discount_price ?? undefined,
    imageUrl: firstImage,
    vendorId: product.vendor_id,
    vendorName: product.vendor_name ?? undefined,
    vendorAvatar: product.vendor_logo_url ?? undefined,
    inStock: product.stock_quantity > 0,
    categoryId: product.category_id,
  };
}

// ── Product Endpoints ─────────────────────────

/** GET /products/ — paginated list, optional category_id filter */
export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.skip !== undefined) query.set('skip', String(params.skip));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.category_id) query.set('category_id', params.category_id);
  if (params.has_discount !== undefined) query.set('has_discount', String(params.has_discount));

  const res = await fetch(`${BASE_URL}/products/?${query.toString()}`);
  return handleResponse<Product[]>(res);
}

/** GET /products/hero-banners — get active hero banners */
export async function getHeroBanners(): Promise<HeroBanner[]> {
  const res = await fetch(`${BASE_URL}/products/hero-banners`);
  return handleResponse<HeroBanner[]>(res);
}

export interface CategoryGroupedProducts {
  category_id: string;
  category_name: string;
  products: Product[];
}

/** GET /products/grouped-by-category — top categories with their top products */
export async function getGroupedProducts(limit_per_category: number = 15, num_categories: number = 5, token?: string | null): Promise<CategoryGroupedProducts[]> {
  const query = new URLSearchParams();
  query.set('limit_per_category', String(limit_per_category));
  query.set('num_categories', String(num_categories));
  
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${BASE_URL}/products/grouped-by-category?${query.toString()}`, { headers });
  return handleResponse<CategoryGroupedProducts[]>(res);
}


export interface ProductCreatePayload {
  name: string;
  slug: string;
  description: string;
  actual_price: number;
  discount_price?: number;
  stock_quantity: number;
  warranty_info?: string;
  is_active: boolean;
  category_id: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

/** GET /categories/ — get list of product categories */
export async function listCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE_URL}/categories/`);
  return handleResponse<Category[]>(res);
}

/** GET /products/{product_id} — single product by UUID */
export async function getProduct(productId: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${productId}`);
  return handleResponse<Product>(res);
}

/** POST /products/ — create a new product (requires auth token) */
export async function createProduct(
  token: string,
  payload: ProductCreatePayload
): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Product>(res);
}

export type ProductUpdatePayload = Partial<ProductCreatePayload>;

/** PATCH /products/{product_id} — update a product (requires auth token) */
export async function updateProduct(
  token: string,
  productId: string,
  payload: ProductUpdatePayload
): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Product>(res);
}

/** DELETE /products/{product_id} — delete a product (requires auth token) */
export async function deleteProduct(
  token: string,
  productId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
