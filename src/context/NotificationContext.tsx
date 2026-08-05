import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification as apiDeleteNotification, clearAllNotifications as apiClearAll, NotificationResponse } from '../api/notifications';
import { usePushNotificationsSetup } from '../hooks/useNotifications';

interface NotificationContextType {
  notifications: NotificationResponse[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isLoading: boolean;
  pushPermissionStatus: string;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  clearAll: async () => {},
  isLoading: true,
  pushPermissionStatus: 'default',
  requestPushPermission: async () => false,
});

/**
 * A slim banner shown at the top of every screen when notification permission
 * hasn't been asked yet. The user TAPS it to trigger the OS prompt.
 * Chrome REQUIRES permission requests to originate from a user gesture (click/tap).
 */
function NotificationPermissionBanner({
  onAllow,
  onDismiss,
}: {
  onAllow: () => void;
  onDismiss: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7C3AED',
        paddingHorizontal: 16,
        paddingVertical: 11,
        gap: 10,
      }}
    >
      <Ionicons name="notifications-outline" size={18} color="#fff" />
      <Pressable onPress={onAllow} style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter-Medium' }}>
          Tap to enable order &amp; delivery notifications
        </Text>
      </Pressable>
      <Pressable onPress={onDismiss} hitSlop={10}>
        <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </View>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { permissionStatus, requestPermission } = usePushNotificationsSetup();

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time in-app notifications via WebSocket
  useEffect(() => {
    if (!token) return;
    const unsubscribe = subscribe((event) => {
      if (event.type === 'notification') {
        const newNotif = {
          id: event.id,
          user_id: event.user_id,
          title: event.title,
          body: event.body,
          type: event.notification_type,
          action_url: event.action_url,
          is_read: event.is_read || false,
          created_at: event.created_at || new Date().toISOString(),
        } as NotificationResponse;
        // Dedupe by id: the same notification can arrive twice (a user who is
        // also a vendor matches both the user and vendor broadcast, plus socket
        // reconnects can replay), and it may already be in the fetched list.
        setNotifications((prev) =>
          prev.some((n) => n.id === newNotif.id) ? prev : [newNotif, ...prev]
        );
      }
    });
    return unsubscribe;
  }, [subscribe, token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      await markNotificationRead(token, id);
    } catch (err) {
      console.warn('Failed to mark read', err);
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await markAllNotificationsRead(token);
    } catch (err) {
      console.warn('Failed to mark all read', err);
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    if (!token) return;
    const prev = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    try {
      await apiDeleteNotification(token, id);
    } catch (err) {
      console.warn('Failed to delete notification', err);
      setNotifications(prev); // revert
    }
  };

  const clearAll = async () => {
    if (!token) return;
    const prev = notifications;
    setNotifications([]);
    try {
      await apiClearAll(token);
    } catch (err) {
      console.warn('Failed to clear notifications', err);
      setNotifications(prev); // revert
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Show the banner on web only when:
  // 1. Permission hasn't been asked yet (status = 'default')
  // 2. User is logged in (has a token)
  // 3. Banner wasn't already dismissed
  const showBanner =
    Platform.OS === 'web' &&
    permissionStatus === 'default' &&
    !bannerDismissed &&
    !!token;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        isLoading,
        pushPermissionStatus: permissionStatus,
        requestPushPermission: requestPermission,
      }}
    >
      {showBanner && (
        <NotificationPermissionBanner
          onAllow={async () => {
            await requestPermission();
            setBannerDismissed(true);
          }}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
