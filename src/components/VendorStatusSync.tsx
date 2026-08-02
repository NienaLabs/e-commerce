/**
 * VendorStatusSync
 * ────────────────
 * Keeps the client's idea of "am I a vendor, and am I approved?" in step with
 * the server without a page reload.
 *
 * When an admin approves an application the backend emits a `vendor_approved`
 * notification over the WebSocket. Before this existed the app kept its stale
 * `vendor.is_verified === false`, so the sidebar showed the Vendor Dashboard
 * link but opening it hit the "Verification Pending" screen until a hard
 * refresh. We now re-pull the vendor profile and the user record the moment
 * that event lands.
 *
 * Belt-and-braces: while the vendor is still unverified we also re-check on a
 * slow interval and whenever the app comes back to the foreground, so approval
 * still lands if the socket was down at the time.
 *
 * It also handles `commission_rate_changed`, which the backend broadcasts when
 * an admin edits the platform rate or a vendor's override, so the commission
 * figures repoint at the new rate without waiting for the next poll.
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useToast } from '../context/ToastContext';

const RECHECK_INTERVAL_MS = 30_000;

export function VendorStatusSync() {
  const { token, vendor, refreshVendor, refreshUser } = useAuth();
  const { subscribe } = useWebSocket();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Keep the latest callbacks in a ref so the subscription effect doesn't
  // re-run (and re-subscribe) on every auth-state change.
  const syncRef = useRef<() => void>(() => {});
  useLayoutEffect(() => {
    syncRef.current = async () => {
      await Promise.all([refreshVendor(), refreshUser()]);
      queryClient.invalidateQueries({ queryKey: ['vendor-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-commissions'] });
    };
  });

  // ── React to the approval/rejection events ──────────────────────────────
  useEffect(() => {
    if (!token) return;
    return subscribe((event) => {
      if (event.type === 'commission_rate_changed') {
        queryClient.invalidateQueries({ queryKey: ['vendor-commissions'] });
        return;
      }
      if (event.type !== 'notification') return;
      const kind = event.notification_type;
      if (kind === 'vendor_approved') {
        syncRef.current();
        showToast('Your store is approved — your dashboard is now open.', 'success');
      } else if (kind === 'vendor_rejected') {
        syncRef.current();
      } else if (kind === 'commission_rate_changed') {
        queryClient.invalidateQueries({ queryKey: ['vendor-commissions'] });
      }
    });
  }, [subscribe, token, showToast, queryClient]);

  // ── Fallback: poll while still awaiting approval ────────────────────────
  const isAwaitingApproval = !!vendor && vendor.is_verified === false;

  useEffect(() => {
    if (!token || !isAwaitingApproval) return;

    const timer = setInterval(() => syncRef.current(), RECHECK_INTERVAL_MS);

    let cleanupFocus: (() => void) | undefined;
    if (Platform.OS === 'web') {
      const onFocus = () => syncRef.current();
      window.addEventListener('focus', onFocus);
      cleanupFocus = () => window.removeEventListener('focus', onFocus);
    } else {
      const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
        if (state === 'active') syncRef.current();
      });
      cleanupFocus = () => sub.remove();
    }

    return () => {
      clearInterval(timer);
      cleanupFocus?.();
    };
  }, [token, isAwaitingApproval]);

  return null;
}
