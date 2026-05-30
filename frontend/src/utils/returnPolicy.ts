export const RETURN_WINDOW_DAYS = 10
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type ReturnBlockReason = "not_delivered" | "already_returned" | "window_closed" | "unknown"

export interface ReturnEligibility {
  eligible: boolean
  daysLeft: number
  reason?: string | null
}

export function getDeliveryDate(deliveredAt?: string | null, orderDate?: string): Date | null {
  const raw = deliveredAt || orderDate
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

export function getReturnDeadline(deliveredAt?: string | null, orderDate?: string): Date | null {
  const delivered = getDeliveryDate(deliveredAt, orderDate)
  if (!delivered) return null
  return new Date(delivered.getTime() + RETURN_WINDOW_DAYS * MS_PER_DAY)
}

export function getReturnEligibility(
  status: string,
  deliveredAt?: string | null,
  orderDate?: string
): ReturnEligibility {
  if (status === "returned") {
    return { eligible: false, daysLeft: 0, reason: "This order has already been returned." }
  }

  if (status !== "delivered") {
    return {
      eligible: false,
      daysLeft: 0,
      reason: "Returns are available after delivery.",
    }
  }

  const deadline = getReturnDeadline(deliveredAt, orderDate)
  if (!deadline) {
    return { eligible: false, daysLeft: 0, reason: "Could not determine return window." }
  }

  const now = Date.now()
  if (now > deadline.getTime()) {
    return {
      eligible: false,
      daysLeft: 0,
      reason: `Return window closed (${RETURN_WINDOW_DAYS} days after delivery).`,
    }
  }

  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now) / MS_PER_DAY))
  return { eligible: true, daysLeft }
}
