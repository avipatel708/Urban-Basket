import { motion } from "motion/react"
import { ShoppingBag, Search, Package, Heart } from "lucide-react"

interface EmptyStateProps {
  icon?: "cart" | "search" | "orders" | "wishlist" | "default"
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const icons = {
  cart: ShoppingBag,
  search: Search,
  orders: Package,
  wishlist: Heart,
  default: Package,
}

export function EmptyState({
  icon = "default",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-6 glow-sm"
      >
        <Icon className="w-10 h-10 text-primary-400" />
      </motion.div>
      <h3 className="text-xl font-semibold text-surface-100 mb-2">{title}</h3>
      {description && (
        <p className="text-surface-400 max-w-md mb-6">{description}</p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}
