import { Banknote, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function CodPayment({ orderTotal }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass-light border border-amber-500/25 p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />
        <div className="relative flex gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="font-sans space-y-1">
            <p className="text-sm font-semibold text-surface-150">Cash on Delivery</p>
            <p className="text-[11px] text-surface-400 leading-relaxed">
              Pay {formatCurrency(orderTotal)} in cash when your order is delivered. No online payment
              required now.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2 text-[11px] text-surface-400 font-sans">
        <li className="flex items-start gap-2">
          <Package className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
          Order status will show as <span className="text-amber-400 font-semibold">Pending Payment (COD)</span>
        </li>
        <li className="flex items-start gap-2">
          <Package className="w-3.5 h-3.5 text-primary-400 mt-0.5 flex-shrink-0" />
          Please keep exact change ready for the delivery partner
        </li>
      </ul>
    </div>
  )
}
