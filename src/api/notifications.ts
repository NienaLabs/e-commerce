const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1';

export interface NotificationResponse {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(token: string): Promise<NotificationResponse[]> {
  const res = await fetch(`${BASE_URL}/notifications/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(token: string, notificationId: string): Promise<NotificationResponse> {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to mark notification read');
  return res.json();
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to mark all notifications read');
}

export async function deleteNotification(token: string, notificationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete notification');
}

export async function clearAllNotifications(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notifications/clear-all`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) throw new Error('Failed to clear notifications');
}

/**
 * Maps a backend notification `action_url` to a real in-app route.
 * The backend emits links like `/profile/orders/{id}` and
 * `/vendor-dashboard/orders/{id}` which don't match the app's actual routes,
 * so we normalise them here.
 */
export function resolveNotificationRoute(actionUrl?: string): string | null {
  if (!actionUrl) return null;

  // Vendor order deep-link → vendor order detail (singular "order")
  const vendorMatch = actionUrl.match(/\/vendor-dashboard\/orders?\/([\w-]+)/);
  if (vendorMatch) return `/vendor-dashboard/order/${vendorMatch[1]}`;

  // Customer order deep-link → order tracking screen
  const orderMatch = actionUrl.match(/\/profile\/orders?\/([\w-]+)/);
  if (orderMatch) return `/order-tracking/${orderMatch[1]}`;

  // List-page fallbacks
  if (actionUrl.startsWith('/vendor-dashboard')) return '/vendor-dashboard/orders';
  if (actionUrl.startsWith('/profile/orders')) return '/profile/orders';

  return actionUrl;
}
