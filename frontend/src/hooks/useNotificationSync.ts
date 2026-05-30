import { useEffect, useCallback } from "react"
import { useAuthStore } from "@/store/authStore"
import { useNotificationStore } from "@/store/notificationStore"
import { fetchNotifications, markNotificationRead as markReadApi } from "@/services/notificationService"

const POLL_MS = 30000

/**
 * Loads notifications from the API and keeps them in sync for the bell dropdown.
 */
export function useNotificationSync() {
  const user = useAuthStore((s) => s.user)
  const setNotifications = useNotificationStore((s) => s.setNotifications)
  const markAsReadLocal = useNotificationStore((s) => s.markAsRead)

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }
    try {
      const data = await fetchNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load notifications:", err)
    }
  }, [user, setNotifications])

  useEffect(() => {
    loadNotifications()

    if (!user) return

    const interval = setInterval(loadNotifications, POLL_MS)
    const onFocus = () => loadNotifications()
    const onOrdersUpdated = () => loadNotifications()

    window.addEventListener("focus", onFocus)
    window.addEventListener("ub-orders-updated", onOrdersUpdated)
    window.addEventListener("ub-seller-orders-updated", onOrdersUpdated)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("ub-orders-updated", onOrdersUpdated)
      window.removeEventListener("ub-seller-orders-updated", onOrdersUpdated)
    }
  }, [user, loadNotifications])

  const markAsRead = useCallback(
    async (id: string) => {
      markAsReadLocal(id)
      try {
        await markReadApi(id)
      } catch {
        loadNotifications()
      }
    },
    [markAsReadLocal, loadNotifications]
  )

  return { markAsRead, refreshNotifications: loadNotifications }
}
