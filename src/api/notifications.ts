const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

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
