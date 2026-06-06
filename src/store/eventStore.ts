import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecommendationEventPayload } from '../api/recommendations';

export interface QueuedEvent extends RecommendationEventPayload {
  id: string; // Client-side unique ID for tracking
}

interface EventStoreState {
  pendingEvents: QueuedEvent[];
  addEvent: (payload: RecommendationEventPayload) => void;
  removeEvents: (ids: string[]) => void;
  clearAll: () => void;
}

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
    }),
    {
      name: 'ecommerce-event-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
