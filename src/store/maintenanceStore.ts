/**
 * Platform maintenance mode.
 * ──────────────────────────
 * The backend answers every non-admin request with 503 while an admin has
 * maintenance switched on:
 *
 *   {"detail": "Platform is currently under maintenance. Please try again later."}
 *
 * Nothing in the app looked at that. Each api/ module turns any non-OK
 * response into a generic Error, React Query retries once and gives up, and
 * screens destructure with a default (`data: vendors = []`) while only
 * checking isLoading — so a paused platform rendered as a silently empty app.
 * "No items found", "0 vendors nearby", forever.
 *
 * Detection lives in a fetch interceptor rather than in handleResponse because
 * there are nine separate copies of handleResponse and 80-odd raw fetch calls;
 * one chokepoint is the only way to catch them all.
 *
 * Note there is deliberately no admin special-case here. The backend already
 * exempts admins (and /admin routes) from the 503, so an admin never receives
 * one and never trips this.
 */
import { create } from 'zustand';
import { API_BASE_URL } from '../api/client';

/**
 * Coupled, on purpose, to the literal the backend sends in main.py's
 * maintenance_mode_middleware. Matching on the message rather than on the bare
 * status code stops an infrastructure 503 — a Lambda cold-start failure, a
 * gateway blip — from showing shoppers a maintenance screen that isn't true.
 */
const MAINTENANCE_MARKER = 'maintenance';

interface MaintenanceState {
  isDown: boolean;
  /** The server's own wording, so the screen can show what the admin set. */
  message: string | null;
  /** True while a recheck is in flight, for the retry button's spinner. */
  checking: boolean;
  reportDown: (message: string | null) => void;
  clear: () => void;
  /** Ask the server whether maintenance has lifted. True means back up. */
  recheck: () => Promise<boolean>;
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  isDown: false,
  message: null,
  checking: false,

  reportDown: (message) => {
    if (get().isDown) return; // already known — don't churn subscribers
    set({ isDown: true, message });
  },

  clear: () => {
    if (!get().isDown) return;
    set({ isDown: false, message: null });
  },

  recheck: async () => {
    if (get().checking) return false;
    set({ checking: true });
    try {
      // /health is not in the middleware's allowed_paths, so it returns 503
      // while maintenance is on and 200 once it lifts — exactly the signal we
      // need. Cache-busted so no layer can hand us a stale 200.
      const res = await fetch(`${API_BASE_URL}/health?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        set({ isDown: false, message: null, checking: false });
        return true;
      }
    } catch {
      // Offline or unreachable — indistinguishable from still-down here, so
      // leave the screen up rather than bouncing the user into a broken app.
    }
    set({ checking: false });
    return false;
  },
}));

/** Pull a URL string out of whatever was passed to fetch(). */
function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return (input as Request)?.url ?? '';
}

let installed = false;

/**
 * Wrap global fetch so any 503 from our own API flips maintenance mode on, and
 * any success flips it back off. Call once, at app start.
 *
 * Only requests to API_BASE_URL are inspected — image hosts, OSRM, Nominatim
 * and Firebase are left completely alone.
 */
export function installMaintenanceInterceptor(): void {
  if (installed || typeof globalThis.fetch !== 'function') return;
  installed = true;

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async function patchedFetch(input: any, init?: any) {
    const response = await originalFetch(input, init);

    try {
      if (!urlOf(input).startsWith(API_BASE_URL)) return response;

      if (response.status === 503) {
        // clone() so the caller still gets an unread body to parse.
        let detail: string | null = null;
        try {
          const body = await response.clone().json();
          detail = typeof body?.detail === 'string' ? body.detail : null;
        } catch {
          // Non-JSON 503 — treated as infrastructure, not maintenance.
        }
        if (detail && detail.toLowerCase().includes(MAINTENANCE_MARKER)) {
          useMaintenanceStore.getState().reportDown(detail);
        }
      } else if (response.ok) {
        // Any successful API call proves the platform is serving again.
        useMaintenanceStore.getState().clear();
      }
    } catch {
      // Never let instrumentation break a real request.
    }

    return response;
  } as typeof globalThis.fetch;
}
