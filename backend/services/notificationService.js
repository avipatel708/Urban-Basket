import { supabaseAdmin } from "../config/supabase.js"

export const AUDIENCE = {
  CUSTOMER: "customer",
  SELLER: "seller",
}

const ORDER_STATUS_MESSAGES = {
  pending: {
    title: "Order received",
    message: "Your order is confirmed and pending. We'll update you when processing starts.",
    type: "info",
  },
  processing: {
    title: "Order processing",
    message: "Your order is now being prepared for shipment.",
    type: "info",
  },
  shipped: {
    title: "Order shipped",
    message: "Your order is on the way! Track status anytime in Order History.",
    type: "success",
  },
  delivered: {
    title: "Order delivered",
    message: "Your order has been delivered. Thank you for shopping with Urban-Basket!",
    type: "success",
  },
  cancelled: {
    title: "Order cancelled",
    message: "Your order was cancelled. Contact support if you need help.",
    type: "warning",
  },
  returned: {
    title: "Return completed",
    message: "Your return was processed. The refund has been added to your Urban-Basket wallet.",
    type: "success",
  },
}

const SELLER_TITLE_PREFIXES = [
  "new order received",
  "your deal is live",
  "price drop alert",
  "sale recorded",
  "new product review",
  "order returned",
]

/**
 * Insert a notification for one user (tagged customer or seller).
 */
export async function createNotification(
  userId,
  { title, message, type = "info", audience = AUDIENCE.CUSTOMER }
) {
  if (!userId || !title || !message) return null

  const row = {
    user_id: userId,
    title,
    message,
    type,
    audience,
    is_read: false,
  }

  let { data, error } = await supabaseAdmin.from("notifications").insert(row).select("*").single()

  if (error?.message?.includes("audience")) {
    const { audience: _a, ...withoutAudience } = row
    const fallback = await supabaseAdmin.from("notifications").insert(withoutAudience).select("*").single()
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error("createNotification error:", error.message)
    return null
  }

  return data
}

/**
 * Batch insert notifications for multiple users.
 */
export async function createNotificationsForUsers(
  userIds,
  { title, message, type = "info", audience = AUDIENCE.CUSTOMER }
) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))]
  if (!uniqueIds.length || !title || !message) return []

  const rows = uniqueIds.map((userId) => ({
    user_id: userId,
    title,
    message,
    type,
    audience,
    is_read: false,
  }))

  let { data, error } = await supabaseAdmin.from("notifications").insert(rows).select("*")

  if (error?.message?.includes("audience")) {
    const rowsWithout = rows.map(({ audience: _a, ...rest }) => rest)
    const fallback = await supabaseAdmin.from("notifications").insert(rowsWithout).select("*")
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error("createNotificationsForUsers error:", error.message)
    return []
  }

  return data || []
}

/**
 * Notify all customer accounts (sales, deals, discounts only).
 */
export async function notifyAllCustomers({ title, message, type = "info" }) {
  const { data: customers, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "customer")

  if (error) {
    console.error("notifyAllCustomers error:", error.message)
    return []
  }

  return createNotificationsForUsers(
    (customers || []).map((c) => c.id),
    { title, message, type, audience: AUDIENCE.CUSTOMER }
  )
}

/**
 * Notify wishlist customers only (not sellers).
 */
export async function notifyWishlistForProduct(productId, { title, message, type = "info" }) {
  const { data: wishlist, error } = await supabaseAdmin
    .from("wishlist")
    .select("user_id")
    .eq("product_id", productId)

  if (error) {
    console.error("notifyWishlistForProduct error:", error.message)
    return []
  }

  const userIds = (wishlist || []).map((w) => w.user_id).filter(Boolean)
  if (!userIds.length) return []

  const { data: customers } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .in("id", userIds)
    .eq("role", "customer")

  return createNotificationsForUsers(
    (customers || []).map((c) => c.id),
    { title, message, type, audience: AUDIENCE.CUSTOMER }
  )
}

function shortOrderId(orderId) {
  return orderId ? String(orderId).slice(0, 8) : ""
}

/**
 * Customer only — order confirmation.
 */
export async function notifyOrderPlaced(order) {
  if (!order?.user_id) return null

  const sid = shortOrderId(order.id)
  return createNotification(order.user_id, {
    title: "Order placed successfully",
    message: `Order #${sid} is confirmed. Total ₹${Number(order.total || 0).toFixed(0)}. Track it in Order History.`,
    type: "success",
    audience: AUDIENCE.CUSTOMER,
  })
}

/**
 * Seller only — new order on their products.
 */
export async function notifySellersNewOrder(order, orderItems) {
  if (!order?.id || !orderItems?.length) return []

  const productIds = [...new Set(orderItems.map((i) => i.product_id).filter(Boolean))]
  if (!productIds.length) return []

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, title, seller_id")
    .in("id", productIds)

  if (error) {
    console.error("notifySellersNewOrder products error:", error.message)
    return []
  }

  const sid = shortOrderId(order.id)
  const shipping =
    order.shipping_address && typeof order.shipping_address === "object"
      ? order.shipping_address
      : {}
  const buyerName = shipping.name || shipping.fullName || "A customer"

  const bySeller = new Map()

  for (const item of orderItems) {
    const product = (products || []).find((p) => p.id === item.product_id)
    if (!product?.seller_id) continue

    if (!bySeller.has(product.seller_id)) {
      bySeller.set(product.seller_id, { lines: [], total: 0 })
    }

    const entry = bySeller.get(product.seller_id)
    const qty = parseInt(item.quantity, 10) || 1
    const price = parseFloat(item.price) || 0
    entry.lines.push(`${product.title} ×${qty}`)
    entry.total += price * qty
  }

  const results = []
  for (const [sellerId, { lines, total }] of bySeller) {
    const notif = await createNotification(sellerId, {
      title: "New order received",
      message: `You have a new order #${sid} from ${buyerName}: ${lines.join(", ")}. Sale value ₹${Number(total).toFixed(0)}. Open Orders to fulfill.`,
      type: "success",
      audience: AUDIENCE.SELLER,
    })
    if (notif) results.push(notif)
  }

  return results
}

/**
 * Customer only — order status updates (shipped, delivered, etc.).
 */
export async function notifyOrderStatusChange(order, newStatus, previousStatus) {
  if (!order?.user_id || !newStatus || newStatus === previousStatus) return null

  const template = ORDER_STATUS_MESSAGES[newStatus] || {
    title: "Order update",
    message: `Your order status is now ${newStatus}.`,
    type: "info",
  }

  const sid = shortOrderId(order.id)
  return createNotification(order.user_id, {
    title: template.title,
    message: `${template.message} (Order #${sid})`,
    type: template.type,
    audience: AUDIENCE.CUSTOMER,
  })
}

/**
 * Customer — return processed, refund credited to wallet.
 */
export async function notifyOrderReturned(order, refundAmount, walletBalance) {
  if (!order?.user_id) return null

  const sid = shortOrderId(order.id)
  const amt = Number(refundAmount || order.total || 0).toFixed(2)
  const balanceNote =
    walletBalance != null ? ` Your wallet balance is now ₹${Number(walletBalance).toFixed(2)}.` : ""

  return createNotification(order.user_id, {
    title: "Refund credited to wallet",
    message: `Return for order #${sid} is complete. ₹${amt} was added to your Urban-Basket wallet.${balanceNote}`,
    type: "success",
    audience: AUDIENCE.CUSTOMER,
  })
}

/**
 * Seller(s) — customer returned an order containing their products.
 */
export async function notifySellersOrderReturned(order, orderItems) {
  if (!order?.id || !orderItems?.length) return []

  const productIds = [...new Set(orderItems.map((i) => i.product_id).filter(Boolean))]
  if (!productIds.length) return []

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, title, seller_id")
    .in("id", productIds)

  if (error) {
    console.error("notifySellersOrderReturned products error:", error.message)
    return []
  }

  const sid = shortOrderId(order.id)
  const bySeller = new Map()

  for (const item of orderItems) {
    const product = (products || []).find((p) => p.id === item.product_id)
    if (!product?.seller_id) continue

    if (!bySeller.has(product.seller_id)) {
      bySeller.set(product.seller_id, [])
    }
    const qty = parseInt(item.quantity, 10) || 1
    bySeller.get(product.seller_id).push(`${product.title} ×${qty}`)
  }

  const results = []
  for (const [sellerId, lines] of bySeller) {
    const notif = await createNotification(sellerId, {
      title: "Order returned by customer",
      message: `Order #${sid} was returned: ${lines.join(", ")}. Stock has been restored.`,
      type: "warning",
      audience: AUDIENCE.SELLER,
    })
    if (notif) results.push(notif)
  }

  return results
}

/**
 * Deal live — customers get shop alerts; seller gets store alert.
 */
export async function notifyDealLive(product) {
  if (!product?.title) return []

  const customerTitle = "New deal is live"
  const customerMessage = `${product.title} is now on sale. Shop before stock runs out!`

  await notifyWishlistForProduct(product.id, {
    title: customerTitle,
    message: customerMessage,
    type: "success",
  })
  const customerNotifs = await notifyAllCustomers({
    title: customerTitle,
    message: customerMessage,
    type: "success",
  })

  if (product.seller_id) {
    await createNotification(product.seller_id, {
      title: "Your deal is live",
      message: `${product.title} is now featured. Customers are being notified — check Orders for sales.`,
      type: "success",
      audience: AUDIENCE.SELLER,
    })
  }

  return customerNotifs
}

/**
 * Big discount — customers only; seller gets sale summary.
 */
export async function notifyMajorDiscount(product, oldPrice, newPrice) {
  if (!product?.title) return []

  const pct = oldPrice > 0 ? Math.round((1 - newPrice / oldPrice) * 100) : 0
  const customerTitle = `${pct}% off — limited time`
  const customerMessage = `${product.title} dropped to ₹${Number(newPrice).toFixed(0)} (was ₹${Number(oldPrice).toFixed(0)}). Grab it now!`

  await notifyWishlistForProduct(product.id, {
    title: customerTitle,
    message: customerMessage,
    type: "warning",
  })
  const customerNotifs = await notifyAllCustomers({
    title: customerTitle,
    message: customerMessage,
    type: "warning",
  })

  if (product.seller_id) {
    await createNotification(product.seller_id, {
      title: "Sale price updated",
      message: `${product.title} is now ${pct}% off (₹${Number(newPrice).toFixed(0)}). Customers were notified.`,
      type: "info",
      audience: AUDIENCE.SELLER,
    })
  }

  return customerNotifs
}

/** Infer audience for older rows without audience column. */
export function inferNotificationAudience(notification) {
  if (notification?.audience === AUDIENCE.SELLER || notification?.audience === AUDIENCE.CUSTOMER) {
    return notification.audience
  }

  const title = String(notification?.title || "").toLowerCase()
  if (SELLER_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix) || title.includes(prefix))) {
    return AUDIENCE.SELLER
  }

  return AUDIENCE.CUSTOMER
}
