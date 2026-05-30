import { Link } from "react-router"
import { motion } from "motion/react"
import { Compass, ArrowRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-500/5 blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md glass p-10 rounded-3xl border border-surface-800/40 shadow-2xl relative z-10 space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto text-primary-400 border border-surface-800/40 glow-sm"
        >
          <Compass className="w-8 h-8" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-7xl tracking-tight gradient-text">404</h1>
          <h2 className="font-display font-bold text-lg text-surface-50">Page Not Found</h2>
          <p className="text-xs text-surface-400 font-sans leading-relaxed max-w-xs mx-auto">
            The page you are trying to access does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/20 hover:scale-102 transition-all cursor-pointer"
          >
            Go back home
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
