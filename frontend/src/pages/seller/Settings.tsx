import { useState } from "react"
import { motion } from "motion/react"
import { User, Store, Bell, Shield, Save } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

type Tab = "profile" | "store" | "notifications" | "security"

export default function SellerSettings() {
  const { profile } = useAuthStore()

  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || "Seller Admin",
    email: profile?.email || "seller@example.com"
  })
  const [storeForm, setStoreForm] = useState({
    storeName: "Quantum Core Tech",
    storeDesc: "Providing next-generation futuristic gadgets and premium accessories globally."
  })
  const [securityForm, setSecurityForm] = useState({
    currentPass: "",
    newPass: "",
    confirmPass: ""
  })
  const [notifs, setNotifs] = useState({
    orders: true,
    inventory: true,
    payouts: false
  })
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Settings saved successfully!")
    }, 700)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 pb-8 font-sans"
    >
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-50">Settings</h1>
        <p className="text-xs text-surface-400 mt-0.5">Manage profile settings, store information, and security preferences.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex overflow-x-auto pb-1 -mx-2 px-2 gap-2 border-b border-surface-800/40 scrollbar-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans border-b-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-surface-450 hover:text-surface-200"
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("store")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans border-b-2 transition-all cursor-pointer ${
            activeTab === "store"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-surface-450 hover:text-surface-200"
          }`}
        >
          <Store className="w-4 h-4" />
          Store Info
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans border-b-2 transition-all cursor-pointer ${
            activeTab === "notifications"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-surface-450 hover:text-surface-200"
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans border-b-2 transition-all cursor-pointer ${
            activeTab === "security"
              ? "border-primary-500 text-primary-400"
              : "border-transparent text-surface-450 hover:text-surface-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="rounded-3xl glass p-6 sm:p-8 border border-surface-800/40 shadow-xl">
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-sm text-surface-150 border-b border-surface-800/30 pb-2">
                Personal Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    className="w-full glass-light border border-surface-800/30 rounded-xl py-2 px-4 text-sm text-surface-400 cursor-not-allowed opacity-75"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "store" && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-sm text-surface-150 border-b border-surface-800/30 pb-2">
                Storefront Settings
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">Store Name</label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">Store Description</label>
                  <textarea
                    value={storeForm.storeDesc}
                    onChange={(e) => setStoreForm({ ...storeForm, storeDesc: e.target.value })}
                    rows={3}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-sm text-surface-150 border-b border-surface-800/30 pb-2">
                Alert Rules
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/20 border border-surface-850">
                  <div>
                    <h4 className="text-xs font-semibold text-surface-200">Order Alerts</h4>
                    <p className="text-[10px] text-surface-500 mt-0.5">Receive notifications for newly placed customer purchases.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifs.orders}
                    onChange={(e) => setNotifs({ ...notifs, orders: e.target.checked })}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/20 border border-surface-850">
                  <div>
                    <h4 className="text-xs font-semibold text-surface-200">Low Inventory Warnings</h4>
                    <p className="text-[10px] text-surface-500 mt-0.5">Alerts when items in stock fall below 5 units.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifs.inventory}
                    onChange={(e) => setNotifs({ ...notifs, inventory: e.target.checked })}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500 cursor-pointer rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-sm text-surface-150 border-b border-surface-800/30 pb-2">
                Security Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={securityForm.currentPass}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPass: e.target.value })}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={securityForm.newPass}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPass: e.target.value })}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={securityForm.confirmPass}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPass: e.target.value })}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-end pt-4 border-t border-surface-800/20">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 transition-all cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
