import { motion } from "motion/react"
import { Gift, Sparkles, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { MysteryBox } from "@/services/mysteryBoxService"

const TIER_GLOW: Record<string, string> = {
  budget: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  electronics: "from-primary-500/25 to-accent-500/25 border-primary-500/35",
  fashion: "from-pink-500/20 to-purple-500/20 border-pink-500/30",
  premium: "from-amber-500/25 to-orange-500/20 border-amber-500/40",
  gaming: "from-cyan-500/20 to-indigo-500/25 border-cyan-500/35",
}

interface MysteryBoxCardProps {
  box: MysteryBox
  onOpen: (box: MysteryBox) => void
}

export function MysteryBoxCard({ box, onOpen }: MysteryBoxCardProps) {
  const glow = TIER_GLOW[box.tier] || TIER_GLOW.electronics
  const soldOut = box.stock < 1

  return (
    <motion.article
      whileHover={soldOut ? undefined : { y: -6, scale: 1.02 }}
      className={`rounded-3xl glass border overflow-hidden flex flex-col h-full bg-gradient-to-br ${glow} ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={box.image_url || ""}
          alt={box.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-surface-950/70 border border-white/10 text-primary-300">
          <Sparkles className="w-3 h-3" />
          {box.tier}
        </span>
        {soldOut && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            Sold out
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-display font-bold text-base text-surface-50">{box.title}</h3>
          <p className="text-[11px] text-surface-400 mt-1 line-clamp-2 leading-relaxed">
            {box.description}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-surface-500">
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            {box.min_items}–{box.max_items} surprises
          </span>
          <span className="flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-primary-400" />
            Value ≥ price
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-surface-800/40">
          <span className="font-display font-bold text-lg text-primary-400">
            {formatCurrency(box.price)}
          </span>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onOpen(box)}
            className="py-2.5 px-5 rounded-full gradient-primary text-white text-xs font-bold shadow-lg shadow-primary-500/25 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer"
          >
            {soldOut ? "Unavailable" : "Open Box"}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
