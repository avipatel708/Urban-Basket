import { supabaseAdmin } from "../config/supabase.js"
import { deductWallet, getWalletBalance } from "../services/walletService.js"
import {
  listMysteryBoxes,
  getMysteryBoxById,
  selectRandomProducts,
  decrementMysteryBoxStock,
  decrementProductStock,
  saveMysteryReward,
  getUserMysteryRewards,
  getMysteryRewardById,
} from "../services/mysteryBoxService.js"
import { notifyOrderPlaced, notifySellersNewOrder } from "../services/notificationService.js"
import { seedInitialTrackingHistory, computeEstimatedDelivery } from "../services/orderTrackingService.js"

const PAYMENT_METHODS = new Set(["wallet", "gpay", "upi", "card", "cod"])
const PAYMENT_STATUSES = new Set(["paid", "pending", "failed"])

export const getMysteryBoxes = async (req, res, next) => {
  try {
    const boxes = await listMysteryBoxes()
    return res.status(200).json(boxes)
  } catch (err) {
    next(err)
  }
}

export const getMysteryBox = async (req, res, next) => {
  try {
    const box = await getMysteryBoxById(req.params.id)
    if (!box) return res.status(404).json({ error: "Mystery box not found." })
    return res.status(200).json(box)
  } catch (err) {
    next(err)
  }
}

export const getMyMysteryRewards = async (req, res, next) => {
  try {
    const rewards = await getUserMysteryRewards(req.user.id)
    return res.status(200).json(rewards)
  } catch (err) {
    next(err)
  }
}

export const getMyMysteryReward = async (req, res, next) => {
  try {
    const reward = await getMysteryRewardById(req.params.rewardId, req.user.id)
    if (!reward) return res.status(404).json({ error: "Reward not found." })
    return res.status(200).json(reward)
  } catch (err) {
    next(err)
  }
}

export const purchaseMysteryBox = async (req, res, next) => {
  try {
    const boxId = req.params.id
    const {
      shipping_address,
      payment_method = "card",
      payment_status = "paid",
      transaction_id = null,
    } = req.body

    const userId = req.user.id

    if (!shipping_address || typeof shipping_address !== "object") {
      return res.status(400).json({ error: "Shipping address is required." })
    }

    if (!PAYMENT_METHODS.has(payment_method)) {
      return res.status(400).json({ error: "Invalid payment method." })
    }

    if (!PAYMENT_STATUSES.has(payment_status)) {
      return res.status(400).json({ error: "Invalid payment status." })
    }

    const box = await getMysteryBoxById(boxId)
    if (!box) return res.status(404).json({ error: "Mystery box not found." })

    if (box.stock !== undefined && box.stock < 1) {
      return res.status(400).json({ error: "This mystery box is sold out." })
    }

    const boxPrice = parseFloat(box.price)

    if (payment_method === "wallet") {
      const balance = await getWalletBalance(userId)
      if (balance < boxPrice) {
        return res.status(400).json({
          error: `Insufficient wallet balance. Need ₹${boxPrice.toFixed(0)}, have ₹${balance.toFixed(0)}.`,
        })
      }
    }

    if (payment_method === "cod" && payment_status !== "pending") {
      return res.status(400).json({ error: "COD mystery box orders must be pending until delivery." })
    }

    if (payment_method !== "cod" && payment_status !== "paid") {
      return res.status(400).json({ error: "Payment must be completed before opening the box." })
    }

    const { products, total_retail_value } = await selectRandomProducts(box)

    for (const item of products) {
      const { data: prod } = await supabaseAdmin
        .from("products")
        .select("stock, title")
        .eq("id", item.product_id)
        .single()

      if (!prod || prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Product "${item.title}" is no longer in stock. Please try again.`,
        })
      }
    }

    const resolvedTransactionId =
      transaction_id ||
      (payment_method === "cod" ? `COD_MB_${Date.now()}` : `MB_${Date.now()}`)

    const estimatedDelivery = computeEstimatedDelivery(new Date().toISOString())

    const orderPayload = {
      user_id: userId,
      total: boxPrice,
      shipping_address,
      status: "pending",
      tracking_step: 0,
      estimated_delivery: estimatedDelivery,
      payment_method,
      payment_status,
      transaction_id: resolvedTransactionId,
    }

    let orderResult = await supabaseAdmin.from("orders").insert(orderPayload).select("*").single()

    if (
      orderResult.error?.message?.includes("payment_method") ||
      orderResult.error?.message?.includes("estimated_delivery") ||
      orderResult.error?.message?.includes("tracking_step") ||
      orderResult.error?.message?.includes("orders_status_check")
    ) {
      const {
        payment_method: _pm,
        payment_status: _ps,
        transaction_id: _tx,
        estimated_delivery: _ed,
        tracking_step: _ts,
        ...legacy
      } = orderPayload
      orderResult = await supabaseAdmin.from("orders").insert(legacy).select("*").single()
    }

    const { data: order, error: orderError } = orderResult
    if (orderError) {
      return res.status(400).json({ error: orderError.message })
    }

    const orderItems = products.map((p) => ({
      order_id: order.id,
      product_id: p.product_id,
      quantity: p.quantity,
      price: p.price,
    }))

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems)

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id)
      return res.status(500).json({ error: "Failed to create order items." })
    }

    await decrementProductStock(products)
    await decrementMysteryBoxStock(box.id)

    if (payment_method === "wallet" && payment_status === "paid") {
      try {
        await deductWallet(userId, boxPrice, `mystery_${order.id}`)
      } catch (walletErr) {
        await supabaseAdmin.from("order_items").delete().eq("order_id", order.id)
        await supabaseAdmin.from("orders").delete().eq("id", order.id)
        return res.status(400).json({ error: walletErr.message || "Wallet deduction failed." })
      }
    }

    const reward = await saveMysteryReward({
      userId,
      mysteryBoxId: box.id,
      orderId: order.id,
      products,
      totalRetailValue: total_retail_value,
      boxPrice,
    })

    await notifyOrderPlaced(order).catch(() => {})
    await notifySellersNewOrder(order, orderItems).catch(() => {})
    await seedInitialTrackingHistory(order.id, order.status || "pending", userId).catch(() => {})

    return res.status(201).json({
      reward,
      order,
      box: { id: box.id, title: box.title, slug: box.slug },
      reveal: {
        products,
        total_retail_value,
        box_price: boxPrice,
        savings: Math.max(0, total_retail_value - boxPrice),
      },
    })
  } catch (err) {
    if (err.message?.includes("Not enough") || err.message?.includes("Unable to meet")) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}
