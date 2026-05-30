/** Canonical delivery pipeline (Amazon / Flipkart style). */
export const TRACKING_PIPELINE = [
  { key: "pending", label: "Order Placed", shortLabel: "Placed" },
  { key: "confirmed", label: "Confirmed", shortLabel: "Confirmed" },
  { key: "packed", label: "Packed", shortLabel: "Packed" },
  { key: "shipped", label: "Shipped", shortLabel: "Shipped" },
  { key: "out_for_delivery", label: "Out For Delivery", shortLabel: "Out for delivery" },
  { key: "delivered", label: "Delivered", shortLabel: "Delivered" },
] as const

export type TrackingPipelineKey = (typeof TRACKING_PIPELINE)[number]["key"]

export interface TimelineStepView {
  key: string
  label: string
  shortLabel: string
  completed: boolean
  active: boolean
  pending: boolean
}

export interface TrackingHistoryEntry {
  id: string
  order_id: string
  status: string
  updated_by: string | null
  created_at: string
}

/** Map legacy `processing` to packed step index. */
export function normalizeOrderStatus(status: string): string {
  if (status === "processing") return "packed"
  return status
}

export function statusToStepIndex(status: string): number {
  const normalized = normalizeOrderStatus(status)
  if (normalized === "cancelled") return -1
  if (normalized === "returned") return TRACKING_PIPELINE.length - 1
  const idx = TRACKING_PIPELINE.findIndex((s) => s.key === normalized)
  return idx >= 0 ? idx : 0
}

export function buildTimelineSteps(status: string): TimelineStepView[] {
  const normalized = normalizeOrderStatus(status)
  if (normalized === "cancelled") {
    const cancelledSteps: TimelineStepView[] = TRACKING_PIPELINE.map((step, i) => ({
      ...step,
      completed: i === 0,
      active: i === 1,
      pending: i > 1,
    }))
    cancelledSteps.push({
      key: "cancelled",
      label: "Cancelled",
      shortLabel: "Cancelled",
      completed: true,
      active: true,
      pending: false,
    })
    return cancelledSteps
  }

  const activeIndex = statusToStepIndex(status)

  return TRACKING_PIPELINE.map((step, i) => ({
    ...step,
    completed: i < activeIndex || (normalized === "delivered" && i <= activeIndex),
    active:
      normalized === "delivered"
        ? i === activeIndex
        : i === activeIndex && i < TRACKING_PIPELINE.length - 1,
    pending: i > activeIndex,
  }))
}

export function getDeliveryProgressPercent(status: string): number {
  if (normalizeOrderStatus(status) === "cancelled") return 0
  const idx = statusToStepIndex(status)
  if (idx < 0) return 0
  return Math.round(((idx + 1) / TRACKING_PIPELINE.length) * 100)
}

export function formatEstimatedDelivery(iso: string | null | undefined): string {
  if (!iso) return "Calculating…"
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

export function countActiveShipments(statuses: string[]): number {
  const active = new Set([
    "pending",
    "confirmed",
    "packed",
    "processing",
    "shipped",
    "out_for_delivery",
  ])
  return statuses.filter((s) => active.has(s)).length
}

export function getStatusBadgeVariant(
  status: string
): "delivered" | "shipping" | "processing" | "cancelled" | "returned" | "default" {
  const s = normalizeOrderStatus(status)
  if (s === "delivered") return "delivered"
  if (s === "cancelled") return "cancelled"
  if (s === "returned") return "returned"
  if (s === "shipped" || s === "out_for_delivery") return "shipping"
  if (s === "pending" || s === "confirmed" || s === "packed") return "processing"
  return "default"
}
