import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Calendar,
  Package,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  DollarSign,
  CreditCard,
  Star,
  RotateCcw,
  Truck,
  ExternalLink,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getUserOrders, notifyOrdersUpdated, type OrderWithItems } from "@/services/orderService"
import { getMyReviewedProductIds } from "@/services/reviewService"
import { ReviewFormModal } from "@/components/reviews/ReviewFormModal"
import { ReturnOrderModal } from "@/components/orders/ReturnOrderModal"
import { getReturnEligibility, RETURN_WINDOW_DAYS } from "@/utils/returnPolicy"
import { TrackingTimeline } from "@/components/orders/TrackingTimeline"
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { DeliveryMap } from "@/components/orders/DeliveryMap"
import { formatEstimatedDelivery } from "@/utils/orderTracking"
import type { ShippingAddressLike } from "@/utils/deliveryMap"

interface OrderItem {
  id: string
  product_id: string
  title: string
  price: number
  quantity: number
  image_url: string
}

interface Order {
  id: string
  date: string
  total: number
  status: string
  deliveredAt: string | null
  estimatedDelivery: string | null
  paymentMethod: string
  paymentStatus: string
  shippingAddress: ShippingAddressLike
  items: OrderItem[]
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wallet: "Urban-Basket Wallet",
  gpay: "Google Pay",
  upi: "UPI",
  card: "Card",
  cod: "Cash on Delivery",
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "text-green-400 bg-green-400/10 border-green-500/20",
  pending: "text-amber-400 bg-amber-400/10 border-amber-500/20",
  failed: "text-red-400 bg-red-400/10 border-red-500/20",
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80"

const statusColors = {
  pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  processing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  shipped: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  delivered: "text-green-400 bg-green-400/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-500/20",
  returned: "text-amber-400 bg-amber-400/10 border-amber-500/20",
}

const VALID_STATUSES = new Set<string>([
  "pending",
  "confirmed",
  "packed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
])

function mapApiOrder(order: OrderWithItems): Order {
  const status = VALID_STATUSES.has(order.status) ? (order.status as Order["status"]) : "pending"
  const method = order.payment_method || "card"
  const payStatus = order.payment_status || (method === "cod" ? "pending" : "paid")
  return {
    id: order.id,
    date: order.created_at,
    total: order.total,
    status,
    deliveredAt: order.delivered_at || null,
    estimatedDelivery: order.estimated_delivery || null,
    paymentMethod: PAYMENT_METHOD_LABELS[method] || method,
    paymentStatus: method === "cod" && payStatus === "pending" ? "COD" : payStatus,
    shippingAddress:
      order.shipping_address && typeof order.shipping_address === "object"
        ? (order.shipping_address as ShippingAddressLike)
        : {},
    items: (order.order_items || []).map((item) => ({
      id: item.id,
      product_id: item.product_id,
      title: item.products?.title || "Product",
      price: item.price,
      quantity: item.quantity,
      image_url: item.products?.image_url || PLACEHOLDER_IMAGE,
    })),
  }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())
  const [reviewModal, setReviewModal] = useState<{
    productId: string
    productTitle: string
    orderId: string
  } | null>(null)
  const [returnModal, setReturnModal] = useState<{
    orderId: string
    total: number
    daysLeft: number
  } | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const [data, reviewed] = await Promise.all([
        getUserOrders(),
        getMyReviewedProductIds().catch(() => ({ product_ids: [] as string[] })),
      ])
      setOrders((data || []).map(mapApiOrder))
      setReviewedProductIds(new Set(reviewed.product_ids || []))
    } catch (err) {
      console.error("Failed to load orders:", err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    const onUpdated = () => loadOrders()
    window.addEventListener("ub-orders-updated", onUpdated)
    return () => window.removeEventListener("ub-orders-updated", onUpdated)
  }, [loadOrders])

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
    >
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">Order History</h1>
        <p className="text-xs text-surface-400 font-sans mt-0.5">Track your packages, deliveries, and past transactions.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl glass p-12 text-center border border-surface-800/40">
          <p className="text-sm text-surface-400 font-sans">Loading your orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl glass p-12 text-center space-y-4 border border-surface-800/40">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto text-surface-500">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-200">No orders found</h3>
            <p className="text-xs text-surface-400 mt-1 max-w-xs mx-auto leading-relaxed">
              It seems you haven't completed any purchases yet. Head over to our catalog to get started.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex py-2 px-5 gradient-primary text-white rounded-full font-sans text-xs font-semibold"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id
            const returnInfo = getReturnEligibility(order.status, order.deliveredAt, order.date)
            return (
              <div
                key={order.id}
                className="rounded-2xl glass border border-surface-800/35 overflow-hidden transition-all duration-300"
              >
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-800/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-primary-400 border border-surface-800/40 flex-shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-surface-150">{order.id}</h4>
                      <div className="flex items-center gap-4 text-[10px] text-surface-400 mt-1 font-sans">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(order.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatCurrency(order.total)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          {order.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border hidden sm:inline ${
                        PAYMENT_STATUS_COLORS[order.paymentStatus.toLowerCase()] ||
                        PAYMENT_STATUS_COLORS.pending
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <OrderStatusBadge
                      status={order.status}
                      pulse={["shipped", "out_for_delivery", "processing"].includes(order.status)}
                    />
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-surface-400 hidden sm:inline" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400 hidden sm:inline" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-surface-950/20 border-t border-surface-800/30"
                    >
                      <div className="p-5 space-y-4 font-sans">
                        {order.estimatedDelivery &&
                          order.status !== "delivered" &&
                          order.status !== "cancelled" && (
                            <div className="flex items-center gap-2 rounded-xl bg-primary-500/10 border border-primary-500/20 px-3 py-2 text-[11px] text-surface-300">
                              <Truck className="w-4 h-4 text-primary-400 flex-shrink-0" />
                              Expected delivery by{" "}
                              <span className="font-bold text-primary-300">
                                {formatEstimatedDelivery(order.estimatedDelivery)}
                              </span>
                            </div>
                          )}
                        <div className="rounded-xl bg-surface-950/30 border border-surface-800/30 p-4">
                          <TrackingTimeline status={order.status} showProgressBar />
                        </div>
                        {order.status !== "cancelled" && (
                          <DeliveryMap
                            orderId={order.id}
                            status={order.status}
                            shippingAddress={order.shippingAddress}
                            estimatedDelivery={order.estimatedDelivery}
                            compact
                          />
                        )}
                        <Link
                          to={`/orders/track/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-400 hover:text-primary-300"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open live tracking page
                        </Link>
                        <div className="flex flex-wrap gap-3 text-[11px] pb-2 border-b border-surface-850/50">
                          <span className="text-surface-400">
                            Payment:{" "}
                            <span className="text-surface-200 font-semibold">{order.paymentMethod}</span>
                          </span>
                          <span className="text-surface-400">
                            Status:{" "}
                            <span
                              className={`font-semibold uppercase ${
                                order.paymentStatus.toLowerCase() === "paid"
                                  ? "text-green-400"
                                  : order.paymentStatus === "COD"
                                  ? "text-amber-400"
                                  : "text-surface-300"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </span>
                          <span className="text-surface-400">
                            Total:{" "}
                            <span className="text-primary-400 font-semibold">{formatCurrency(order.total)}</span>
                          </span>
                        </div>
                        <h5 className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                          Items in this Order
                        </h5>
                        {order.status === "delivered" && (
                          <div className="pb-3 border-b border-surface-850/50">
                            {returnInfo.eligible ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReturnModal({
                                    orderId: order.id,
                                    total: order.total,
                                    daysLeft: returnInfo.daysLeft,
                                  })
                                }}
                                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full text-[10px] font-bold font-sans border border-amber-500/35 bg-amber-500/10 text-amber-300 hover:border-amber-500/50 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Return Order — refund to wallet ({returnInfo.daysLeft} day
                                {returnInfo.daysLeft !== 1 ? "s" : ""} left)
                              </button>
                            ) : (
                              <p className="text-[10px] text-surface-500">
                                Return window: {RETURN_WINDOW_DAYS} days after delivery.{" "}
                                {returnInfo.reason || "Not eligible for return."}
                              </p>
                            )}
                          </div>
                        )}
                        {order.status === "returned" && (
                          <p className="text-[10px] text-amber-400 font-semibold pb-3 border-b border-surface-850/50">
                            ✓ Returned — refund credited to your Urban-Basket wallet
                          </p>
                        )}
                        <div className="divide-y divide-surface-850">
                          {order.items.map((item) => {
                            const canReview =
                              order.status === "delivered" &&
                              !reviewedProductIds.has(item.product_id)
                            const alreadyReviewed = reviewedProductIds.has(item.product_id)

                            return (
                              <div key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                                <div className="w-12 h-12 rounded-lg overflow-hidden border border-surface-800/40 bg-surface-900/30 flex-shrink-0">
                                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
                                  <h4 className="text-xs font-semibold text-surface-200 line-clamp-1">
                                    {item.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-surface-400">
                                    <span>Qty: {item.quantity}</span>
                                    <span className="font-semibold text-primary-400">
                                      {formatCurrency(item.price)}
                                    </span>
                                  </div>
                                  {order.status === "delivered" && (
                                    <div className="pt-1">
                                      {canReview ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setReviewModal({
                                              productId: item.product_id,
                                              productTitle: item.title,
                                              orderId: order.id,
                                            })
                                          }}
                                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-[10px] font-bold font-sans border border-primary-500/35 bg-primary-500/10 text-primary-300 hover:border-primary-500/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] transition-all cursor-pointer"
                                        >
                                          <Star className="w-3 h-3" />
                                          Write Review
                                        </button>
                                      ) : alreadyReviewed ? (
                                        <span className="text-[10px] text-green-400 font-semibold">
                                          ✓ Review submitted
                                        </span>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
      {returnModal && (
        <ReturnOrderModal
          open={!!returnModal}
          onClose={() => setReturnModal(null)}
          orderId={returnModal.orderId}
          orderTotal={returnModal.total}
          daysLeft={returnModal.daysLeft}
          onReturned={() => {
            notifyOrdersUpdated()
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("ub-wallet-updated"))
            }
            loadOrders()
          }}
        />
      )}
      {reviewModal && (
        <ReviewFormModal
          open={!!reviewModal}
          onClose={() => setReviewModal(null)}
          productId={reviewModal.productId}
          productTitle={reviewModal.productTitle}
          orderId={reviewModal.orderId}
          onSubmitted={() => {
            setReviewedProductIds((prev) => new Set(prev).add(reviewModal.productId))
            loadOrders()
          }}
        />
      )}
    </motion.div>
  )
}
