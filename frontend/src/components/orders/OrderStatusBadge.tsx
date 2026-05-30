import { cn } from "@/lib/utils"
import { getStatusBadgeVariant, normalizeOrderStatus } from "@/utils/orderTracking"
import { ORDER_STATUSES } from "@/utils/constants"

const VARIANT_STYLES = {
  delivered: "text-green-400 bg-green-400/10 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]",
  shipping: "text-purple-400 bg-purple-400/10 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]",
  processing: "text-blue-400 bg-blue-400/10 border-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.12)]",
  cancelled: "text-red-400 bg-red-400/10 border-red-500/30",
  returned: "text-amber-400 bg-amber-400/10 border-amber-500/30",
  default: "text-surface-300 bg-surface-800/40 border-surface-700/40",
} as const

interface OrderStatusBadgeProps {
  status: string
  className?: string
  pulse?: boolean
}

export function OrderStatusBadge({ status, className, pulse }: OrderStatusBadgeProps) {
  const normalized = normalizeOrderStatus(status)
  const variant = getStatusBadgeVariant(status)
  const meta = ORDER_STATUSES[normalized as keyof typeof ORDER_STATUSES]

  const label =
    variant === "shipping"
      ? "Shipping"
      : variant === "processing"
        ? "Processing"
        : meta?.label || normalized.replace(/_/g, " ")

  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border",
        VARIANT_STYLES[variant],
        pulse && variant === "shipping" && "animate-pulse",
        className
      )}
    >
      {label}
    </span>
  )
}
