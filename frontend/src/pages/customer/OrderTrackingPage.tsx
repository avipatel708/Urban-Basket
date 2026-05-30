import { useParams, Link } from "react-router"
import { motion } from "motion/react"
import { ArrowLeft } from "lucide-react"
import { OrderTracker } from "@/components/orders/OrderTracker"

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()

  if (!orderId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-surface-400 text-sm">
        Invalid order.{" "}
        <Link to="/orders" className="text-primary-400">
          View orders
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6"
    >
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Order history
        </Link>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">
          Track Order
        </h1>
        <p className="text-xs text-surface-400 font-sans mt-0.5">
          Live status updates — no refresh needed when your seller updates shipment.
        </p>
      </div>

      <OrderTracker orderId={orderId} />
    </motion.div>
  )
}
