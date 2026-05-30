import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, MapPin, Loader2, Gift } from "lucide-react"
import { toast } from "sonner"
import type { MysteryBox } from "@/services/mysteryBoxService"
import {
  purchaseMysteryBox,
  notifyMysteryRewardsUpdated,
  type PurchaseMysteryBoxResponse,
} from "@/services/mysteryBoxService"
import { formatCurrency } from "@/lib/utils"
import { PaymentMethods } from "@/components/payment/PaymentMethods"
import { WalletPayment } from "@/components/payment/WalletPayment"
import { CardPayment, validateCardForm } from "@/components/payment/CardPayment"
import { UpiPayment } from "@/components/payment/UpiPayment"
import { CodPayment } from "@/components/payment/CodPayment"
import {
  getWallet,
  simulatePayment,
  delay,
  type PaymentMethodId,
} from "@/services/paymentService"
import { DEFAULT_COUNTRY, INDIAN_STATES } from "@/utils/india"
import { useAuthStore } from "@/store/authStore"

interface MysteryBoxPurchaseModalProps {
  box: MysteryBox | null
  open: boolean
  onClose: () => void
  onSuccess: (result: PurchaseMysteryBoxResponse) => void
}

export function MysteryBoxPurchaseModal({
  box,
  open,
  onClose,
  onSuccess,
}: MysteryBoxPurchaseModalProps) {
  const { user, profile } = useAuthStore()
  const [shipping, setShipping] = useState({
    name: profile?.name || "",
    email: profile?.email || user?.email || "",
    phone: "",
    line1: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    country: DEFAULT_COUNTRY,
  })
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("card")
  const [walletBalance, setWalletBalance] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [upiId, setUpiId] = useState("")
  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim">("gpay")
  const [cardForm, setCardForm] = useState({
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  })

  const loadWallet = useCallback(async () => {
    try {
      const data = await getWallet()
      setWalletBalance(data.balance ?? 0)
    } catch {
      setWalletBalance(0)
    }
  }, [])

  useEffect(() => {
    if (open) loadWallet()
  }, [open, loadWallet])

  useEffect(() => {
    if (profile?.name) setShipping((s) => ({ ...s, name: profile.name }))
    if (profile?.email || user?.email)
      setShipping((s) => ({ ...s, email: profile?.email || user?.email || "" }))
  }, [profile, user, open])

  const handlePurchase = async () => {
    if (!box) return

    if (!shipping.name || !shipping.line1 || !shipping.city || !shipping.pincode) {
      toast.error("Please fill in your delivery address.")
      return
    }

    setProcessing(true)
    try {
      let payment_status: "paid" | "pending" = "paid"
      let transaction_id: string | null = null

      if (paymentMethod === "cod") {
        payment_status = "pending"
      } else if (paymentMethod === "wallet") {
        if (walletBalance < box.price) {
          toast.error("Insufficient wallet balance.")
          setProcessing(false)
          return
        }
      } else if (paymentMethod === "card") {
        const err = validateCardForm(cardForm)
        if (err) {
          toast.error(err)
          setProcessing(false)
          return
        }
      } else if (paymentMethod === "upi" || paymentMethod === "gpay") {
        if (!upiId.trim() || upiId.trim().length < 3) {
          toast.error("Please enter your UPI ID.")
          setProcessing(false)
          return
        }
      }

      if (paymentMethod === "upi" || paymentMethod === "card" || paymentMethod === "gpay") {
        toast.loading("Processing payment…", { id: "mb-pay" })
        await delay(1200)
        const sim = await simulatePayment({
          method:
            paymentMethod === "card" ? "card" : upiApp === "gpay" ? "gpay" : "upi",
          amount: box.price,
          upiId: paymentMethod !== "card" ? upiId.trim() : undefined,
          cardNumber: paymentMethod === "card" ? cardForm.cardNumber : undefined,
        })
        toast.dismiss("mb-pay")
        if (!sim.success) {
          toast.error("Payment failed. Please try again.")
          setProcessing(false)
          return
        }
        transaction_id = sim.transaction_id
      }

      const shipping_address = {
        name: shipping.name,
        email: shipping.email,
        phone: shipping.phone,
        line1: shipping.line1,
        city: shipping.city,
        state: shipping.state,
        pincode: shipping.pincode,
        country: shipping.country,
      }

      const result = await purchaseMysteryBox(box.id, {
        shipping_address,
        payment_method: paymentMethod,
        payment_status,
        transaction_id,
      })

      notifyMysteryRewardsUpdated()
      onSuccess(result)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Purchase failed.")
    } finally {
      setProcessing(false)
    }
  }

  if (!box) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface-950/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass-strong border border-surface-800/50 shadow-2xl"
          >
            <div className="p-5 border-b border-surface-800/40 flex items-center justify-between sticky top-0 bg-surface-950/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary-400" />
                <h2 className="font-display font-bold text-base text-surface-50">
                  Unlock {box.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full glass-light text-surface-400 hover:text-surface-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-xs text-surface-400">
                Pay {formatCurrency(box.price)} · Receive surprise products worth{" "}
                <span className="text-primary-400 font-semibold">equal or more</span> than you pay.
              </p>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Delivery address
                </p>
                <input
                  placeholder="Full name"
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs text-surface-100"
                />
                <input
                  placeholder="Phone"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs text-surface-100"
                />
                <input
                  placeholder="Address line"
                  value={shipping.line1}
                  onChange={(e) => setShipping({ ...shipping, line1: e.target.value })}
                  className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs text-surface-100"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="City"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs text-surface-100"
                  />
                  <select
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    className="glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs text-surface-100"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  placeholder="PIN code"
                  value={shipping.pincode}
                  onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })}
                  className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs text-surface-100"
                />
              </div>

              <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />

              {paymentMethod === "wallet" && (
                <WalletPayment balance={walletBalance} orderTotal={box.price} />
              )}
              {paymentMethod === "card" && (
                <CardPayment form={cardForm} onChange={setCardForm} />
              )}
              {(paymentMethod === "gpay" || paymentMethod === "upi") && (
                <UpiPayment
                  upiId={upiId}
                  onUpiIdChange={setUpiId}
                  selectedApp={upiApp}
                  onAppChange={(app) =>
                    setUpiApp(app as "gpay" | "phonepe" | "paytm" | "bhim")
                  }
                />
              )}
              {paymentMethod === "cod" && <CodPayment orderTotal={box.price} />}

              <button
                type="button"
                disabled={processing}
                onClick={handlePurchase}
                className="w-full py-3 rounded-2xl gradient-primary text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 disabled:opacity-60 cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rolling your loot…
                  </>
                ) : (
                  <>Purchase & Reveal · {formatCurrency(box.price)}</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
