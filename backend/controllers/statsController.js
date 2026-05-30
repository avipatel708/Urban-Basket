import { supabaseAdmin } from "../config/supabase.js"

export const getSellerStats = async (req, res, next) => {
  try {
    const sellerId = req.user.id

    // Fetch seller's products
    const { data: products, error: prodError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)

    if (prodError) {
      return res.status(400).json({ error: prodError.message })
    }

    const totalProducts = products ? products.length : 0
    const lowStock = products ? products.filter((p) => p.stock < 5).length : 0

    if (!products || products.length === 0) {
      return res.status(200).json({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        lowStock: 0,
      })
    }

    const productIds = products.map((p) => p.id)

    // Fetch order items containing these product IDs
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*, orders(status)")
      .in("product_id", productIds)

    if (itemsError) {
      return res.status(400).json({ error: itemsError.message })
    }

    // Filter out items belonging to cancelled orders from revenue
    const nonCancelledItems = orderItems ? orderItems.filter((item) => item.orders && item.orders.status !== "cancelled") : []

    const totalRevenue = nonCancelledItems.reduce((sum, item) => sum + parseFloat(item.price) * parseInt(item.quantity), 0)
    const uniqueOrderIds = new Set(orderItems ? orderItems.map((item) => item.order_id) : [])
    const totalOrders = uniqueOrderIds.size

    return res.status(200).json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      totalProducts,
      lowStock,
    })
  } catch (err) {
    next(err)
  }
}
