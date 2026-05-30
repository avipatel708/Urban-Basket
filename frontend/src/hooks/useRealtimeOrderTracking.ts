import { useEffect, useRef, useCallback } from "react"
import { supabase, isSupabaseConfigured } from "@/supabase/client"
import { useAuthStore } from "@/store/authStore"
import type { RealtimeChannel } from "@supabase/supabase-js"

type OrderChangePayload = {
  eventType: "UPDATE" | "INSERT"
  new: Record<string, unknown>
  old: Record<string, unknown>
}

interface UseRealtimeOrderTrackingOptions {
  orderId?: string | null
  onOrderChange?: (payload: OrderChangePayload) => void
  onHistoryChange?: () => void
  enabled?: boolean
}

export function useRealtimeOrderTracking({
  orderId = null,
  onOrderChange,
  onHistoryChange,
  enabled = true,
}: UseRealtimeOrderTrackingOptions) {
  const userId = useAuthStore((s) => s.user?.id)
  const role = useAuthStore((s) => s.profile?.role)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onOrderChangeRef = useRef(onOrderChange)
  const onHistoryChangeRef = useRef(onHistoryChange)

  onOrderChangeRef.current = onOrderChange
  onHistoryChangeRef.current = onHistoryChange

  const dispatchLocalSync = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ub-orders-updated"))
      window.dispatchEvent(new Event("ub-seller-orders-updated"))
    }
  }, [])

  useEffect(() => {
    if (!enabled || !userId || !isSupabaseConfigured()) return

    let channel: RealtimeChannel | null = null

    try {
      const channelName = orderId
        ? `order-track-${orderId}`
        : role === "seller"
          ? `orders-seller-${userId}`
          : `orders-user-${userId}`

      channel = supabase.channel(channelName)

      if (role === "seller" && !orderId) {
        channel.on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "order_tracking_history" },
          () => {
            onHistoryChangeRef.current?.()
            dispatchLocalSync()
          }
        )
        channel.on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders" },
          (payload) => {
            onOrderChangeRef.current?.({
              eventType: "UPDATE",
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
            })
            dispatchLocalSync()
          }
        )
      } else {
        const ordersFilter = orderId ? `id=eq.${orderId}` : `user_id=eq.${userId}`

        channel.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: ordersFilter,
          },
          (payload) => {
            onOrderChangeRef.current?.({
              eventType: "UPDATE",
              new: payload.new as Record<string, unknown>,
              old: payload.old as Record<string, unknown>,
            })
            dispatchLocalSync()
          }
        )

        if (orderId) {
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "order_tracking_history",
              filter: `order_id=eq.${orderId}`,
            },
            () => {
              onHistoryChangeRef.current?.()
              dispatchLocalSync()
            }
          )
        }
      }

      channel.subscribe()
      channelRef.current = channel
    } catch (err) {
      console.warn("Realtime order tracking unavailable:", err)
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [enabled, userId, role, orderId, dispatchLocalSync])

  return { dispatchLocalSync }
}
