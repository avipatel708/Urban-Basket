import { supabaseAdmin } from "../config/supabase.js"
import { addWalletMoney } from "../services/walletService.js"
import {
  notifyOrderReturned,
  notifySellersOrderReturned,
} from "../services/notificationService.js"
import {
  fetchCustomerOrderForReturn,
  getReturnEligibilityForOrder,
  markOrderAsReturned,
} from "../services/orderReturnService.js"
import { RETURN_WINDOW_DAYS } from "../utils/returnPolicy.js"
import { isOrderReturnedInFile } from "../utils/returnedOrdersStore.js"
import { detectWalletStorageMode } from "../services/walletService.js"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WALLET_TX_FILE = path.join(__dirname, "..", "data", "wallet-transactions.json")

async function restoreProductStock(productId, quantity) {
  const qty = parseInt(quantity, 10) || 0
  if (!qty) return

  const { error: rpcError } = await supabaseAdmin.rpc("increase_stock", {
    p_id: productId,
    qty,
  })

  if (!rpcError) return

  const { data: prod } = await supabaseAdmin
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single()

  if (prod) {
    await supabaseAdmin
      .from("products")
      .update({ stock: (parseInt(prod.stock, 10) || 0) + qty })
      .eq("id", productId)
  }
}

async function hasExistingReturnRefund(userId, orderId) {
  if (await isOrderReturnedInFile(orderId)) return true

  const reference = `return_order_${orderId}`
  const mode = await detectWalletStorageMode()

  if (mode === "file") {
    try {
      const raw = await fs.readFile(WALLET_TX_FILE, "utf8")
      const txs = JSON.parse(raw)
      if (
        Array.isArray(txs) &&
        txs.some((t) => t.user_id === userId && t.reference === reference)
      ) {
        return true
      }
    } catch {
      /* no file yet */
    }
    return false
  }

  const { data, error } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("reference", reference)
    .limit(1)

  return !error && !!data?.length
}

/**
 * GET /api/orders/:id/return-eligibility
 */
export const getOrderReturnEligibility = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { order, error } = await fetchCustomerOrderForReturn(id, userId)
    if (error || !order) {
      return res.status(404).json({ error: error || "Order not found." })
    }

    const eligibility = await getReturnEligibilityForOrder(order)
    return res.status(200).json({
      ...eligibility,
      return_window_days: RETURN_WINDOW_DAYS,
      refund_destination: "urban_basket_wallet",
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/orders/:id/return
 * Body: { reason?: string }
 */
export const requestOrderReturn = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : ""

    const { order, error } = await fetchCustomerOrderForReturn(id, userId)
    if (error || !order) {
      return res.status(404).json({ error: error || "Order not found." })
    }

    if (await hasExistingReturnRefund(userId, id)) {
      return res.status(409).json({ error: "This order has already been returned and refunded." })
    }

    const eligibility = await getReturnEligibilityForOrder(order)
    if (!eligibility.eligible) {
      return res.status(400).json({ error: eligibility.reason || "This order cannot be returned." })
    }

    const refundAmount = parseFloat(order.total)
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: "Invalid order total for refund." })
    }

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("id, product_id, quantity, price")
      .eq("order_id", id)

    if (itemsError) {
      return res.status(500).json({ error: "Failed to load order items." })
    }

    let walletResult
    try {
      walletResult = await addWalletMoney(userId, refundAmount, `return_order_${id}`)
    } catch (walletErr) {
      return res.status(500).json({
        error: walletErr.message || "Refund to wallet failed. Please contact support.",
      })
    }

    let updatedOrder
    try {
      const result = await markOrderAsReturned(id, userId, reason)
      updatedOrder = result.order
    } catch (markErr) {
      return res.status(500).json({
        error:
          markErr.message ||
          "Refund was credited but order status could not be updated. Contact support.",
      })
    }

    for (const item of orderItems || []) {
      await restoreProductStock(item.product_id, item.quantity)
    }

    await notifyOrderReturned(updatedOrder || order, refundAmount, walletResult?.balance).catch(
      (err) => console.error("notifyOrderReturned failed:", err.message)
    )
    await notifySellersOrderReturned(updatedOrder || order, orderItems || []).catch((err) =>
      console.error("notifySellersOrderReturned failed:", err.message)
    )

    return res.status(200).json({
      order: updatedOrder || { ...order, status: "returned" },
      refund_amount: refundAmount,
      wallet_balance: walletResult?.balance,
      message: `₹${refundAmount.toFixed(2)} has been credited to your Urban-Basket wallet.`,
    })
  } catch (err) {
    next(err)
  }
}
