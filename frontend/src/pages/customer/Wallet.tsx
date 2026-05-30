import { motion } from "motion/react"
import { WalletPanel } from "@/components/wallet/WalletPanel"
import { Link } from "react-router"

export default function WalletPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-10"
    >
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">
          Urban-Basket Wallet
        </h1>
        <p className="text-xs text-surface-400 font-sans mt-0.5">
          Check balance, add money, and view refunds from returns.
        </p>
      </div>

      <div className="rounded-3xl glass border border-surface-800/40 p-5 sm:p-6">
        <WalletPanel />
      </div>

      <p className="text-center text-[11px] text-surface-500 font-sans">
        Pay with wallet at{" "}
        <Link to="/checkout" className="text-primary-400 font-semibold hover:underline">
          checkout
        </Link>
        . Returns within 10 days are refunded here automatically.
      </p>
    </motion.div>
  )
}
