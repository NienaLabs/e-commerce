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
  addEvent: (payload: RecommendationEventPayload) => void;
  removeEvents: (ids: string[]) => void;
  clearAll: () => void;
  _switchUser: (userId: string | null) => void;
}

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
    (set) => ({
      pendingEvents: [],

      addEvent: (payload) => {
        const newEvent: QueuedEvent = {
          ...payload,
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        };
        set((state) => ({
          pendingEvents: [...state.pendingEvents, newEvent],
        }));
      },

      removeEvents: (ids) => {
        set((state) => ({
          pendingEvents: state.pendingEvents.filter((e) => !ids.includes(e.id)),
        }));
      },

      clearAll: () => {
        set({ pendingEvents: [] });
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
          set({ pendingEvents: stored });
        })();
      },
    }),
    {
      name: 'ecommerce-event-store', // default name; overridden dynamically via userScopedStorage
      storage: userScopedStorage,
    }
  )
);
