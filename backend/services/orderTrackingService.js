import { supabaseAdmin } from "../config/supabase.js"

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
]

export const SELLER_SETTABLE_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
]

const STATUS_TO_STEP = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: -1,
  returned: 5,
}

let trackingSchemaReady = null

export async function detectTrackingSchema() {
  if (trackingSchemaReady !== null) return trackingSchemaReady

  const { error } = await supabaseAdmin
    .from("order_tracking_history")
    .select("id")
    .limit(1)

  trackingSchemaReady = !error || !error.message?.includes("does not exist")
  return trackingSchemaReady
}

export function statusToTrackingStep(status) {
  return STATUS_TO_STEP[status] ?? 0
}

/** Estimated delivery: order date + 3–7 days (deterministic from order id when provided). */
export function computeEstimatedDelivery(createdAt, orderId = null) {
  const base = new Date(createdAt)
  let days = 5
  if (orderId) {
    const hash = String(orderId).split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    days = 3 + (hash % 5)
  } else {
    days = 3 + Math.floor(Math.random() * 5)
  }
  base.setDate(base.getDate() + days)
  return base.toISOString()
}

export function buildStatusTimestamps(status, existing = {}) {
  const now = new Date().toISOString()
  const patch = {}

  if (status === "shipped" && !existing.shipped_at) patch.shipped_at = now
  if (status === "delivered" && !existing.delivered_at) patch.delivered_at = now
  if (status === "cancelled" && !existing.cancelled_at) patch.cancelled_at = now

  return patch
}

export async function appendTrackingHistory(orderId, status, updatedBy) {
  const hasTable = await detectTrackingSchema()
  if (!hasTable) return

  const { error } = await supabaseAdmin.from("order_tracking_history").insert({
    order_id: orderId,
    status,
    updated_by: updatedBy || null,
  })

  if (error) {
    console.error("appendTrackingHistory:", error.message)
  }
}

export async function getTrackingHistory(orderId) {
  const hasTable = await detectTrackingSchema()
  if (!hasTable) return []

  const { data, error } = await supabaseAdmin
    .from("order_tracking_history")
    .select("id, order_id, status, updated_by, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("getTrackingHistory:", error.message)
    return []
  }
  return data || []
}

export async function seedInitialTrackingHistory(orderId, status, updatedBy) {
  await appendTrackingHistory(orderId, status, updatedBy)
}
