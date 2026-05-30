import { motion } from "motion/react"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  variant?: "card" | "text" | "avatar" | "image"
}

export function LoadingSkeleton({ className = "", lines = 3, variant = "text" }: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={`rounded-xl overflow-hidden glass ${className}`}>
        <div className="skeleton h-48 w-full" />
        <div className="p-4 space-y-3">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-6 w-1/3 rounded" />
        </div>
      </div>
    )
  }

  if (variant === "avatar") {
    return <div className={`skeleton rounded-full h-10 w-10 ${className}`} />
  }

  if (variant === "image") {
    return <div className={`skeleton rounded-xl h-64 w-full ${className}`} />
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <LoadingSkeleton variant="card" />
        </motion.div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="skeleton h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full rounded-lg" />
      ))}
    </div>
  )
}
