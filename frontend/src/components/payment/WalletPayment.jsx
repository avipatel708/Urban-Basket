import { useState } from "react"
import { Wallet, Plus, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { addWalletMoney } from "@/services/paymentService"
import { toast } from "sonner"

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export function WalletPayment({ balance, orderTotal, onBalanceChange }) {
  const [customAmount, setCustomAmount] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const insufficient = balance < orderTotal

  const handleAddMoney = async (amount) => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount to add")
      return
    }
    setIsAdding(true)
    try {
      const res = await addWalletMoney(amt)
      toast.success(res.message || "Wallet topped up successfully")
      onBalanceChange?.(res.balance)
      setCustomAmount("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add money")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl glass-light border border-primary-500/25 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide font-sans">
                Available Balance
              </p>
              <p className="text-xl font-display font-bold gradient-text">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
          <div className="text-right font-sans">
            <p className="text-[10px] text-surface-450">Order total</p>
            <p className="text-sm font-semibold text-surface-200">{formatCurrency(orderTotal)}</p>
          </div>
        </div>
        {insufficient && (
          <p className="relative mt-3 text-[11px] text-amber-400 font-sans">
            Insufficient balance. Add money to complete this order with your wallet.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-surface-450 uppercase font-sans">Quick Add</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={isAdding}
              onClick={() => handleAddMoney(amt)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold font-sans border border-surface-800/50 glass-light text-surface-300 hover:border-primary-500/40 hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              +₹{amt.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          placeholder="Custom amount (₹)"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="flex-1 glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
        />
        <button
          type="button"
          disabled={isAdding}
          onClick={() => handleAddMoney(customAmount)}
          className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl gradient-primary text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Money
        </button>
      </div>
    </div>
  )
}
