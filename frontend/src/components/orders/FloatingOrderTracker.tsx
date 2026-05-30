import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  ShoppingBag,
  X,
  MapPin,
  Package,
  ChevronRight,
  Navigation,
  ExternalLink,
} from "lucide-react"
import { getUserOrders, type OrderWithItems } from "@/services/orderService"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { countActiveShipments, formatEstimatedDelivery } from "@/utils/orderTracking"
import { TrackingTimeline } from "./TrackingTimeline"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { useRealtimeOrderTracking } from "@/hooks/useRealtimeOrderTracking"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80"

interface TrackerOrder {
  id: string
  date: string
  total: number
  status: string
  estimatedDelivery: string | null
  shipping: Record<string, string> | null
  items: { title: string; image_url: string; quantity: number }[]
}

function mapOrder(o: OrderWithItems): TrackerOrder {
  return {
    id: o.id,
    date: o.created_at,
    total: o.total,
    status: o.status,
    estimatedDelivery: o.estimated_delivery || null,
    shipping: o.shipping_address,
    items: (o.order_items || []).map((item) => ({
      title: item.products?.title || "Product",
      image_url: item.products?.image_url || PLACEHOLDER_IMAGE,
      quantity: item.quantity,
    })),
  }
}

export function FloatingOrderTracker() {
  const [isOpen, setIsOpen] = useState(false)
  const [orders, setOrders] = useState<TrackerOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUserOrders()
      const mapped = (data || []).map(mapOrder)
      setOrders(mapped)
      setExpandedId((prev) => {
        if (prev) return prev
        if (mapped.length === 0) return null
        const inTransit = mapped.find((o) =>
          ["pending", "confirmed", "packed", "processing", "shipped", "out_for_delivery"].includes(
            o.status
          )
        )
        return inTransit?.id ?? mapped[0].id
      })
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) loadOrders()
  }, [isOpen, loadOrders])

  useRealtimeOrderTracking({
    onOrderChange: () => {
      if (isOpen) loadOrders()
    },
  })

  useEffect(() => {
    const onUpdated = () => {
      if (isOpen) loadOrders()
    }
    window.addEventListener("ub-orders-updated", onUpdated)
    return () => window.removeEventListener("ub-orders-updated", onUpdated)
  }, [isOpen, loadOrders])

  const activeCount = countActiveShipments(orders.map((o) => o.status))

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="absolute bottom-full right-0 mb-3 w-[min(100vw-3rem,400px)] max-h-[min(70vh,520px)] rounded-3xl glass-strong border border-surface-850 shadow-[0_15px_50px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            <div className="p-4 border-b border-surface-800/40 bg-gradient-to-r from-primary-950/50 via-surface-950/40 to-accent-950/30 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/25 flex-shrink-0 relative">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-950 border border-primary-400/40 flex items-center justify-center">
                    <MapPin className="w-2.5 h-2.5 text-accent-300" />
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm text-surface-50 flex items-center gap-2">
                    Order Tracker
                    {activeCount > 0 && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30 animate-pulse">
                        {activeCount} live
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-surface-450 mt-0.5 font-sans">
                    Realtime delivery updates — Amazon-style tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full glass-light border border-surface-800 text-surface-450 hover:text-surface-150 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Close order tracker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
              {loading ? (
                <div className="py-10 text-center text-xs text-surface-400 font-sans">
                  Loading your orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl glass mx-auto flex items-center justify-center text-surface-500">
                    <Package className="w-7 h-7" />
                  </div>
                  <p className="text-xs text-surface-400 leading-relaxed">
                    No orders yet. Shop the catalog and track every package here in real time.
                  </p>
                  <Link
                    to="/products"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex py-2 px-4 gradient-primary text-white rounded-full text-[11px] font-semibold"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                orders.map((order) => {
                  const isExpanded = expandedId === order.id

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-surface-800/40 bg-surface-950/30 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="w-full p-3.5 flex items-center gap-3 text-left hover:bg-surface-800/20 transition-colors cursor-pointer"
                      >
                        <div className="flex -space-x-2 flex-shrink-0">
                          {order.items.slice(0, 2).map((item, i) => (
                            <div
                              key={i}
                              className="w-9 h-9 rounded-lg border-2 border-surface-900 overflow-hidden bg-surface-800"
                            >
                              <img
                                src={item.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="w-9 h-9 rounded-lg border-2 border-surface-900 bg-surface-800 flex items-center justify-center text-[9px] font-bold text-surface-400">
                              +{order.items.length - 2}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-surface-150 truncate">
                            {order.id}
                          </p>
                          <p className="text-[10px] text-surface-500 mt-0.5">
                            {formatDate(order.date)} · {formatCurrency(order.total)}
                          </p>
                          {!isExpanded && order.estimatedDelivery && (
                            <p className="text-[10px] text-primary-400 mt-1 flex items-center gap-1 truncate">
                              <Navigation className="w-3 h-3 flex-shrink-0" />
                              ETA {formatEstimatedDelivery(order.estimatedDelivery)}
                            </p>
                          )}
                        </div>
                        <OrderStatusBadge status={order.status} className="flex-shrink-0" />
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 text-surface-500 flex-shrink-0 transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-surface-800/35"
                          >
                            <div className="p-3.5 pt-2 space-y-3">
                              <div className="space-y-2">
                                {order.items.map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-2 text-[10px] text-surface-400"
                                  >
                                    <span className="text-surface-300 font-medium line-clamp-1 flex-1">
                                      {item.title}
                                    </span>
                                    <span>×{item.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              <TrackingTimeline
                                status={order.status}
                                showProgressBar
                                className="rounded-xl bg-surface-900/50 border border-surface-800/40 p-3"
                              />
                              <Link
                                to={`/orders/track/${order.id}`}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary-400 hover:text-primary-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Full live tracking
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              )}
            </div>

            {orders.length > 0 && (
              <div className="p-3 border-t border-surface-800/40 bg-surface-950/30">
                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl glass-light border border-surface-800/50 text-[11px] font-semibold text-surface-200 hover:text-primary-400 hover:border-primary-500/30 transition-all"
                >
                  Full order history
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="group relative cursor-pointer"
        aria-label={isOpen ? "Close order tracker" : "Open order tracker"}
        title="Order history & live tracking"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-70 blur-md group-hover:opacity-90 transition-opacity" />
        <span className="relative flex w-14 h-14 rounded-2xl items-center justify-center bg-surface-950/90 border border-primary-500/40 shadow-[0_0_24px_rgba(139,92,246,0.35)] backdrop-blur-md overflow-hidden">
          <span className="absolute inset-0 bg-gradient-to-br from-primary-500/15 to-accent-500/15" />
          <ShoppingBag className="w-6 h-6 text-white relative z-10" />
          <span className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-lg bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center border border-white/20 shadow-md z-10">
            <MapPin className="w-3 h-3 text-white" />
          </span>
        </span>
        {activeCount > 0 && !isOpen && (
          <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-[9px] font-bold text-white flex items-center justify-center border-2 border-surface-950 shadow-lg z-20">
            {activeCount}
          </span>
        )}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity hidden lg:block">
          <span className="text-[10px] font-semibold text-surface-200 glass px-2.5 py-1 rounded-lg border border-surface-700/50">
            My Orders
          </span>
        </span>
      </motion.button>
    </div>
  )
}
