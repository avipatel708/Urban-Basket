import { useState, useCallback, useEffect } from "react"
import { Link } from "react-router"
import { Wallet, Plus, Loader2, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getWallet, addWalletMoney, type WalletTransaction } from "@/services/paymentService"
import { toast } from "sonner"

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

function formatTransactionLabel(tx: WalletTransaction): string {
  const ref = tx.reference || ""
  if (ref.startsWith("return_order_")) return "Return refund"
  if (ref.startsWith("order_")) return "Order payment"
  if (ref === "wallet_topup") return "Wallet top-up"
  if (ref) return ref.replace(/_/g, " ")
  return tx.type === "credit" ? "Money added" : "Money spent"
}

interface WalletPanelProps {
  compact?: boolean
  onBalanceChange?: (balance: number) => void
}

export function WalletPanel({ compact = false, onBalanceChange }: WalletPanelProps) {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [customAmount, setCustomAmount] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const loadWallet = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getWallet()
      const bal = data.balance ?? 0
      setBalance(bal)
      setTransactions(data.transactions || [])
      onBalanceChange?.(bal)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load wallet")
      setBalance(0)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [onBalanceChange])

  useEffect(() => {
    loadWallet()
    const onUpdated = () => loadWallet()
    window.addEventListener("ub-wallet-updated", onUpdated)
    return () => window.removeEventListener("ub-wallet-updated", onUpdated)
  }, [loadWallet])

  const handleAddMoney = async (amount: string | number) => {
    const amt = parseFloat(String(amount))
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount to add")
      return
    }
    setIsAdding(true)
    try {
      const res = await addWalletMoney(amt)
      toast.success(res.message || "Money added to your wallet")
      setBalance(res.balance)
      onBalanceChange?.(res.balance)
      setCustomAmount("")
      window.dispatchEvent(new Event("ub-wallet-updated"))
      await loadWallet()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add money")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className={`font-sans ${compact ? "p-4 space-y-4" : "space-y-6"}`}>
      <div className="rounded-2xl glass-light border border-primary-500/25 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
              Urban-Basket Wallet
            </p>
            {loading ? (
              <div className="flex items-center gap-2 mt-1 text-surface-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            ) : (
              <p className="text-xl font-display font-bold gradient-text truncate">
                {formatCurrency(balance)}
              </p>
            )}
          </div>
        </div>
        <p className="relative mt-2 text-[10px] text-surface-500 leading-relaxed">
          Use at checkout · Refunds from returns are credited here
        </p>
      </div>

      {!compact && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-surface-450 uppercase">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isAdding || loading}
                onClick={() => handleAddMoney(amt)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-surface-800/50 glass-light text-surface-300 hover:border-primary-500/40 hover:text-primary-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                +₹{amt.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          placeholder="Amount (₹)"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="flex-1 glass-light border border-surface-800/50 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary-500 text-surface-200"
        />
        <button
          type="button"
          disabled={isAdding || loading}
          onClick={() => handleAddMoney(customAmount)}
          className="inline-flex items-center gap-1 py-2 px-3 rounded-xl gradient-primary text-[11px] font-semibold text-white cursor-pointer disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </div>

      {compact && (
        <div className="flex flex-wrap gap-1.5">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={isAdding || loading}
              onClick={() => handleAddMoney(amt)}
              className="px-2 py-1 rounded-full text-[10px] font-semibold border border-surface-800/50 text-surface-400 hover:text-primary-400 cursor-pointer disabled:opacity-50"
            >
              +₹{amt}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold text-surface-450 uppercase mb-2">Recent activity</p>
        <div className={`overflow-y-auto divide-y divide-surface-800/40 ${compact ? "max-h-44" : "max-h-72"}`}>
          {loading ? (
            <p className="text-xs text-surface-500 py-4 text-center">Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-surface-500 py-4 text-center">No transactions yet</p>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.type === "credit"
              return (
                <div key={tx.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCredit
                        ? "bg-green-500/15 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-surface-200 truncate">
                      {formatTransactionLabel(tx)}
                    </p>
                    <p className="text-[9px] text-surface-500">
                      {tx.created_at ? formatDate(tx.created_at) : "—"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold flex-shrink-0 ${
                      isCredit ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isCredit ? "+" : "−"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {compact && (
        <Link
          to="/wallet"
          className="block text-center text-[11px] font-semibold text-primary-400 hover:text-primary-300 pt-1"
        >
          Open full wallet →
        </Link>
      )}
    </div>
  )
}
