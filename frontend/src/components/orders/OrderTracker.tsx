import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router"
import { motion } from "motion/react"
import {
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Radio,
  Truck,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getOrderTracking, type OrderTrackingResponse } from "@/services/orderTrackingService"
import { useRealtimeOrderTracking } from "@/hooks/useRealtimeOrderTracking"
import { TrackingTimeline } from "./TrackingTimeline"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { DeliveryMap } from "./DeliveryMap"
import { formatEstimatedDelivery } from "@/utils/orderTracking"
import type { TrackingHistoryEntry } from "@/utils/orderTracking"

const PAYMENT_LABELS: Record<string, string> = {
  wallet: "Urban-Basket Wallet",
  gpay: "Google Pay",
  upi: "UPI",
  card: "Card",
  cod: "Cash on Delivery",
}

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80"

interface OrderTrackerProps {
  orderId: string
  embedded?: boolean
}

export function OrderTracker({ orderId, embedded = false }: OrderTrackerProps) {
  const [data, setData] = useState<OrderTrackingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getOrderTracking(orderId)
      setData(res)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useRealtimeOrderTracking({
    orderId,
    enabled: Boolean(orderId),
    onOrderChange: () => {
      setLive(true)
      load()
    },
    onHistoryChange: () => {
      setLive(true)
      load()
    },
  })

  useEffect(() => {
    const onUpdated = () => load()
    window.addEventListener("ub-orders-updated", onUpdated)
    return () => window.removeEventListener("ub-orders-updated", onUpdated)
  }, [load])

  if (loading) {
    return (
      <div className="rounded-3xl glass p-10 text-center border border-surface-800/40">
        <p className="text-sm text-surface-400 font-sans animate-pulse">Loading live tracking…</p>
      </div>
    )
  }

  if (!data?.order) {
    return (
      <div className="rounded-3xl glass p-10 text-center border border-surface-800/40">
        <p className="text-sm text-surface-400">Order not found or access denied.</p>
        <Link to="/orders" className="text-xs text-primary-400 mt-2 inline-block">
          Back to orders
        </Link>
      </div>
    )
  }

  const { order, history } = data
  const shipping =
    order.shipping_address && typeof order.shipping_address === "object"
      ? order.shipping_address
      : {}
  const addressLine = [shipping.line1, shipping.city, shipping.state, shipping.pincode]
    .filter(Boolean)
    .join(", ")
  const method = order.payment_method || "card"
  const estimated = order.estimated_delivery

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={embedded ? "space-y-5" : "max-w-3xl mx-auto space-y-5"}
    >
      <div className="rounded-3xl glass border border-surface-800/40 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-surface-800/40 bg-gradient-to-r from-primary-950/40 via-surface-950/30 to-accent-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-surface-500 font-bold">
                Order ID
              </p>
              <h2 className="font-display font-bold text-lg text-surface-50 mt-0.5 break-all">
                {order.id}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-surface-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(order.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  {PAYMENT_LABELS[method] || method}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <OrderStatusBadge status={order.status} pulse />
              {live && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-green-400">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>

          {estimated && order.status !== "delivered" && order.status !== "cancelled" && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-500/10 border border-primary-500/25 px-3 py-2.5">
              <Truck className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <p className="text-xs text-surface-200 font-sans">
                Expected delivery by{" "}
                <span className="font-bold text-primary-300">
                  {formatEstimatedDelivery(estimated)}
                </span>
              </p>
            </div>
          )}
        </div>

        {order.status !== "cancelled" && (
          <div className="px-5 sm:px-6 pt-5 pb-5 border-b border-surface-800/40">
            <DeliveryMap
              orderId={order.id}
              status={order.status}
              shippingAddress={shipping}
              estimatedDelivery={estimated}
            />
          </div>
        )}

        <div className="p-5 sm:p-6 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3">
              Delivery timeline
            </h3>
            <TrackingTimeline status={order.status} />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent-400" />
                Delivery address
              </h3>
              <p className="text-xs text-surface-300 leading-relaxed">
                {addressLine || "Address on file"}
              </p>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-2">
                Products ({order.order_items?.length || 0})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {(order.order_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-2 rounded-xl bg-surface-900/40 border border-surface-800/30"
                  >
                    <img
                      src={item.products?.image_url || PLACEHOLDER}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover border border-surface-800/40"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-surface-200 line-clamp-2">
                        {item.products?.title || "Product"}
                      </p>
                      <p className="text-[10px] text-surface-500 mt-0.5">
                        Qty {item.quantity} · {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-surface-800/40 flex justify-between items-center">
              <span className="text-xs text-surface-400">Order total</span>
              <span className="text-sm font-bold text-primary-400">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <TrackingHistoryList history={history} />
      )}

      {!embedded && (
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs text-surface-400 hover:text-primary-400 transition-colors"
        >
          <Package className="w-4 h-4" />
          Back to order history
        </Link>
      )}
    </motion.div>
  )
}

function TrackingHistoryList({ history }: { history: TrackingHistoryEntry[] }) {
  return (
    <div className="rounded-2xl glass border border-surface-800/35 p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-500 mb-3">
        Status history
      </h3>
      <ul className="space-y-2">
        {[...history].reverse().map((entry) => (
          <li
            key={entry.id}
            className="flex justify-between gap-2 text-[11px] border-b border-surface-850/50 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-surface-300 capitalize font-medium">
              {entry.status.replace(/_/g, " ")}
            </span>
            <span className="text-surface-500 flex-shrink-0">
              {new Date(entry.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
