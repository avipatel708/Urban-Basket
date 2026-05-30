import { apiGet, apiPatch } from "./api"
import type { Notification } from "@/store/notificationStore"

export async function fetchNotifications() {
  return apiGet<Notification[]>("/notifications")
}

export async function markNotificationRead(id: string) {
  return apiPatch<Notification>(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
  return apiPatch<{ success: boolean }>("/notifications/read-all")
}
