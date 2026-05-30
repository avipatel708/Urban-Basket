import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { motion } from "motion/react"
import { Mail, Lock, User, ArrowRight, UserPlus, ShoppingBag, Store } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { Logo } from "@/components/common/Logo"
import { toast } from "sonner"

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signUp, loading } = useAuthStore()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"customer" | "seller">(
    (searchParams.get("role") as "customer" | "seller") || "customer"
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    const { error } = await signUp(email, password, name, role)
    if (error) {
      toast.error(error)
    } else {
      toast.success("Account created! Welcome to Urban-Basket.")
      if (role === "seller") {
        navigate("/seller/dashboard")
      } else {
        navigate("/")
      }
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-500/5 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md glass p-8 rounded-3xl border border-surface-800/40 shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="mb-2">
            <Logo size="lg" />
          </Link>
          <h2 className="font-display font-bold text-xl text-surface-50">Create Account</h2>
          <p className="text-xs text-surface-400 font-sans leading-relaxed">
            Join Urban-Basket and step into the future of e-commerce
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-surface-950/40 p-1.5 rounded-xl border border-surface-800/60">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
              role === "customer"
                ? "gradient-primary text-white shadow-md shadow-primary-500/10"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole("seller")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
              role === "seller"
                ? "gradient-primary text-white shadow-md shadow-primary-500/10"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Seller
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-surface-400 font-sans tracking-wide uppercase">
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

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-surface-400 font-sans tracking-wide uppercase">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-surface-400 font-sans tracking-wide uppercase">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 mt-6 rounded-xl gradient-primary font-semibold text-white shadow-lg shadow-primary-500/25 hover:scale-[1.01] hover:shadow-primary-500/40 active:scale-[0.99] disabled:opacity-55 disabled:scale-100 transition-all text-sm cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                Create Account
                <UserPlus className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-surface-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-350 font-semibold inline-flex items-center gap-0.5 hover:gap-1 transition-all"
            >
              Sign In
              <ArrowRight className="w-3 h-3 mt-0.5" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
