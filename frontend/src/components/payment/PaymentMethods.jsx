import { motion } from "motion/react"
import {
  Wallet,
  Smartphone,
  CreditCard,
  Banknote,
} from "lucide-react"

const METHODS = [
  {
    id: "wallet",
    label: "Urban-Basket Wallet",
    description: "Pay with your wallet balance",
    icon: Wallet,
    accent: "from-violet-500/20 to-purple-600/10",
  },
  {
    id: "upi",
    label: "UPI",
    description: "Google Pay, PhonePe, Paytm, BHIM & more",
    icon: Smartphone,
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    id: "card",
    label: "Debit / Credit Card",
    description: "Visa, Mastercard, RuPay",
    icon: CreditCard,
    accent: "from-primary-500/20 to-indigo-500/10",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: Banknote,
    accent: "from-amber-500/20 to-orange-500/10",
  },
]

export function PaymentMethods({ selected, onSelect, walletBalance }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {METHODS.map((method) => {
        const Icon = method.icon
        const isSelected = selected === method.id
        const isWallet = method.id === "wallet"

        return (
          <motion.button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`relative text-left rounded-2xl p-4 border transition-all duration-300 cursor-pointer overflow-hidden ${
              isSelected
                ? "border-primary-500/60 bg-primary-500/5 shadow-[0_0_24px_rgba(139,92,246,0.15)] ring-1 ring-primary-500/40"
                : "border-surface-800/50 glass-light hover:border-surface-700/60 hover:bg-surface-900/30"
            }`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${method.accent} opacity-60 pointer-events-none`}
            />
            <div className="relative flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isSelected
                    ? "gradient-primary text-white border-primary-400/30"
                    : "glass border-surface-800/50 text-primary-400"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-sm text-surface-100">{method.label}</p>
                <p className="text-[10px] text-surface-450 mt-0.5 leading-snug">{method.description}</p>
                {isWallet && walletBalance != null && (
                  <p className="text-[10px] font-bold text-primary-400 mt-1.5">
                    Balance: ₹{Number(walletBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? "border-primary-400 bg-primary-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    : "border-surface-600 bg-transparent"
                }`}
              />
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
