export const RETURN_WINDOW_DAYS = 10
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Delivery timestamp for return window (delivered_at, else created_at fallback).
 */
export function getDeliveryTimestamp(order) {
  if (order?.delivered_at) {
    return new Date(order.delivered_at)
  }
  if (order?.created_at) {
    return new Date(order.created_at)
  }
  return null
}

export function getReturnDeadline(order) {
  const delivered = getDeliveryTimestamp(order)
  if (!delivered || Number.isNaN(delivered.getTime())) return null
  return new Date(delivered.getTime() + RETURN_WINDOW_DAYS * MS_PER_DAY)
}

export function getReturnEligibility(order) {
  if (!order) {
    return { eligible: false, daysLeft: 0, reason: "Order not found." }
  }

  if (order.status === "returned") {
    return { eligible: false, daysLeft: 0, reason: "This order has already been returned." }
  }

  if (order.status !== "delivered") {
    return {
      eligible: false,
      daysLeft: 0,
      reason: "Returns are only available after your order is delivered.",
    }
  }

  const delivered = getDeliveryTimestamp(order)
  if (!delivered || Number.isNaN(delivered.getTime())) {
    return { eligible: false, daysLeft: 0, reason: "Could not determine delivery date." }
  }

  const deadline = getReturnDeadline(order)
  const now = Date.now()

  if (now > deadline.getTime()) {
    return {
      eligible: false,
      daysLeft: 0,
      reason: `Return window closed. Returns are allowed within ${RETURN_WINDOW_DAYS} days of delivery.`,
    }
  }

  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now) / MS_PER_DAY))
  return { eligible: true, daysLeft, reason: null }
}
