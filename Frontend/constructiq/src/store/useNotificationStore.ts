import { create } from "zustand";
import type { NotificationRecord } from "../api/notifications";

interface NotificationState {
  notifications: NotificationRecord[];
  unreadCount: number;

  setNotifications: (notifications: NotificationRecord[]) => void;
  addNotification: (notification: NotificationRecord) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      let readCountChange = 0;
      const updatedList = state.notifications.map((n) => {
        if (n.id === id && !n.is_read) {
          readCountChange = 1;
          return { ...n, is_read: true };
        }
        return n;
      });

      return {
        notifications: updatedList,
        unreadCount: Math.max(0, state.unreadCount - readCountChange),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },
}));
