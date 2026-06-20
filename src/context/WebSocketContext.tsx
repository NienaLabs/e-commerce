/**
 * WebSocketContext
 * ────────────────
 * Provides a platform-wide WebSocket connection that auto-reconnects.
 * Vendors connect to /ws/vendor/{vendor_id}
 * Users connect to /ws/user/{user_id}
 *
 * All screens can subscribe to events via the `useWebSocket` hook.
 * QueryClient cache is automatically invalidated on order events.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export type WsEventType =
  | 'new_order'
  | 'order_status_changed'
  | 'notification';

export interface WsEvent {
  type: WsEventType;
  [key: string]: any;
}

type Listener = (event: WsEvent) => void;

interface WebSocketContextType {
  /** Subscribe to WS events; returns an unsubscribe function */
  subscribe: (listener: Listener) => () => void;
  /** Returns true if the connection is currently live */
  isConnected: () => boolean;
}

// ── Context ────────────────────────────────────────────────────────────────────

const WebSocketContext = createContext<WebSocketContextType>({
  subscribe: () => () => {},
  isConnected: () => false,
});

// ── Provider ───────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000')
  .replace(/^http/, 'ws'); // → ws:// or wss://

const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 25000;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, vendor } = useAuth();
  const queryClient = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<Listener>>(new Set());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectedRef = useRef(false);
  const shouldConnectRef = useRef(true);

  // ── Build the WS URL based on who is logged in ────────────────────────────

  const buildWsUrl = useCallback((): string | null => {
    if (vendor?.id) return `${BASE_URL}/ws/vendor/${vendor.id}`;
    if (user?.id)   return `${BASE_URL}/ws/user/${user.id}`;
    return null;
  }, [vendor?.id, user?.id]);

  // ── Emit incoming events to all subscribers ───────────────────────────────

  const emit = useCallback((event: WsEvent) => {
    listenersRef.current.forEach(fn => {
      try { fn(event); } catch (e) { console.warn('[WS] listener error', e); }
    });

    // Built-in auto-invalidation for order events
    if (event.type === 'new_order') {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    }
    if (event.type === 'order_status_changed') {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-order', event.order_id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', event.order_id] });
    }
  }, [queryClient]);

  // ── Connect / reconnect ───────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!shouldConnectRef.current) return;

    const url = buildWsUrl();
    if (!url) return; // no user or vendor yet

    // Cleanup previous socket if still around
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        isConnectedRef.current = true;
        // Start keep-alive pings
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (e) => {
        if (e.data === 'pong') return;
        try {
          const event: WsEvent = JSON.parse(e.data);
          emit(event);
        } catch {
          // ignore unparseable messages
        }
      };

      ws.onerror = () => {
        isConnectedRef.current = false;
      };

      ws.onclose = () => {
        isConnectedRef.current = false;
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        if (shouldConnectRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    } catch (e) {
      console.warn('[WS] failed to open socket:', e);
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    }
  }, [buildWsUrl, emit]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    shouldConnectRef.current = true;
    connect();

    // Handle app coming back to foreground
    let appStateSub: any;
    if (Platform.OS !== 'web') {
      appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
        if (state === 'active') {
          if (!isConnectedRef.current) connect();
        }
      });
    }

    return () => {
      shouldConnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      appStateSub?.remove();
    };
  }, [connect]);

  // ── Context API ────────────────────────────────────────────────────────────

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const isConnected = useCallback(() => isConnectedRef.current, []);

  return (
    <WebSocketContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useWebSocket() {
  return useContext(WebSocketContext);
}

/** Subscribe to specific event types, auto-unsubscribes on unmount */
export function useWsEvent(type: WsEventType, handler: (event: WsEvent) => void) {
  const { subscribe } = useWebSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsub = subscribe((event) => {
      if (event.type === type) handlerRef.current(event);
    });
    return unsub;
  }, [subscribe, type]);
}
