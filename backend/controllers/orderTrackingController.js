import { supabaseAdmin } from "../config/supabase.js"
import {
  getTrackingHistory,
  computeEstimatedDelivery,
  statusToTrackingStep,
} from "../services/orderTrackingService.js"
import { applyReturnedOverlay, getReturnedOrderIdSet } from "../services/orderReturnService.js"

async function assertOrderAccess(order, user) {
  if (order.user_id === user.id) return true

  if (user.role === "seller") {
    const { data: sellerProducts } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("seller_id", user.id)

    const productIds = (sellerProducts || []).map((p) => p.id)
    if (!productIds.length) return false

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("order_id", order.id)
      .in("product_id", productIds)
      .limit(1)

    return Boolean(items?.length)
  }

  return false
}

export const getOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          products ( title, image_url, category )
        )
      `
      )
      .eq("id", id)
      .single()

    if (error || !order) {
      return res.status(404).json({ error: "Order not found." })
    }

    if (!(await assertOrderAccess(order, req.user))) {
      return res.status(403).json({ error: "Not authorized to view this order." })
    }

    const returnedIds = await getReturnedOrderIdSet().catch(() => new Set())
    const enriched = applyReturnedOverlay(order, returnedIds)

    const estimated =
      enriched.estimated_delivery ||
      computeEstimatedDelivery(enriched.created_at, enriched.id)

    const history = await getTrackingHistory(id)

    return res.status(200).json({
      order: {
        ...enriched,
        tracking_step: enriched.tracking_step ?? statusToTrackingStep(enriched.status),
        estimated_delivery: estimated,
      },
      history,
    })
  } catch (err) {
    next(err)
  }
}

export const getOrderTrackingHistory = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", id)
      .single()

    if (error || !order) {
      return res.status(404).json({ error: "Order not found." })
    }

    if (!(await assertOrderAccess(order, req.user))) {
      return res.status(403).json({ error: "Not authorized." })
    }

    const history = await getTrackingHistory(id)
    return res.status(200).json({ history })
  } catch (err) {
    next(err)
  }
}
