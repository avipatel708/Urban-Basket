import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Tag, Check, X, Loader2, Percent } from "lucide-react"
import { validateCoupon } from "@/services/couponService"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface CouponInputProps {
  cartTotal: number
  onCouponApplied: (discount: number, couponCode: string, message: string) => void
  onCouponRemoved: () => void
}

export function CouponInput({ cartTotal, onCouponApplied, onCouponRemoved }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return

    setIsApplying(true)
    setError(null)

    try {
      const res = await validateCoupon(couponCode.trim(), cartTotal)
      if (res.valid) {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discount: res.discount,
          message: res.message,
        })
        onCouponApplied(res.discount, couponCode.trim().toUpperCase(), res.message)
        toast.success(res.message)
        setCouponCode("")
      } else {
        triggerError(res.message || "Invalid coupon code.")
      }
    } catch (err: any) {
      triggerError(err.message || "Failed to validate coupon.")
    } finally {
      setIsApplying(false)
    }
  }

  const triggerError = (msg: string) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
    toast.error(msg)
  }

  const handleRemove = () => {
    setAppliedCoupon(null)
    onCouponRemoved()
    toast.info("Coupon removed.")
  }

  return (
    <div className="space-y-3 font-sans">
      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
        Promo Code / Gift Voucher
      </label>

      <AnimatePresence mode="wait">
        {!appliedCoupon ? (
          <motion.form
            key="input-form"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            onSubmit={handleApply}
            className="space-y-2"
          >
            <motion.div 
              animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-450" />
                <input
                  type="text"
                  placeholder="Enter code (e.g. WELCOME50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 pl-10 pr-4 text-xs font-sans focus:outline-none focus:border-primary-500 text-surface-200 uppercase"
                  disabled={isApplying}
                />
              </div>
              <button
                type="submit"
                disabled={isApplying || !couponCode.trim()}
                className="gradient-primary text-white rounded-xl px-5 text-xs font-semibold cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-103 active:scale-97 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </motion.div>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-red-400 text-[10px] font-sans pl-1"
              >
                {error}
              </motion.p>
            )}
          </motion.form>
        ) : (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-green-500/30 bg-green-500/5 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg shadow-green-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                <Percent className="w-4.5 h-4.5" />
              </div>
              <div className="font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-green-400 font-mono tracking-wider">
                    {appliedCoupon.code}
                  </span>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                </div>
                <p className="text-[10px] text-surface-300 font-medium mt-0.5">
                  Discount: <span className="font-semibold text-green-400">{formatCurrency(appliedCoupon.discount)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg glass-light border border-surface-800/40 text-surface-400 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
              aria-label="Remove Coupon"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
