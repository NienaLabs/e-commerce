import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { RecommendationEventPayload } from '../api/recommendations';

export interface QueuedEvent extends RecommendationEventPayload {
  id: string; // Client-side unique ID for tracking
}

interface EventStoreState {
  pendingEvents: QueuedEvent[];
  /** Current browsing session. Rotates after SESSION_IDLE_MS of inactivity. */
  sessionId: string | null;
  sessionTouchedAt: number;
  /** product_ids already counted as an impression this session. */
  seenImpressions: string[];
  addEvent: (payload: RecommendationEventPayload) => void;
  /**
   * Queue a product_impression, at most once per product per session.
   * Returns false if it was a duplicate and nothing was queued.
   */
  addImpression: (productId: string, vendorId?: string) => boolean;
  getSessionId: () => string;
  removeEvents: (ids: string[]) => void;
  clearAll: () => void;
  _switchUser: (userId: string | null) => void;
}

/**
 * A session ends after this long without any tracked interaction. Search →
 * purchase attribution joins on session_id, so this is the window in which a
 * search can be credited for what followed it; 30 minutes is the usual
 * web-analytics convention and matches the backend's conversion window.
 */
const SESSION_IDLE_MS = 30 * 60 * 1000;

/** Ceiling on the per-session impression dedupe set. See addImpression. */
const MAX_TRACKED_IMPRESSIONS = 500;

const newSessionId = () =>
  `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

// Custom storage wrapper to handle both Web (localStorage) and Native (AsyncStorage) smoothly
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
    } else {
      await AsyncStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
    } else {
      await AsyncStorage.removeItem(name);
    }
  },
};

// Track the current storage key so we can change it per user
let currentStorageName = 'ecommerce-event-store';

const jsonStorage = createJSONStorage(() => customStorage);

// Wrap storage to use the dynamic key
const userScopedStorage = jsonStorage ? {
  ...jsonStorage,
  getItem: (name: string) => jsonStorage.getItem(currentStorageName),
  setItem: (name: string, value: any) => jsonStorage.setItem(currentStorageName, value),
  removeItem: (name: string) => jsonStorage.removeItem(currentStorageName),
} : undefined;

export const useEventStore = create<EventStoreState>()(
  persist(
    (set, get) => ({
      pendingEvents: [],
      sessionId: null,
      sessionTouchedAt: 0,
      seenImpressions: [],

      /**
       * The current session id, starting or rotating one if needed.
       *
       * Rotating here rather than on a timer means the session only ever
       * advances when something actually happens, so a phone left in a pocket
       * doesn't churn through empty sessions.
       */
      getSessionId: () => {
        const now = Date.now();
        const { sessionId, sessionTouchedAt } = get();
        if (!sessionId || now - sessionTouchedAt > SESSION_IDLE_MS) {
          const fresh = newSessionId();
          // New session, so impressions may be counted again.
          set({ sessionId: fresh, sessionTouchedAt: now, seenImpressions: [] });
          return fresh;
        }
        set({ sessionTouchedAt: now });
        return sessionId;
      },

      addEvent: (payload) => {
        // session_id and occurred_at are stamped here rather than at the call
        // sites, so every existing caller gets them without being touched.
        //
        // Both were missing entirely before: session_id was declared on the
        // payload type but never set by anyone, so it was NULL on every row in
        // production and nothing could be traced from a search to a sale. And
        // occurred_at was decided by the server on receipt, which is not when
        // the interaction happened — events sit in this queue until the next
        // sync, longer if the device is offline.
        const newEvent: QueuedEvent = {
          ...payload,
          session_id: payload.session_id ?? get().getSessionId(),
          occurred_at: payload.occurred_at ?? new Date().toISOString(),
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        };
        set((state) => ({
          pendingEvents: [...state.pendingEvents, newEvent],
        }));
      },

      addImpression: (productId, vendorId) => {
        if (!productId) return false;

        // Resolve the session FIRST. It may have gone idle, in which case
        // getSessionId rotates it and clears seenImpressions — doing that after
        // recording this product would wipe the entry we just wrote.
        const sessionId = get().getSessionId();

        // Impressions fire whenever a card scrolls into view, which is orders of
        // magnitude more often than any other event. Without this guard a single
        // scroll up and down a list would queue the same product repeatedly,
        // flooding both the upload batch and the user_event table, and inflating
        // the very denominator the funnel depends on.
        if (get().seenImpressions.includes(productId)) return false;

        set((state) => ({
          // Bounded: a long session browsing a big catalogue would otherwise
          // grow this array without limit and rewrite all of it to storage on
          // every scroll. Past the cap the oldest entries fall out, so a product
          // seen and then re-seen much later counts twice — a fair trade.
          seenImpressions: [...state.seenImpressions, productId].slice(-MAX_TRACKED_IMPRESSIONS),
        }));
        get().addEvent({
          event_type: 'product_impression',
          product_id: productId,
          vendor_id: vendorId,
          session_id: sessionId,
        });
        return true;
      },

      removeEvents: (ids) => {
        set((state) => ({
          pendingEvents: state.pendingEvents.filter((e) => !ids.includes(e.id)),
        }));
      },

      clearAll: () => {
        set({ pendingEvents: [], seenImpressions: [] });
      },

      _switchUser: (userId: string | null) => {
        const nextName = userId
          ? `ecommerce-event-store-${userId}`
          : 'ecommerce-event-store-guest';
        if (currentStorageName === nextName) return;
        currentStorageName = nextName;

        // Same hazard as the cart and wishlist stores: clearing state after
        // repointing the key persists the empty array over the queue, and the
        // rehydrate that follows just reads it back. Events queued but not yet
        // uploaded were dropped on every launch.
        void (async () => {
          let stored: QueuedEvent[] = [];
          try {
            const raw = await customStorage.getItem(nextName);
            if (raw) stored = JSON.parse(raw)?.state?.pendingEvents ?? [];
          } catch {
            stored = [];
          }
          // A different person at the same device is a different session — one
          // user's browsing must never be attributed to the next one's search.
          // Null rather than a fresh id so the next tracked interaction mints
          // one; signing out and back in without browsing shouldn't burn one.
          set({
            pendingEvents: stored,
            sessionId: null,
            sessionTouchedAt: 0,
            seenImpressions: [],
          });
        })();
      },
    }),
    {
      name: 'ecommerce-event-store', // default name; overridden dynamically via userScopedStorage
      storage: userScopedStorage,
    }
  )
);
