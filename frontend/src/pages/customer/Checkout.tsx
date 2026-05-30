import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router"
import { useAuthStore } from "@/store/authStore"
import { createOrder, notifyOrdersUpdated } from "@/services/orderService"
import { validateCoupon, applyCoupon } from "@/services/couponService"
import { motion, AnimatePresence } from "motion/react"
import {
  CreditCard,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react"
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
import { useCartStore } from "@/store/cartStore"
import { useBuyNowStore } from "@/store/buyNowStore"
import { formatCurrency } from "@/lib/utils"
import {
  DEFAULT_COUNTRY,
  INDIAN_STATES,
  calcGst,
  calcShippingFee,
  GST_RATE,
  FREE_SHIPPING_MIN_INR,
} from "@/utils/india"
import { toast } from "sonner"
import { CouponInput } from "@/components/coupons/CouponInput"

type Step = "shipping" | "payment" | "confirmation"

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { items, totalPrice, clearCart } = useCartStore()
  const buyNowItem = useBuyNowStore((s) => s.item)
  const isBuyNow = useBuyNowStore((s) => s.isActive)
  const updateBuyNowQuantity = useBuyNowStore((s) => s.updateQuantity)
  const clearBuyNow = useBuyNowStore((s) => s.clearBuyNow)

  const checkoutItems = isBuyNow && buyNowItem ? [buyNowItem] : items

  const [step, setStep] = useState<Step>("shipping")
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>("")
  const [discount, setDiscount] = useState<number>(0)
  const [shippingForm, setShippingForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    country: DEFAULT_COUNTRY,
  })
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId>("card")
  const [walletBalance, setWalletBalance] = useState(0)
  const [upiId, setUpiId] = useState("")
  const [upiApp, setUpiApp] = useState<"gpay" | "phonepe" | "paytm" | "bhim">("gpay")
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null)
  const [cardForm, setCardForm] = useState({
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  })

  const loadWallet = useCallback(async () => {
    if (!user) return
    try {
      const data = await getWallet()
      setWalletBalance(data.balance ?? 0)
    } catch {
      setWalletBalance(0)
    }
  }, [user])

  useEffect(() => {
    if (step === "payment") loadWallet()
  }, [step, loadWallet])

  useEffect(() => {
    const onWalletUpdated = () => loadWallet()
    window.addEventListener("ub-wallet-updated", onWalletUpdated)
    return () => window.removeEventListener("ub-wallet-updated", onWalletUpdated)
  }, [loadWallet])

  const checkoutSubtotal = () =>
    isBuyNow && buyNowItem ? buyNowItem.price * buyNowItem.quantity : totalPrice()

  // Calculations
  const subtotal = checkoutSubtotal()
  const shippingFee = calcShippingFee(subtotal)
  const tax = calcGst(subtotal)
  const total = Math.max(0, subtotal + shippingFee + tax - discount)

  const handleCouponApplied = (discountAmt: number, couponCode: string) => {
    setDiscount(discountAmt)
    setAppliedCouponCode(couponCode)
  }

  const handleCouponRemoved = () => {
    setDiscount(0)
    setAppliedCouponCode("")
  }

  if (checkoutItems.length === 0 && step !== "confirmation") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="font-display font-bold text-2xl text-surface-200">
          {isBuyNow ? "Buy Now Session Expired" : "Your Cart is Empty"}
        </h2>
        <p className="text-sm text-surface-400 font-sans">
          {isBuyNow
            ? "Your instant checkout session ended. Select a product and tap Buy Now again."
            : "You cannot checkout without items in your cart."}
        </p>
        <Link to="/products" className="inline-flex py-2.5 px-6 gradient-primary text-white rounded-full font-sans text-xs font-semibold">
          Back to Catalogue
        </Link>
      </div>
    )
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Verify inputs
    if (
      !shippingForm.name ||
      !shippingForm.email ||
      !shippingForm.phone ||
      !shippingForm.address ||
      !shippingForm.city ||
      !shippingForm.state ||
      !shippingForm.pincode
    ) {
      toast.error("Please fill in all required delivery details")
      return
    }
    if (!/^\d{6}$/.test(shippingForm.pincode.trim())) {
      toast.error("Please enter a valid 6-digit PIN code")
      return
    }
    const phoneDigits = shippingForm.phone.replace(/\D/g, "")
    const mobile =
      phoneDigits.length === 12 && phoneDigits.startsWith("91")
        ? phoneDigits.slice(2)
        : phoneDigits
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Please enter a valid 10-digit Indian mobile number")
      return
    }
    setStep("payment")
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please sign in to place an order")
      navigate("/login")
      return
    }

    let payment_method: PaymentMethodId = selectedPayment
    let payment_status: "paid" | "pending" = "paid"
    let transaction_id: string | null = null

    if (selectedPayment === "wallet") {
      if (walletBalance < total) {
        toast.error("Insufficient wallet balance. Add money or choose another payment method.")
        return
      }
    } else if (selectedPayment === "card") {
      const cardError = validateCardForm(cardForm)
      if (cardError) {
        toast.error(cardError)
        return
      }
    } else if (selectedPayment === "upi") {
      if (!upiId.trim() || upiId.trim().length < 3) {
        toast.error("Please enter your UPI ID")
        return
      }
      payment_method = upiApp === "gpay" ? "gpay" : "upi"
    } else if (selectedPayment === "cod") {
      payment_status = "pending"
    }

    setIsPlacingOrder(true)
    setPaymentProcessing(true)

    try {
      if (appliedCouponCode) {
        const validation = await validateCoupon(appliedCouponCode, subtotal)
        if (!validation.valid) {
          toast.error(validation.message || "Coupon is no longer valid.")
          return
        }
      }

      if (selectedPayment === "upi" || selectedPayment === "card") {
        toast.loading("Processing payment…", { id: "pay-sim" })
        await delay(1600)
        const sim = await simulatePayment({
          method:
            selectedPayment === "card" ? "card" : upiApp === "gpay" ? "gpay" : "upi",
          amount: total,
          upiId: selectedPayment === "upi" ? upiId.trim() : undefined,
          cardNumber: selectedPayment === "card" ? cardForm.cardNumber : undefined,
        })
        toast.dismiss("pay-sim")
        if (!sim.success) {
          toast.error("Payment failed. Please try again.")
          return
        }
        transaction_id = sim.transaction_id
        payment_status = "paid"
      }

      if (selectedPayment === "wallet") {
        toast.loading("Debiting wallet…", { id: "pay-wallet" })
        await delay(800)
        toast.dismiss("pay-wallet")
        transaction_id = `WALLET_${Date.now()}`
      }

      const placed = await createOrder({
        total,
        shipping_address: { ...shippingForm },
        items: checkoutItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
        payment_method,
        payment_status,
        transaction_id,
      })

      setLastTransactionId(placed.transaction_id || transaction_id)

      if (appliedCouponCode) {
        try {
          await applyCoupon(appliedCouponCode, subtotal)
        } catch (couponErr) {
          console.warn("Coupon usage record failed after order:", couponErr)
          toast.warning("Order placed. Coupon could not be finalized on this order.")
        }
      }

      if (selectedPayment === "wallet") {
        setWalletBalance((b) => Math.max(0, b - total))
      }

      const successMsg =
        selectedPayment === "cod"
          ? "Order placed! Pay cash on delivery."
          : "Payment successful! Order confirmed."
      toast.success(successMsg)
      if (isBuyNow) {
        clearBuyNow()
      } else {
        clearCart()
      }
      notifyOrdersUpdated()
      setStep("confirmation")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order. Please try again."
      toast.error(message)
    } finally {
      setIsPlacingOrder(false)
      setPaymentProcessing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
    >
      {/* 1. Header & Step Tracker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-800/40 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">Secure Checkout</h1>
          <p className="text-xs text-surface-400 font-sans mt-0.5">
            {isBuyNow
              ? "Instant Buy Now checkout — complete your purchase in minutes."
              : "Complete your futuristic shopping order safely."}
          </p>
          {isBuyNow && buyNowItem && (
            <span className="inline-block mt-2 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300">
              Buy Now · 1 item
            </span>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {/* Shipping Step */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-sans ${
                step === "shipping"
                  ? "gradient-primary text-white"
                  : "bg-green-400/20 text-green-400 border border-green-500/25"
              }`}
            >
              {step === "payment" || step === "confirmation" ? "✓" : "1"}
            </span>
            <span className={`text-xs font-semibold ${step === "shipping" ? "text-primary-400" : "text-surface-400"}`}>
              Shipping
            </span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-surface-500" />

          {/* Payment Step */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-sans ${
                step === "payment"
                  ? "gradient-primary text-white"
                  : step === "confirmation"
                  ? "bg-green-400/20 text-green-400 border border-green-500/25"
                  : "glass text-surface-400 border border-surface-850"
              }`}
            >
              {step === "confirmation" ? "✓" : "2"}
            </span>
            <span className={`text-xs font-semibold ${step === "payment" ? "text-primary-400" : "text-surface-400"}`}>
              Payment
            </span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-surface-500" />

          {/* Confirm Step */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-sans ${
                step === "confirmation"
                  ? "gradient-primary text-white"
                  : "glass text-surface-400 border border-surface-850"
              }`}
            >
              3
            </span>
            <span className={`text-xs font-semibold ${step === "confirmation" ? "text-primary-400" : "text-surface-400"}`}>
              Confirmation
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "confirmation" ? (
          /* SUCCESS SCREEN */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto rounded-3xl glass p-10 sm:p-14 border border-surface-800/40 text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green-500/5 blur-[80px] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400 glow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-surface-100">Order Confirmed!</h2>
              <p className="text-sm text-surface-400 leading-relaxed font-sans max-w-md mx-auto">
                Thank you for your purchase! Your order transaction was validated on the chain. You will receive an email invoice shortly.
              </p>
            </div>

            <div className="bg-surface-950/40 rounded-2xl p-4 border border-surface-800/40 text-left max-w-sm mx-auto space-y-2.5 font-sans">
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Transaction ID</span>
                <span className="text-surface-200 font-mono text-[10px]">
                  {lastTransactionId || `ub_${Math.random().toString(36).substring(7)}`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-surface-400">Estimated delivery</span>
                <span className="text-surface-200 font-semibold">3 - 7 business days (India)</span>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 py-3 px-7 rounded-full gradient-primary text-sm font-sans font-bold text-white shadow-lg shadow-primary-500/20 hover:scale-103 transition-all cursor-pointer"
              >
                Track Your Orders
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          /* FORM + SIDEBAR CONTAINER */
          <div key="checkout-forms" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Col - Address/Payment Input */}
            <div className="lg:col-span-8">
              {step === "shipping" ? (
                /* SHIPPING ADDRESS FORM */
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl glass p-6 sm:p-8 border border-surface-800/40 shadow-xl space-y-6"
                >
                  <div className="flex items-center gap-2 border-b border-surface-800/30 pb-4">
                    <MapPin className="w-5 h-5 text-primary-400" />
                    <h3 className="font-display font-semibold text-base text-surface-150">Delivery Address (India)</h3>
                  </div>

                  <form onSubmit={handleShippingSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Full Name</label>
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        value={shippingForm.name}
                        onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Email Address</label>
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        value={shippingForm.email}
                        onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">House / Street / Area</label>
                      <input
                        type="text"
                        placeholder="Flat 12, Andheri West, Near Metro"
                        value={shippingForm.address}
                        onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        required
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">City</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        value={shippingForm.city}
                        onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        required
                      />
                    </div>

                    {/* State */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">State</label>
                      <select
                        value={shippingForm.state}
                        onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200 cursor-pointer"
                        required
                      >
                        {INDIAN_STATES.map((state) => (
                          <option key={state} value={state} className="bg-surface-950">
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* PIN code */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">PIN Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="400001"
                        value={shippingForm.pincode}
                        onChange={(e) =>
                          setShippingForm({
                            ...shippingForm,
                            pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                          })
                        }
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                        required
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Country</label>
                      <input
                        type="text"
                        value={shippingForm.country}
                        readOnly
                        className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans text-surface-400 bg-surface-900/40 cursor-not-allowed"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="sm:col-span-2 pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full gradient-primary text-xs font-semibold text-white cursor-pointer"
                      >
                        Continue to Payment
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* MULTI-PAYMENT */
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-3xl glass p-6 sm:p-8 border border-surface-800/40 shadow-xl space-y-6"
                >
                  <div className="flex items-center gap-2 border-b border-surface-800/30 pb-4">
                    <CreditCard className="w-5 h-5 text-primary-400" />
                    <h3 className="font-display font-semibold text-base text-surface-150">Payment Method</h3>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <PaymentMethods
                      selected={selectedPayment}
                      onSelect={setSelectedPayment}
                      walletBalance={walletBalance}
                    />

                    <div className="border-t border-surface-800/30 pt-5">
                      {selectedPayment === "wallet" && (
                        <WalletPayment
                          balance={walletBalance}
                          orderTotal={total}
                          onBalanceChange={setWalletBalance}
                        />
                      )}
                      {selectedPayment === "card" && (
                        <CardPayment form={cardForm} onChange={setCardForm} />
                      )}
                      {selectedPayment === "upi" && (
                        <UpiPayment
                          upiId={upiId}
                          onUpiIdChange={setUpiId}
                          selectedApp={upiApp}
                          onAppChange={(app) =>
                            setUpiApp(app as "gpay" | "phonepe" | "paytm" | "bhim")
                          }
                        />
                      )}
                      {selectedPayment === "cod" && <CodPayment orderTotal={total} />}
                    </div>

                    {paymentProcessing && (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl glass-light border border-primary-500/20">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
                        <span className="text-xs text-surface-300 font-sans">Securing your payment…</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setStep("shipping")}
                        className="text-xs font-semibold text-surface-400 hover:text-surface-200 cursor-pointer"
                      >
                        Back to Shipping
                      </button>
                      <button
                        type="submit"
                        disabled={isPlacingOrder}
                        className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full gradient-primary text-xs font-semibold text-white cursor-pointer animate-glow-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPlacingOrder ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing…
                          </>
                        ) : selectedPayment === "cod" ? (
                          "Place COD Order"
                        ) : (
                          <>
                            Pay & Place Order
                            <ShieldCheck className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>

            {/* Right Col - Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-3xl glass p-6 border border-surface-800/40 shadow-xl space-y-6">
                <div className="flex items-center gap-2 border-b border-surface-800/30 pb-4">
                  <ShoppingBag className="w-5 h-5 text-primary-400" />
                  <h3 className="font-display font-semibold text-base text-surface-150">Order Summary</h3>
                </div>

                {/* Items preview list */}
                <div className="max-h-48 overflow-y-auto space-y-3.5 pr-1.5 divide-y divide-surface-800/20">
                  {checkoutItems.map((item) => (
                    <div key={item.product_id} className="flex gap-3 pt-3.5 first:pt-0">
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-surface-800/40 bg-surface-900/30 flex-shrink-0">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between font-sans min-w-0">
                        <h4 className="text-xs text-surface-200 font-medium truncate leading-tight">
                          {item.title}
                        </h4>
                        <div className="flex justify-between items-center text-[10px] text-surface-450 mt-1 gap-2">
                          {isBuyNow && buyNowItem ? (
                            <div className="flex items-center gap-1.5 glass-light border border-surface-800/50 rounded-lg px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateBuyNowQuantity(buyNowItem.quantity - 1)}
                                className="px-1.5 text-surface-400 hover:text-primary-400 cursor-pointer font-bold"
                              >
                                −
                              </button>
                              <span className="text-surface-200 font-semibold w-4 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateBuyNowQuantity(buyNowItem.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="px-1.5 text-surface-400 hover:text-primary-400 cursor-pointer font-bold disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span>Qty: {item.quantity}</span>
                          )}
                          <span className="font-semibold text-primary-400 flex-shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon input */}
                <div className="pt-4 border-t border-surface-800/30">
                  <CouponInput
                    cartTotal={subtotal}
                    onCouponApplied={handleCouponApplied}
                    onCouponRemoved={handleCouponRemoved}
                  />
                </div>

                {/* Costs details */}
                <div className="space-y-2 pt-4 border-t border-surface-800/30 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-surface-400">Subtotal</span>
                    <span className="text-surface-200 font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400 font-semibold">
                      <span>Discount ({appliedCouponCode})</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-surface-400">Shipping</span>
                    <span className="text-surface-200 font-semibold">
                      {shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-surface-400">GST ({Math.round(GST_RATE * 100)}%)</span>
                    <span className="text-surface-200 font-semibold">{formatCurrency(tax)}</span>
                  </div>
                  {subtotal < FREE_SHIPPING_MIN_INR && (
                    <p className="text-[10px] text-surface-500 pt-1">
                      Free delivery on orders above {formatCurrency(FREE_SHIPPING_MIN_INR)}
                    </p>
                  )}
                  <div className="flex justify-between border-t border-surface-800/35 pt-4 text-sm font-bold">
                    <span className="text-surface-200">Total</span>
                    <span className="gradient-text">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
