import { useState } from "react"
import { motion } from "motion/react"
import { User, Mail, ShieldAlert, Award, Save } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

export default function Profile() {
  const { profile } = useAuthStore()

  const [name, setName] = useState(profile?.name || "")
  const [email, setEmail] = useState(profile?.email || "")
  const [role, setRole] = useState(profile?.role || "customer")
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Profile updated successfully!")
    }, 800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="rounded-3xl glass p-6 sm:p-8 border border-surface-800/40 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-primary-500/5 blur-3xl pointer-events-none" />

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-surface-800/30">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary-500/20 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.slice(0, 2).toUpperCase() || "UB"
            )}
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="font-display font-bold text-xl text-surface-50">{name || "User Profile"}</h2>
            <p className="text-xs text-surface-400 font-sans">{email}</p>
            <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-0.5 rounded gradient-primary text-[10px] font-bold text-white uppercase tracking-wider">
              <Award className="w-3 h-3" />
              {role}
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>
          </div>

          {/* Email (Read-only as it is tied to account auth) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-surface-450 uppercase font-sans tracking-wide">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                className="w-full glass-light border border-surface-800/30 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans text-surface-400 cursor-not-allowed opacity-75"
                readOnly
              />
            </div>
            <p className="text-[10px] text-surface-500 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-500/80" />
              Email address cannot be changed. Contact administration if updates are required.
            </p>
          </div>

          {/* Save Changes button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl gradient-primary font-semibold text-white shadow-lg shadow-primary-500/20 text-xs font-sans hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 disabled:scale-100 transition-all cursor-pointer"
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
