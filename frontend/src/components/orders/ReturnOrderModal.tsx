import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Loader2, RotateCcw, Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { requestOrderReturn } from "@/services/orderService"
import { RETURN_WINDOW_DAYS } from "@/utils/returnPolicy"
import { toast } from "sonner"

interface ReturnOrderModalProps {
  open: boolean
  onClose: () => void
  orderId: string
  orderTotal: number
  daysLeft: number
  onReturned: (walletBalance?: number) => void
}

export function ReturnOrderModal({
  open,
  onClose,
  orderId,
  orderTotal,
  daysLeft,
  onReturned,
}: ReturnOrderModalProps) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await requestOrderReturn(orderId, reason.trim() || undefined)
      toast.success(result.message || "Return processed. Refund added to your wallet.")
      onReturned(result.wallet_balance)
      setReason("")
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Return failed. Please try again."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl glass border border-surface-800/50 p-6 space-y-5 font-sans shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-surface-50">Return Order</h3>
                  <p className="text-[11px] text-surface-400 mt-0.5">
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your {RETURN_WINDOW_DAYS}-day return window
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-surface-900/40 border border-surface-800/40 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-surface-300">
                <span>Refund amount</span>
                <span className="font-bold text-primary-400">{formatCurrency(orderTotal)}</span>
              </div>
              <div className="flex items-start gap-2 text-surface-400">
                <Wallet className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <p>
                  The full order amount will be credited to your{" "}
                  <span className="text-surface-200 font-semibold">Urban-Basket wallet</span>. Use it on your next
                  purchase at checkout.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="return-reason" className="text-[10px] font-bold uppercase tracking-wide text-surface-450">
                Reason (optional)
              </label>
              <textarea
                id="return-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Product not as expected, wrong size, changed mind…"
                rows={3}
                maxLength={500}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-3 text-xs text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-primary-500 resize-none"
              />
            </div>

            <p className="text-[10px] text-surface-500 leading-relaxed">
              By confirming, you agree to return this order. Stock will be restored and this cannot be undone.
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold border border-surface-700 text-surface-300 hover:bg-surface-800/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-full text-xs font-semibold gradient-primary text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  "Confirm Return"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
