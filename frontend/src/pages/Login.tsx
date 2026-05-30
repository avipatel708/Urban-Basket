import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { motion } from "motion/react"
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { Logo } from "@/components/common/Logo"
import { toast } from "sonner"

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, loading } = useAuthStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const redirectTo = searchParams.get("redirect") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    const { error } = await signIn(email, password)
    if (error) {
      toast.error(error)
    } else {
      toast.success("Successfully signed in!")
      // Fetch the store state's profile to inspect role
      const profile = useAuthStore.getState().profile
      if (profile?.role === "seller") {
        navigate("/seller/dashboard")
      } else {
        navigate(redirectTo)
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
          <h2 className="font-display font-bold text-xl text-surface-50">Welcome Back</h2>
          <p className="text-xs text-surface-400 font-sans leading-relaxed">
            Enter your credentials to access your futuristic shopping ecosystem
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-surface-400 font-sans tracking-wide uppercase">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-surface-400 font-sans tracking-wide uppercase">
                Password
              </label>
              <Link to="/forgot-password" className="text-[10px] text-primary-400 hover:text-primary-350 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-surface-500 pointer-events-none" />
              <input
                type="password"
                placeholder="••••••••"
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
                Sign In
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-surface-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary-400 hover:text-primary-350 font-semibold inline-flex items-center gap-0.5 hover:gap-1 transition-all"
            >
              Sign Up
              <ArrowRight className="w-3 h-3 mt-0.5" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
