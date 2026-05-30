import { apiGet } from "./api"
import type { OrderWithItems } from "./orderService"
import type { TrackingHistoryEntry } from "@/utils/orderTracking"

export interface OrderTrackingResponse {
  order: OrderWithItems & {
    tracking_step?: number
    estimated_delivery?: string | null
    shipped_at?: string | null
    cancelled_at?: string | null
  }
  history: TrackingHistoryEntry[]
}

export async function getOrderTracking(orderId: string) {
  return apiGet<OrderTrackingResponse>(`/orders/${orderId}/tracking`)
}

export async function getOrderTrackingHistory(orderId: string) {
  return apiGet<{ history: TrackingHistoryEntry[] }>(`/orders/${orderId}/tracking/history`)
}
