import { supabaseAdmin } from "../config/supabase.js"
import {
  notifyOrderPlaced,
  notifyOrderStatusChange,
  notifySellersNewOrder,
} from "../services/notificationService.js"
import { deductWallet, getWalletBalance } from "../services/walletService.js"
import {
  applyReturnedOverlay,
  detectOrderReturnSchema,
  getReturnedOrderIdSet,
} from "../services/orderReturnService.js"
import {
  SELLER_SETTABLE_STATUSES,
  appendTrackingHistory,
  buildStatusTimestamps,
  computeEstimatedDelivery,
  seedInitialTrackingHistory,
  statusToTrackingStep,
} from "../services/orderTrackingService.js"

const PAYMENT_METHODS = new Set(["wallet", "gpay", "upi", "card", "cod"])
const PAYMENT_STATUSES = new Set(["paid", "pending", "failed"])

export const createOrder = async (req, res, next) => {
  try {
    const {
      total,
      shipping_address,
      items,
      payment_method = "card",
      payment_status = "paid",
      transaction_id = null,
    } = req.body
    const userId = req.user.id

    if (!total || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid order details. Total and items array are required." })
    }

    if (!PAYMENT_METHODS.has(payment_method)) {
      return res.status(400).json({ error: "Invalid payment method." })
    }

    if (!PAYMENT_STATUSES.has(payment_status)) {
      return res.status(400).json({ error: "Invalid payment status." })
    }

    if (payment_status === "failed") {
      return res.status(400).json({ error: "Payment failed. Please try again or choose another method." })
    }

    const orderTotal = parseFloat(total)

    if (payment_method === "wallet") {
      if (payment_status !== "paid") {
        return res.status(400).json({ error: "Wallet payments must be marked as paid." })
      }
      const balance = await getWalletBalance(userId)
      if (balance < orderTotal) {
        return res.status(400).json({
          error: `Insufficient wallet balance. Available: ₹${balance.toFixed(2)}, required: ₹${orderTotal.toFixed(2)}`,
        })
      }
    }

    if (payment_method === "cod") {
      if (payment_status !== "pending") {
        return res.status(400).json({ error: "COD orders must have pending payment status." })
      }
    } else if (payment_status !== "paid") {
      return res.status(400).json({ error: "Online payments must be completed before placing the order." })
    }

    // 1. Verify stock and calculate price accuracy (optional but recommended)
    for (const item of items) {
      const { data: product, error: prodError } = await supabaseAdmin
        .from("products")
        .select("stock, title")
        .eq("id", item.product_id)
        .single()

      if (prodError || !product) {
        return res.status(404).json({ error: `Product with ID ${item.product_id} not found.` })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.title}. Available: ${product.stock}, Requested: ${item.quantity}` })
      }
    }

    const resolvedTransactionId =
      transaction_id ||
      (payment_method === "cod" ? `COD_${Date.now()}` : null)

    const estimatedDelivery = computeEstimatedDelivery(new Date().toISOString())

    const orderPayload = {
      user_id: userId,
      total: orderTotal,
      shipping_address,
      status: "pending",
      tracking_step: 0,
      estimated_delivery: estimatedDelivery,
      payment_method,
      payment_status,
      transaction_id: resolvedTransactionId,
    }

    // 2. Insert order
    let orderResult = await supabaseAdmin.from("orders").insert(orderPayload).select("*").single()

    if (
      orderResult.error?.message?.includes("payment_method") ||
      orderResult.error?.message?.includes("estimated_delivery") ||
      orderResult.error?.message?.includes("tracking_step")
    ) {
      const {
        payment_method: _pm,
        payment_status: _ps,
        transaction_id: _tx,
        estimated_delivery: _ed,
        tracking_step: _ts,
        ...legacyPayload
      } = orderPayload
      orderResult = await supabaseAdmin.from("orders").insert(legacyPayload).select("*").single()
    }

    const { data: order, error: orderError } = orderResult

    if (orderError) {
      return res.status(400).json({ error: orderError.message })
    }

    // 3. Insert order items and decrease stock
    const orderItemsToInsert = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
    }))

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsToInsert)

    if (itemsError) {
      // Cleanup order on failure (visual rollback)
      await supabaseAdmin.from("orders").delete().eq("id", order.id)
      return res.status(500).json({ error: "Failed to create order items: " + itemsError.message })
    }

    // 4. Update stock in products table
    for (const item of items) {
      const { error: stockError } = await supabaseAdmin.rpc("decrease_stock", {
        p_id: item.product_id,
        qty: parseInt(item.quantity)
      })

      // Fallback if RPC doesn't exist
      if (stockError) {
        const { data: prod } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single()

        if (prod) {
          const newStock = Math.max(0, prod.stock - parseInt(item.quantity))
          await supabaseAdmin
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.product_id)
        }
      }
    }

    if (payment_method === "wallet" && payment_status === "paid") {
      try {
        await deductWallet(userId, orderTotal, `order_${order.id}`)
      } catch (walletErr) {
        await supabaseAdmin.from("order_items").delete().eq("order_id", order.id)
        await supabaseAdmin.from("orders").delete().eq("id", order.id)
        return res.status(400).json({ error: walletErr.message || "Wallet deduction failed." })
      }
    }

    await notifyOrderPlaced(order).catch((err) =>
      console.error("notifyOrderPlaced failed:", err.message)
    )
    await notifySellersNewOrder(order, orderItemsToInsert).catch((err) =>
      console.error("notifySellersNewOrder failed:", err.message)
    )

    await seedInitialTrackingHistory(order.id, "pending", userId).catch(() => {})

    return res.status(201).json({
      ...order,
      payment_method: order.payment_method || payment_method,
      payment_status: order.payment_status || payment_status,
      transaction_id: order.transaction_id || resolvedTransactionId,
    })
  } catch (err) {
    next(err)
  }
}

export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Fetch orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (
            title,
            image_url,
            category
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (ordersError) {
      return res.status(400).json({ error: ordersError.message })
    }

    const returnedIds = await getReturnedOrderIdSet().catch(() => new Set())
    const enriched = (orders || []).map((o) => applyReturnedOverlay(o, returnedIds))

    return res.status(200).json(enriched)
  } catch (err) {
    next(err)
  }
}

export const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.user.id

    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("id, title, price")
      .eq("seller_id", sellerId)

    if (prodError) {
      return res.status(400).json({ error: prodError.message })
    }

    if (!products || products.length === 0) {
      return res.status(200).json([])
    }

    const productIds = products.map((p) => p.id)
    const productMeta = new Map(
      products.map((p) => [p.id, { title: p.title, price: parseFloat(p.price) || 0 }])
    )

    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("id, order_id, product_id, quantity, price")
      .in("product_id", productIds)

    if (itemsError) {
      console.error("getSellerOrders itemsError:", itemsError)
      return res.status(400).json({ error: itemsError.message })
    }

    if (!orderItems?.length) {
      return res.status(200).json([])
    }

    const orderIds = [...new Set(orderItems.map((i) => i.order_id).filter(Boolean))]

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, total, status, created_at, user_id, shipping_address")
      .in("id", orderIds)

    if (ordersError) {
      return res.status(400).json({ error: ordersError.message })
    }

    const orderMap = new Map((orders || []).map((o) => [o.id, o]))

    const userIds = [...new Set((orders || []).map((o) => o.user_id).filter(Boolean))]
    const profileMap = new Map()

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds)

      if (profileError) {
        console.error("getSellerOrders profileError:", profileError)
      } else if (profiles) {
        profiles.forEach((p) => profileMap.set(p.id, p))
      }
    }

    const ordersMap = new Map()

    for (const item of orderItems) {
      const order = orderMap.get(item.order_id)
      if (!order) continue

      const profile = profileMap.get(order.user_id)
      const shipping =
        order.shipping_address && typeof order.shipping_address === "object"
          ? order.shipping_address
          : {}

      const customerName =
        profile?.name || shipping.name || shipping.fullName || shipping.full_name || "Customer"
      const customerEmail = profile?.email || shipping.email || ""

      if (!ordersMap.has(order.id)) {
        ordersMap.set(order.id, {
          id: order.id,
          customer: customerName,
          email: customerEmail,
          items: [],
          total: 0,
          status: order.status || "pending",
          date: order.created_at || new Date().toISOString(),
        })
      }

      const row = ordersMap.get(order.id)
      const meta = productMeta.get(item.product_id)
      const qty = parseInt(item.quantity, 10) || 1
      let unitPrice = parseFloat(item.price)
      if (!unitPrice || Number.isNaN(unitPrice)) {
        unitPrice = meta?.price || 0
      }

      row.total += unitPrice * qty
      row.items.push(`${meta?.title || "Product"} (${qty})`)
    }

    const returnedIds = await getReturnedOrderIdSet().catch(() => new Set())

    const grouped = Array.from(ordersMap.values())
      .map((o) => {
        const withReturn =
          returnedIds.has(String(o.id)) && o.status !== "returned"
            ? { ...o, status: "returned" }
            : o
        return {
          ...withReturn,
          total: parseFloat((withReturn.total || 0).toFixed(2)),
          items: withReturn.items.length > 0 ? withReturn.items.join(", ") : "—",
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return res.status(200).json(grouped)
  } catch (err) {
    next(err)
  }
}

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (req.user.role !== "seller") {
      return res.status(403).json({ error: "Only sellers can update order status." })
    }

    if (!status || !SELLER_SETTABLE_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." })
    }

    if (status === "returned") {
      return res.status(400).json({
        error: "Returns are processed by the customer via Order History (refund to wallet).",
      })
    }

    {
      const { data: sellerProducts, error: sellerProdError } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("seller_id", req.user.id)

      if (sellerProdError) {
        return res.status(400).json({ error: sellerProdError.message })
      }

      const sellerProductIds = (sellerProducts || []).map((p) => p.id)
      if (sellerProductIds.length === 0) {
        return res.status(403).json({ error: "You are not authorized to update this order." })
      }

      const { data: matchingItems, error: matchError } = await supabaseAdmin
        .from("order_items")
        .select("id")
        .eq("order_id", id)
        .in("product_id", sellerProductIds)
        .limit(1)

      if (matchError || !matchingItems?.length) {
        return res.status(403).json({ error: "You are not authorized to update this order." })
      }
    }

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !existingOrder) {
      return res.status(404).json({ error: "Order not found." })
    }

    if (existingOrder.status === "returned") {
      return res.status(400).json({ error: "Returned orders cannot be updated." })
    }

    const updatePayload = {
      status,
      tracking_step: statusToTrackingStep(status),
      ...buildStatusTimestamps(status, existingOrder),
    }
    const schema = await detectOrderReturnSchema()
    if (
      schema.hasReturnColumns &&
      status === "delivered" &&
      existingOrder.status !== "delivered" &&
      !updatePayload.delivered_at
    ) {
      updatePayload.delivered_at = new Date().toISOString()
    }

    let { data: order, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single()

    if (
      error?.message?.includes("delivered_at") ||
      error?.message?.includes("tracking_step") ||
      error?.message?.includes("shipped_at")
    ) {
      const fallback = await supabaseAdmin
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single()
      order = fallback.data
      error = fallback.error
    }

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    await appendTrackingHistory(id, status, req.user.id).catch(() => {})

    await notifyOrderStatusChange(order, status, existingOrder.status).catch((err) =>
      console.error("notifyOrderStatusChange failed:", err.message)
    )

    return res.status(200).json(order)
  } catch (err) {
    next(err)
  }
}

export const getPendingReviewItems = async (req, res, next) => {
  try {
    const userId = req.user.id

    // 1. Fetch all delivered orders for this user with their items + product info
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        order_items (
          product_id,
          products (
            title,
            image_url
          )
        )
      `)
      .eq("user_id", userId)
      .eq("status", "delivered")
      .order("created_at", { ascending: false })

    if (ordersError) {
      return res.status(400).json({ error: ordersError.message })
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json([])
    }

    // 2. Collect all product IDs from delivered orders
    const allItems = []
    for (const order of orders) {
      for (const item of order.order_items || []) {
        if (item.product_id) {
          allItems.push({
            order_id: order.id,
            product_id: item.product_id,
            product_title: item.products?.title || "Product",
            product_image: item.products?.image_url || null,
          })
        }
      }
    }

    if (allItems.length === 0) {
      return res.status(200).json([])
    }

    // 3. Get product IDs the user has already reviewed
    const { data: reviewedRows, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .select("product_id")
      .eq("user_id", userId)

    if (reviewError) {
      console.error("getPendingReviewItems reviewError:", reviewError)
    }

    const reviewedSet = new Set(
      (reviewedRows || []).map((r) => r.product_id)
    )

    // 4. Filter out already-reviewed products and deduplicate by product_id
    const seenProducts = new Set()
    const pending = []
    for (const item of allItems) {
      if (!reviewedSet.has(item.product_id) && !seenProducts.has(item.product_id)) {
        seenProducts.add(item.product_id)
        pending.push(item)
      }
    }

    return res.status(200).json(pending)
  } catch (err) {
    next(err)
  }
}
