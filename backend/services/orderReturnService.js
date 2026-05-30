import { supabaseAdmin } from "../config/supabase.js"
import {
  getReturnedOrderIdsFromFile,
  isOrderReturnedInFile,
  markOrderReturnedInFile,
} from "../utils/returnedOrdersStore.js"
import { getReturnEligibility } from "../utils/returnPolicy.js"

let schemaCache = null

/**
 * Detect whether order-returns.sql has been applied.
 */
export async function detectOrderReturnSchema() {
  if (schemaCache) return schemaCache

  const { error } = await supabaseAdmin.from("orders").select("delivered_at").limit(1)

  const hasReturnColumns = !error?.message?.toLowerCase().includes("delivered_at")

  schemaCache = {
    hasReturnColumns,
    allowsReturnedStatus: hasReturnColumns,
  }

  if (!hasReturnColumns) {
    console.warn(
      "⚠️  Order returns: run backend/migrations/order-returns.sql in Supabase SQL Editor (using file fallback for returned orders)."
    )
  }

  return schemaCache
}

export function applyReturnedOverlay(order, returnedIds) {
  if (!order?.id) return order
  if (order.status === "returned") return order
  if (returnedIds?.has(String(order.id))) {
    return { ...order, status: "returned" }
  }
  return order
}

/**
 * Fetch a customer's order for return flows (works before migration).
 */
export async function fetchCustomerOrderForReturn(orderId, userId) {
  const id = String(orderId || "").trim()
  if (!id) {
    return { order: null, error: "Invalid order id." }
  }

  const coreSelect = "id, user_id, status, total, created_at"
  let { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(coreSelect)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return { order: null, error: error.message }
  }

  if (!order) {
    return { order: null, error: "Order not found." }
  }

  const schema = await detectOrderReturnSchema()
  if (schema.hasReturnColumns) {
    const { data: extended, error: extErr } = await supabaseAdmin
      .from("orders")
      .select(`${coreSelect}, delivered_at, returned_at, return_reason`)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle()
    if (!extErr && extended) order = extended
  }

  const { data: paymentCols, error: payErr } = await supabaseAdmin
    .from("orders")
    .select("payment_method, payment_status")
    .eq("id", id)
    .maybeSingle()

  if (!payErr && paymentCols) {
    order = { ...order, ...paymentCols }
  }

  const returnedInFile = await isOrderReturnedInFile(id)
  if (returnedInFile && order.status !== "returned") {
    order = { ...order, status: "returned" }
  }

  return { order, error: null }
}

export async function getReturnEligibilityForOrder(order) {
  if (!order) {
    return { eligible: false, daysLeft: 0, reason: "Order not found." }
  }

  if (order.status === "returned") {
    return { eligible: false, daysLeft: 0, reason: "This order has already been returned." }
  }

  return getReturnEligibility(order)
}

/**
 * Mark order returned in DB and/or local fallback store.
 */
export async function markOrderAsReturned(orderId, userId, reason = "") {
  const schema = await detectOrderReturnSchema()
  const returnedAt = new Date().toISOString()

  if (schema.allowsReturnedStatus) {
    const updatePayload = {
      status: "returned",
      returned_at: returnedAt,
      return_reason: reason || null,
    }

    let { data, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .eq("user_id", userId)
      .eq("status", "delivered")
      .select("*")
      .single()

    if (
      error?.message?.includes("returned_at") ||
      error?.message?.includes("return_reason")
    ) {
      const fallback = await supabaseAdmin
        .from("orders")
        .update({ status: "returned" })
        .eq("id", orderId)
        .eq("user_id", userId)
        .eq("status", "delivered")
        .select("*")
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (!error && data) {
      return { order: data, usedFileFallback: false }
    }

    if (error?.message?.includes("orders_status_check")) {
      await markOrderReturnedInFile(orderId)
      const { order } = await fetchCustomerOrderForReturn(orderId, userId)
      return {
        order: order ? { ...order, status: "returned" } : { id: orderId, status: "returned" },
        usedFileFallback: true,
      }
    }

    if (error) {
      throw new Error(error.message)
    }
  }

  await markOrderReturnedInFile(orderId)
  const { order } = await fetchCustomerOrderForReturn(orderId, userId)
  return {
    order: order ? { ...order, status: "returned" } : { id: orderId, status: "returned" },
    usedFileFallback: true,
  }
}

export async function getReturnedOrderIdSet() {
  const schema = await detectOrderReturnSchema()
  const ids = await getReturnedOrderIdsFromFile()

  if (schema.allowsReturnedStatus) {
    const { data } = await supabaseAdmin.from("orders").select("id").eq("status", "returned")
    for (const row of data || []) {
      if (row?.id) ids.add(String(row.id))
    }
  }

  return ids
}
