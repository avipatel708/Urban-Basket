import { Link } from "react-router"
import { motion } from "motion/react"
import { Gift, Sparkles } from "lucide-react"

/** Floating shortcut to Mystery Boxes — sits above order tracker & chat. */
export function FloatingMysteryBoxButton() {
  return (
    <Link
      to="/mystery"
      className="group relative block"
      aria-label="Mystery Boxes"
      title="Mystery Boxes — surprise rewards"
    >
      <motion.span
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex w-14 h-14 rounded-2xl items-center justify-center bg-surface-950/90 border-2 border-amber-500/50 shadow-[0_0_28px_rgba(245,158,11,0.35)] backdrop-blur-md overflow-hidden"
      >
        <span className="absolute inset-0 bg-gradient-to-br from-amber-500/25 via-primary-500/20 to-accent-500/25" />
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <Gift className="w-6 h-6 text-amber-300" />
        </motion.span>
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center border border-surface-950">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </span>
      </motion.span>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity hidden lg:block">
        <span className="text-[10px] font-semibold text-amber-200 glass px-2.5 py-1 rounded-lg border border-amber-500/30">
          Mystery Boxes
        </span>
      </span>
    </Link>
  )
}
