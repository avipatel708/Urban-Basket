import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion } from "motion/react"
import { Gift, Sparkles, ArrowRight } from "lucide-react"
import { getMysteryBoxes, type MysteryBox } from "@/services/mysteryBoxService"
import { MYSTERY_BOXES_FALLBACK } from "@/utils/mysteryBoxFallback"
import { formatCurrency } from "@/lib/utils"

export function LandingMysterySection() {
  const [boxes, setBoxes] = useState<MysteryBox[]>(MYSTERY_BOXES_FALLBACK)

  useEffect(() => {
    getMysteryBoxes().then((data) => {
      if (data?.length) setBoxes(data.slice(0, 5))
    })
  }, [])

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="rounded-3xl glass border border-amber-500/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950/30 via-primary-950/20 to-accent-950/20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-6 sm:p-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                New — Mystery Boxes
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-surface-50">
                Unbox <span className="gradient-text">Surprise Loot</span>
              </h2>
              <p className="text-sm text-surface-400 leading-relaxed font-sans">
                Pay once, get real products worth equal or more. Budget, fashion, electronics, gaming
                & premium tiers — with a cinematic reveal.
              </p>
              <Link
                to="/mystery"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-primary-500 text-white text-sm font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.03] transition-all"
              >
                <Gift className="w-5 h-5" />
                Open Mystery Boxes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="hidden sm:flex w-28 h-28 rounded-3xl gradient-primary items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.4)] border border-primary-400/30 flex-shrink-0 animate-glow-pulse">
              <Gift className="w-14 h-14 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {boxes.map((box, i) => (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/mystery"
                  className="block rounded-2xl overflow-hidden border border-surface-800/50 bg-surface-950/40 hover:border-amber-500/40 hover:scale-[1.02] transition-all group"
                >
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={box.image_url || ""}
                      alt={box.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase text-amber-300">
                      {box.tier}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] sm:text-xs font-semibold text-surface-200 line-clamp-1">
                      {box.title.replace(" Mystery Box", "")}
                    </p>
                    <p className="text-[10px] font-bold text-primary-400 mt-0.5">
                      {formatCurrency(box.price)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
