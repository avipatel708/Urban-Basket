import { Smartphone } from "lucide-react"

export const UPI_APP_IDS = ["gpay", "phonepe", "paytm", "bhim"]

const UPI_APPS = [
  { id: "gpay", name: "Google Pay", color: "text-blue-400" },
  { id: "phonepe", name: "PhonePe", color: "text-purple-400" },
  { id: "paytm", name: "Paytm", color: "text-cyan-400" },
  { id: "bhim", name: "BHIM UPI", color: "text-orange-400" },
]

export function UpiPayment({ upiId, onUpiIdChange, selectedApp, onAppChange }) {
  const selected = UPI_APPS.find((a) => a.id === selectedApp)
  const placeholder =
    selectedApp === "gpay"
      ? "yourname@okaxis"
      : selectedApp === "paytm"
      ? "mobile@paytm"
      : selectedApp === "phonepe"
      ? "mobile@ybl"
      : "name@upi"

  return (
    <div className="space-y-5">
      <div className="rounded-2xl glass-light border border-surface-800/50 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="font-sans">
          <p className="text-sm font-semibold text-surface-150">UPI Payment</p>
          <p className="text-[10px] text-surface-450 mt-0.5">
            Google Pay, PhonePe, Paytm, BHIM & other UPI apps
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-bold text-surface-450 uppercase font-sans">Choose UPI app</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UPI_APPS.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onAppChange?.(app.id)}
              className={`rounded-xl py-2.5 px-2 text-center border text-[10px] font-bold font-sans transition-all cursor-pointer ${
                selectedApp === app.id
                  ? "border-primary-500/50 bg-primary-500/10 text-primary-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                  : "border-surface-800/50 glass-light text-surface-400 hover:border-surface-700"
              }`}
            >
              <span className={app.color}>{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-surface-450 uppercase font-sans">
          {selected ? `${selected.name} UPI ID` : "UPI ID"}
        </label>
        <input
          type="text"
          placeholder={placeholder}
          value={upiId}
          onChange={(e) => onUpiIdChange(e.target.value)}
          className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
        />
        <p className="text-[10px] text-surface-500 font-sans">
          Demo mode: payment will be simulated after you confirm the order.
        </p>
      </div>
    </div>
  )
}
