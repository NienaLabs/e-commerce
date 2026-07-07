# Codebase Fixes — Security Audit & Flow Verification

This document records every change made across the three repos that make up the
Niena platform, and **what was wrong** in each case.

- **Backend** — `eccomerce-backend/` (FastAPI + SQLAlchemy + Redis + Typesense)
- **Admin** — `admin/` (Next.js 16 admin dashboard)
- **Vendors app** — `vendors/` (Expo / React Native customer + vendor app)

Work was done in two passes:
1. **Security audit** — auth flaws, leaks, missing rate limiting, input validation.
2. **Flow verification** — tracing every button/action to its backend endpoint and
   fixing broken wiring and UX dead-ends.

Nothing here is a cosmetic change; each item fixes a real defect.

---

## 1. Backend (`eccomerce-backend/`)

### 1.1 Leaked secrets committed to git — **CRITICAL**
**What was wrong:** The Firebase Admin SDK service-account key
(`niena-f0339-firebase-adminsdk-fbsvc-d534163884.json`), the SQLite databases
(`app.db`, `app.db-shm`, `app.db-wal`, `app/app.db`), and all `__pycache__/*.pyc`
files were tracked in git and pushed to GitHub. Anyone with repo access could pull
the key and gain **full Firebase admin control** (push notifications and any other
Firebase service on the project), plus a copy of the user database.

**Fix:**
- Untracked all of the above with `git rm --cached`.
- Rewrote `.gitignore` to exclude `.env`, `*.db*`, `*firebase-adminsdk*.json`,
  `*service*account*.json`, `__pycache__/`, `.venv/`, `media/`, `.pytest_cache/`.

**Still required from you (cannot be done in code):** the key is still in git
**history** on the remote. Rotate it in Google Cloud Console → IAM → Service
Accounts, and ideally scrub history with `git filter-repo`/BFG and force-push.

### 1.2 Chat WebSocket had no authentication
**File:** `app/routers/chat.py`
**What was wrong:** `WS /chat/ws/{client_id}` accepted any `client_id` with no
token check. Anyone could connect as any user and **read and send messages as
them**. Message payloads were also unvalidated (a malformed frame or non-string
`text` could crash the handler), and a mid-loop exception left the dead socket
registered and still receiving other people's messages.

**Fix:**
- Require `?token=` and validate it via the shared `_validate_ws_token`; reject
  (close 4001) if the token is invalid or doesn't match `client_id`.
- Validate every inbound frame: ignore non-JSON, non-dict, or non-string
  `receiver_id`/`text`; trim and cap message length at 4000 chars.
- Moved `disconnect` into a `finally` block so the socket is always deregistered.

### 1.3 Delivery-PIN brute force + missing authorization
**File:** `app/routers/orders.py` (`POST /orders/{order_id}/verify-delivery`)
**What was wrong:** Any authenticated user could call verify-delivery on **any
order** and try unlimited 4-digit PINs — ~10,000 guesses marks any order
"delivered". No authorization and no attempt limit.

**Fix:**
- Only an admin, or a vendor who has items in that order, may verify.
- Added a per-order attempt cap (5 attempts / 15 min) via the new resource limiter.

### 1.4 Vendors could read the customer's delivery PIN — **funds risk**
**Files:** `app/crud/vendor_orders.py`, `app/routers/vendors.py`,
`app/routers/orders.py`
**What was wrong:** The delivery PIN is the customer's **proof of delivery** for
cash-on-delivery — the customer reads it out and the vendor types it in. But the
PIN was being returned *to the vendor* in four responses:
`GET /vendors/me/orders`, `GET /vendors/me/orders/{id}`, the vendor-orders CRUD
serializer, and `PATCH /orders/{id}/status`. A vendor could read it off their own
dashboard and **self-verify orders they never delivered**, collecting commission
credit for undelivered goods.

**Fix:** Strip `delivery_pin` (set to `None`) in every vendor-facing response.
Admins still see it. Changes are in-memory only (after all commits), so nothing is
persisted.

### 1.5 No rate limiting at the application layer
**Files:** `app/core/rate_limit.py` (new), `app/routers/auth.py`
**What was wrong:** nginx rate-limits at the edge, but the app was defenceless when
hit directly (dev, or any path that bypasses nginx). Login/register had no
throttle — open to credential stuffing and spam account creation.

**Fix:** Added a Redis-backed limiter that **fails open** (an infra outage never
locks users out):
- `POST /auth/login` — 10 attempts / 5 min per IP.
- `POST /auth/register` — 5 / hour per IP.
- Reusable `RateLimiter` dependency + `enforce_resource_limit` helper (used by 1.3).

### 1.6 Google OAuth account-takeover vector
**File:** `app/routers/auth.py` (`GET /auth/google/callback`)
**What was wrong:** When a Google login matched an existing account by email, the
Google identity was linked **without checking `email_verified`**. An attacker could
register a Google profile with a victim's email address (unverified) and get linked
into the victim's existing account.

**Fix:** Refuse to link a Google identity to an existing account unless Google
reports the email as verified (403 otherwise).

### 1.7 Internal error details leaked to clients
**Files:** `app/routers/auth.py`, `app/routers/search.py`
**What was wrong:** The OAuth callback returned `Internal Server Error: {str(e)}`
and search endpoints returned `Search failed: {str(e)}` — leaking stack/internal
details to the client.

**Fix:** Log the real exception server-side (`logger.exception`); return a generic
message to the client. Re-raise real `HTTPException`s untouched.

### 1.8 Upload endpoint was never mounted + unsafe
**Files:** `app/routers/upload.py`, `app/main.py`
**What was wrong:** The mobile app calls `POST /upload/`, but the upload router was
**never included** in `main.py` — every upload 404'd. The handler also trusted the
client-supplied filename for the extension: since `/media` is served directly by
nginx, uploading `x.html`/`x.svg` would be **stored XSS**, and there was no size cap.

**Fix:**
- Mounted the router at `/upload`.
- Enforce an extension **whitelist** (`.jpg/.jpeg/.png/.webp/.gif`) derived from the
  validated content-type, not the filename.
- Stream to disk with a hard **10 MB** cap (413 on overflow) and clean up partial
  files on error.

### 1.9 No way to log out / revoke a session
**Files:** `app/routers/auth.py`, consumed by both frontends
**What was wrong:** Sessions lived 7 days with **no revocation endpoint**. "Logging
out" only dropped the token client-side; the token stayed valid server-side until
expiry, so a leaked/stolen token couldn't be killed.

**Fix:** Added `POST /auth/logout` — revokes the presented session token
(idempotent). Wired into both the admin dashboard and the mobile app (see 2.2, 3.2).

---

## 2. Admin dashboard (`admin/`)

### 2.1 Any account could get an admin session — **privilege escalation**
**File:** `src/app/actions/auth.ts` (`loginAction`)
**What was wrong:** Login set the `admin_token` cookie for **any** valid credentials.
A regular customer could log in at the admin URL and receive a session cookie. The
dashboard layout re-checked the role, but the cookie was already issued.

**Fix:** After authenticating, call `/auth/me` and **verify `role === "admin"`
before setting the cookie**. Non-admins get "This account does not have
administrator access."

### 2.2 Logout didn't revoke the session
**File:** `src/app/actions/auth.ts` (`logoutAction`)
**What was wrong:** Logout only deleted the cookie; the token stayed valid for the
rest of its 7-day life and could be replayed.

**Fix:** Call `POST /auth/logout` (best-effort) to revoke server-side, then clear
the cookie.

### 2.3 Admin push-notification registration hit a dead endpoint
**File:** `src/hooks/usePushNotificationsSetup.ts`
**What was wrong:** FCM token registration POSTed to `/auth/register-fcm-token`,
which **does not exist**. Admin web-push registration failed silently every time.

**Fix:** Point it at the real endpoint, `POST /users/me/fcm-token`.

### 2.4 Admin action ↔ endpoint audit (verified, no code change needed)
Every admin button was traced to its backend route and confirmed correct (method,
payload, `require_admin` guard): **suspend / unsuspend / change role / delete user,
revoke vendor / delete vendor, approve–reject applications, product update & bulk
update & delete, system settings, tickets reply/close, broadcasts, commissions
aggregate/bill/mark-paid/set-rate, health & audit.** The suspend and revoke flows
specifically requested all resolve to working endpoints.

---

## 3. Vendors app (`vendors/`)

### 3.1 `.env` tracked in git
**What was wrong:** `.env` was committed. Values are `EXPO_PUBLIC_*` (shipped in the
client bundle, so not secret), but it shouldn't be tracked.
**Fix:** `git rm --cached .env` (already covered by `.gitignore`).

### 3.2 Sign-out didn't revoke the session
**Files:** `src/api/auth.ts`, `src/context/AuthContext.tsx`
**What was wrong:** `signOut` cleared local state and the stored token but never told
the server, so the token stayed valid until expiry.
**Fix:** Added `logout(token)` in the auth API (best-effort) and call it from
`signOut` before clearing local state.

### 3.3 Chat WebSocket sent no auth token
**File:** `src/app/chat/[vendorId].tsx`
**What was wrong:** The client opened `…/chat/ws/{user.id}` with no token — which,
combined with backend fix 1.2, would now be rejected, and previously was the client
side of the unauthenticated-chat hole.
**Fix:** Append `?token=<session token>` to the WebSocket URL so the backend can
authenticate the socket.

### 3.4 Suspended users hit a dead end — **UX**
**Files:** `src/app/(auth)/login.tsx`, `src/context/AuthContext.tsx`
**What was wrong:** The backend correctly blocks suspended accounts (403), and a
polished `suspended.tsx` screen exists — but **nothing ever routed to it**. A
suspended user saw a raw `alert("Account suspended")` on login, or was silently
bounced back to the login screen on app reload, with no explanation.
**Fix:** Detect the "suspended" error and `router.replace('/suspended')` from all
three entry points: email login, Google login, and session restore on app start.

### 3.5 Customer & vendor flow audit (verified, no code change needed)
Traced end-to-end and confirmed wired to live endpoints with proper error handling:
register → login → onboarding → browse (home / search / product / cart) → checkout
→ order tracking; and become-vendor → dashboard → add product → order status update
→ delivery-PIN verification. Checkout resolves prices and validates stock
server-side, so totals can't be tampered with client-side.

---

## 4. Known gaps (not fixed — decisions for you)

These were found during the audit but are product/scope decisions, not defects to
silently change:

1. **Vendor logo/banner upload is disabled** in `become-vendor.tsx`
   ("AWS S3 coming soon"), but the `/upload` endpoint now works against the nginx
   `/media` volume — it could be switched on without S3.
2. **Customer↔vendor chat is half-built:** customers can send messages and they save
   to the DB, but there is **no vendor-side inbox** listening, so vendors never see
   them. This is the biggest "user asks a question and gets no answer" gap.
3. **Admin token reaches client components:** the httpOnly cookie's token is passed
   into client components, so browser JS can read it. The robust fix is proxying API
   calls through Next.js route handlers — a larger refactor.
4. **Multi-vendor order status:** a vendor with one item in a multi-vendor order can
   change the whole order's status.

---

## 5. Verification

- **Backend:** all modified modules pass `python -m py_compile`.
- **Admin:** `npx tsc --noEmit` passes clean.
- **Vendors app:** `npx tsc --noEmit` passes clean.

All changes are in the working trees of the three repos and have **not** been
committed.
