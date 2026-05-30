import { useMemo } from "react"

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function detectCardBrand(number) {
  const d = number.replace(/\D/g, "")
  if (/^4/.test(d)) return "Visa"
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard"
  if (/^(508|60|65|81|82|83)/.test(d)) return "RuPay"
  return null
}

export function validateCardForm(form) {
  const digits = form.cardNumber.replace(/\D/g, "")
  if (!form.cardName.trim()) return "Please enter cardholder name"
  if (digits.length < 13 || digits.length > 19) return "Please enter a valid card number"
  const [mm, yy] = form.cardExpiry.split("/")
  if (!mm || !yy || mm.length !== 2 || yy.length !== 2) return "Enter expiry as MM/YY"
  const month = parseInt(mm, 10)
  if (month < 1 || month > 12) return "Invalid expiry month"
  const year = 2000 + parseInt(yy, 10)
  const now = new Date()
  const exp = new Date(year, month, 0)
  if (exp < now) return "Card has expired"
  if (!/^\d{3,4}$/.test(form.cardCvv)) return "Enter a valid CVV"
  return null
}

export function CardPayment({ form, onChange }) {
  const brand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber])
  const maskedPreview = useMemo(() => {
    const d = form.cardNumber.replace(/\D/g, "")
    if (d.length < 4) return "•••• •••• •••• ••••"
    const last4 = d.slice(-4)
    return `•••• •••• •••• ${last4}`
  }, [form.cardNumber])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 bg-gradient-to-br from-primary-600/30 via-indigo-900/40 to-surface-950 border border-primary-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative space-y-6 font-sans">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase tracking-widest text-surface-300/80">Urban-Basket Secure</span>
            {brand && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-surface-100">
                {brand}
              </span>
            )}
          </div>
          <p className="font-mono text-lg tracking-widest text-surface-50">{maskedPreview}</p>
          <div className="flex justify-between text-xs">
            <div>
              <p className="text-[9px] text-surface-400 uppercase">Card Holder</p>
              <p className="text-surface-100 font-medium truncate max-w-[140px]">
                {form.cardName || "YOUR NAME"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-surface-400 uppercase">Expires</p>
              <p className="text-surface-100 font-medium">{form.cardExpiry || "MM/YY"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3 space-y-1.5">
          <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Cardholder Name</label>
          <input
            type="text"
            placeholder="Rahul Sharma"
            value={form.cardName}
            onChange={(e) => onChange({ ...form, cardName: e.target.value })}
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
          />
        </div>

        <div className="sm:col-span-3 space-y-1.5">
          <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Card Number</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="4111 2222 3333 4444"
            value={form.cardNumber}
            onChange={(e) => onChange({ ...form, cardNumber: formatCardNumber(e.target.value) })}
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200 font-mono"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">Expiration Date</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={form.cardExpiry}
            onChange={(e) => onChange({ ...form, cardExpiry: formatExpiry(e.target.value) })}
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">CVV</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="•••"
            value={form.cardCvv}
            onChange={(e) =>
              onChange({ ...form, cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
            }
            className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
          />
        </div>
      </div>

      <p className="text-[10px] text-surface-500 font-sans">
        Supports Visa, Mastercard & RuPay. Payments are simulated securely for this demo.
      </p>
    </div>
  )
}
