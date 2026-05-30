import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, Gift, Trophy } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { MysteryRevealProduct } from "@/services/mysteryBoxService"

interface MysteryBoxOpeningProps {
  boxTitle: string
  products: MysteryRevealProduct[]
  totalRetailValue: number
  boxPrice: number
  onComplete?: () => void
}

export function MysteryBoxOpening({
  boxTitle,
  products,
  totalRetailValue,
  boxPrice,
  onComplete,
}: MysteryBoxOpeningProps) {
  const [phase, setPhase] = useState<"shake" | "burst" | "reveal">("shake")
  const [revealedIndex, setRevealedIndex] = useState(-1)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 1400)
    const t2 = setTimeout(() => setPhase("reveal"), 2200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (phase !== "reveal") return
    if (revealedIndex >= products.length - 1) {
      const done = setTimeout(() => onComplete?.(), 800)
      return () => clearTimeout(done)
    }
    const t = setTimeout(() => setRevealedIndex((i) => i + 1), 700)
    return () => clearTimeout(t)
  }, [phase, revealedIndex, products.length, onComplete])

  useEffect(() => {
    if (phase === "reveal" && revealedIndex === -1) {
      setRevealedIndex(0)
    }
  }, [phase, revealedIndex])

  const savings = Math.max(0, totalRetailValue - boxPrice)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/90 backdrop-blur-xl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-accent-500/15 blur-[80px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-lg">
        <AnimatePresence mode="wait">
          {phase !== "reveal" && (
            <motion.div
              key="box"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={
                phase === "shake"
                  ? { scale: 1, opacity: 1, rotate: [0, -4, 4, -4, 4, 0] }
                  : { scale: 1.4, opacity: 0 }
              }
              transition={
                phase === "shake"
                  ? { rotate: { duration: 1.2, repeat: 0 }, scale: { duration: 0.4 } }
                  : { duration: 0.5 }
              }
              className="flex flex-col items-center text-center"
            >
              <div className="w-40 h-40 rounded-3xl gradient-primary flex items-center justify-center shadow-[0_0_60px_rgba(139,92,246,0.6)] border border-primary-300/40 relative">
                <Gift className="w-16 h-16 text-white" />
                {phase === "burst" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    className="absolute inset-0 rounded-3xl bg-accent-400/40"
                  />
                )}
              </div>
              <p className="mt-6 font-display font-bold text-xl text-surface-50">{boxTitle}</p>
              <p className="text-sm text-surface-400 mt-1 flex items-center gap-2 justify-center">
                <Sparkles className="w-4 h-4 text-primary-400 animate-spin" />
                Opening your mystery loot…
              </p>
            </motion.div>
          )}

          {phase === "reveal" && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold"
                >
                  <Trophy className="w-4 h-4" />
                  You saved {formatCurrency(savings)}!
                </motion.div>
                <h2 className="font-display font-bold text-2xl text-surface-50 mt-4">
                  Your rewards
                </h2>
                <p className="text-xs text-surface-400 mt-1">
                  Retail value {formatCurrency(totalRetailValue)} · Paid {formatCurrency(boxPrice)}
                </p>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {products.map((product, index) => (
                  <AnimatePresence key={product.product_id}>
                    {index <= revealedIndex && (
                      <motion.div
                        initial={{ opacity: 0, x: -30, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="flex gap-4 p-4 rounded-2xl glass border border-primary-500/30 shadow-[0_0_24px_rgba(139,92,246,0.15)]"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-surface-700/50 flex-shrink-0 relative">
                          <img
                            src={product.image_url || ""}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent pointer-events-none" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-surface-100 line-clamp-2">
                            {product.title}
                          </p>
                          <p className="text-xs text-primary-400 font-bold mt-1">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                        <Sparkles className="w-5 h-5 text-accent-400 flex-shrink-0 animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
