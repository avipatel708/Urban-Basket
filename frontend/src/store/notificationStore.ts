import { create } from "zustand"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  is_read: boolean
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "is_read" | "created_at">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  setNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      is_read: false,
      created_at: new Date().toISOString(),
    }
    const notifications = [newNotif, ...get().notifications]
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    })
  },

  markAsRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    )
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    })
  },

  markAllAsRead: () => {
    set({
      notifications: get().notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    })
  },

  removeNotification: (id) => {
    const notifications = get().notifications.filter((n) => n.id !== id)
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    })
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
}))
