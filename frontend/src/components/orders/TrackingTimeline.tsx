import { motion } from "motion/react"
import { Check, Circle, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  buildTimelineSteps,
  getDeliveryProgressPercent,
  normalizeOrderStatus,
} from "@/utils/orderTracking"

interface TrackingTimelineProps {
  status: string
  compact?: boolean
  showProgressBar?: boolean
  className?: string
}

export function TrackingTimeline({
  status,
  compact = false,
  showProgressBar = true,
  className,
}: TrackingTimelineProps) {
  const steps = buildTimelineSteps(status)
  const progress = getDeliveryProgressPercent(status)
  const isCancelled = normalizeOrderStatus(status) === "cancelled"

  return (
    <div className={cn("w-full", className)}>
      {showProgressBar && !isCancelled && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-surface-500 font-sans mb-1.5">
            <span>Delivery progress</span>
            <span className="text-primary-400 font-semibold">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-800/80 overflow-hidden border border-surface-800/50">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-400 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "relative",
          compact ? "flex flex-wrap gap-2" : "space-y-0"
        )}
      >
        {!compact &&
          steps.map((step, idx) => {
            const isLast = idx === steps.length - 1
            return (
              <div key={step.key} className="flex gap-3 relative pb-5 last:pb-0">
                {!isLast && (
                  <motion.span
                    className={cn(
                      "absolute left-[11px] top-6 w-0.5 h-[calc(100%-8px)] origin-top",
                      step.completed
                        ? "bg-gradient-to-b from-primary-500 to-accent-500"
                        : "bg-surface-700/60"
                    )}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                  />
                )}

                <div className="relative z-10 flex-shrink-0">
                  {step.completed ? (
                    <motion.span
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      className="flex w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 items-center justify-center shadow-[0_0_14px_rgba(139,92,246,0.45)] border border-primary-300/40"
                    >
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </motion.span>
                  ) : step.active ? (
                    <span className="relative flex w-6 h-6 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-accent-500/30 animate-ping" />
                      <span className="relative flex w-6 h-6 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 items-center justify-center shadow-[0_0_18px_rgba(96,165,250,0.55)] border border-accent-300/50">
                        {step.key === "shipped" || step.key === "out_for_delivery" ? (
                          <Truck className="w-3 h-3 text-white" />
                        ) : (
                          <Circle className="w-2 h-2 fill-white text-white" />
                        )}
                      </span>
                    </span>
                  ) : (
                    <span className="flex w-6 h-6 rounded-full border-2 border-surface-600 bg-surface-900/80 items-center justify-center">
                      <Circle className="w-2 h-2 text-surface-600" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 pt-0.5 flex-1">
                  <p
                    className={cn(
                      "text-xs font-semibold font-sans",
                      step.active && "text-accent-300",
                      step.completed && !step.active && "text-surface-200",
                      step.pending && "text-surface-500"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.active && (
                    <motion.p
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-primary-400/90 mt-0.5 font-medium"
                    >
                      In progress now
                    </motion.p>
                  )}
                </div>
              </div>
            )
          })}

        {compact &&
          steps
            .filter((s) => s.key !== "cancelled")
            .map((step) => (
              <span
                key={step.key}
                className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                  step.completed && "bg-primary-500/20 border-primary-500/30 text-primary-300",
                  step.active &&
                    "bg-accent-500/20 border-accent-500/40 text-accent-300 animate-pulse",
                  step.pending && "bg-surface-900/50 border-surface-700/40 text-surface-500"
                )}
              >
                {step.shortLabel}
              </span>
            ))}
      </div>
    </div>
  )
}
