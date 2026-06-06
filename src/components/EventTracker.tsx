import React, { useEffect, useRef } from 'react';
import { useEventStore } from '../store/eventStore';
import { useAuth } from '../context/AuthContext';
import { logBatchEvents, RecommendationEventPayload } from '../api/recommendations';

const SYNC_INTERVAL = parseInt(process.env.EXPO_PUBLIC_SYNC_INTERVAL || '5000', 10);

/**
 * Headless component that periodically syncs events to the backend.
 * Mount this at the root of the app.
 */
export function EventTracker() {
  const { pendingEvents, removeEvents } = useEventStore();
  const { token } = useAuth();
  
  // Use a ref to prevent overlapping syncs if one takes longer than the interval
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(async () => {
      if (isSyncing.current) return;
      
      const eventsToSync = useEventStore.getState().pendingEvents;
      if (eventsToSync.length === 0) return;

      isSyncing.current = true;
      try {
        // Strip the client-side 'id' before sending to backend
        const payloads: RecommendationEventPayload[] = eventsToSync.map(e => {
          const { id, ...rest } = e;
          return rest;
        });

        // Uncomment for debugging
        // console.log(`[EventTracker] Syncing ${payloads.length} events...`);
        
        await logBatchEvents(token, payloads);
        
        // Remove successfully synced events by their client-side ids
        removeEvents(eventsToSync.map(e => e.id));
        
        // console.log(`[EventTracker] Successfully synced ${payloads.length} events.`);
      } catch (error) {
        console.error('[EventTracker] Failed to sync events:', error);
        // Events remain in the store and will be retried on the next interval
      } finally {
        isSyncing.current = false;
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(intervalId);
  }, [token, removeEvents]);

  return null; // Headless component
}
