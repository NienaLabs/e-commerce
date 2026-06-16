// ─────────────────────────────────────────────
// Auth API Client
// Base URL pulled from EXPO_PUBLIC_API_BASE_URL
// ─────────────────────────────────────────────

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ── Types ────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  onboarding_done: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionResponse {
  token: string;
  userId: string;
  expiresAt: string;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  emailVerified?: boolean;
  image?: string;
}

export interface LoginPayload {
  username: string; // API uses "username" (email address)
  password: string;
}

export interface ApiError {
  message: string;
  detail?: any;
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

    // FastAPI validation errors come as { detail: [...] }
    if (detail?.detail && Array.isArray(detail.detail)) {
      const firstError = detail.detail[0];
      const field = firstError?.loc?.slice(-1)[0] ?? 'field';
      throw new Error(`${field}: ${firstError?.msg ?? 'Invalid value'}`);
    }

    throw new Error(
      detail?.message ?? detail?.detail ?? `Request failed (${res.status})`
    );
  }
  return res.json() as Promise<T>;
}

// ── Auth Endpoints ───────────────────────────

/** POST /auth/register */
export async function register(payload: RegisterPayload): Promise<UserResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      password: payload.password,
      emailVerified: payload.emailVerified ?? false,
      ...(payload.image ? { image: payload.image } : {}),
    }),
  });
  return handleResponse<UserResponse>(res);
}

/** POST /auth/login — returns a session token (OAuth2 form) */
export async function login(payload: LoginPayload): Promise<SessionResponse> {
  const form = new URLSearchParams();
  form.append('username', payload.username);
  form.append('password', payload.password);

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  return handleResponse<SessionResponse>(res);
}

/** GET /auth/me — fetch the currently authenticated user */
export async function getMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserResponse>(res);
}

/** GET /auth/google/login — returns the redirect URL for Google OAuth */
export async function getGoogleLoginUrl(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/google/login`);
  const data = await handleResponse<{ url: string }>(res);
  return data.url;
}

/** GET /auth/google/callback — handles the code from Google */
export async function handleGoogleCallback(code: string): Promise<SessionResponse> {
  const res = await fetch(`${BASE_URL}/auth/google/callback?code=${encodeURIComponent(code)}`);
  return handleResponse<SessionResponse>(res);
}

// ── FCM Token Endpoints ──────────────────────

/** POST /users/me/fcm-token */
export async function registerFcmToken(token: string, sessionToken: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/me/fcm-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ token }),
  });
  await handleResponse<{ status: string }>(res);
}

/** DELETE /users/me/fcm-token */
export async function unregisterFcmToken(token: string, sessionToken: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/me/fcm-token?token=${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to unregister FCM token (${res.status})`);
  }
}
