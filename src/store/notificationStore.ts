import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: number;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  addNotification: (notif) => set((state) => {
    // Avoid duplicates if same ID is received
    if (state.notifications.some((n) => n.id === notif.id)) return state;
    return {
      notifications: [
        { ...notif, read: false, createdAt: Date.now() },
        ...state.notifications,
      ],
    };
  }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
  })),
  clearAll: () => set({ notifications: [] }),
  getUnreadCount: () => {
    const { notifications } = get();
    return notifications.filter((n) => !n.read).length;
  },
}));
