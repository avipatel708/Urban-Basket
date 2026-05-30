import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { Gift, History, Sparkles } from "lucide-react"
import { MysteryBoxCard } from "@/components/mystery/MysteryBoxCard"
import { MysteryBoxPurchaseModal } from "@/components/mystery/MysteryBoxPurchaseModal"
import { MysteryBoxOpening } from "@/components/mystery/MysteryBoxOpening"
import {
  getMysteryBoxes,
  type MysteryBox,
  type PurchaseMysteryBoxResponse,
} from "@/services/mysteryBoxService"
import { MYSTERY_BOXES_FALLBACK } from "@/utils/mysteryBoxFallback"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

export default function MysteryBoxesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [boxes, setBoxes] = useState<MysteryBox[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBox, setSelectedBox] = useState<MysteryBox | null>(null)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [reveal, setReveal] = useState<PurchaseMysteryBoxResponse | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMysteryBoxes()
      setBoxes(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Using offline box catalog — start backend for live purchases.")
      setBoxes(MYSTERY_BOXES_FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleOpenBox = (box: MysteryBox) => {
    if (!user) {
      toast.error("Sign in to open mystery boxes.")
      navigate("/login", { state: { from: "/mystery" } })
      return
    }
    setSelectedBox(box)
    setPurchaseOpen(true)
  }

  const handlePurchaseSuccess = (result: PurchaseMysteryBoxResponse) => {
    setReveal(result)
    load()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12"
      >
        <div className="relative rounded-3xl glass border border-primary-500/20 overflow-hidden p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-950/50 via-transparent to-accent-950/30 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Urban-Basket Loot
              </span>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-surface-50">
                Mystery Boxes
              </h1>
              <p className="text-sm text-surface-400 mt-2 max-w-lg leading-relaxed">
                Premium surprise drops. Every box guarantees real products worth as much or more than
                you pay — with a cinematic reveal.
              </p>
            </div>
            {user && (
              <Link
                to="/mystery/history"
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full glass-light border border-surface-700/50 text-xs font-semibold text-surface-200 hover:text-primary-400 hover:border-primary-500/30 transition-all"
              >
                <History className="w-4 h-4" />
                Reward history
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-3xl glass animate-pulse border border-surface-800/30" />
            ))}
          </div>
        ) : boxes.length === 0 ? (
          <div className="rounded-3xl glass p-12 text-center border border-surface-800/40">
            <Gift className="w-12 h-12 text-surface-500 mx-auto mb-3" />
            <p className="text-sm text-surface-400">Mystery boxes are restocking. Check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {boxes.map((box) => (
              <MysteryBoxCard key={box.id} box={box} onOpen={handleOpenBox} />
            ))}
          </div>
        )}
      </motion.div>

      <MysteryBoxPurchaseModal
        box={selectedBox}
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        onSuccess={handlePurchaseSuccess}
      />

      {reveal && (
        <MysteryBoxOpening
          boxTitle={reveal.box.title}
          products={reveal.reveal.products}
          totalRetailValue={reveal.reveal.total_retail_value}
          boxPrice={reveal.reveal.box_price}
          onComplete={() => {
            navigate(`/mystery/reveal/${reveal.reward.id}`)
            setReveal(null)
          }}
        />
      )}
    </>
  )
}
