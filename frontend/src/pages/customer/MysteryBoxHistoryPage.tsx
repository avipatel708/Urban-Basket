import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router"
import { motion } from "motion/react"
import { ArrowLeft, Gift, ChevronRight } from "lucide-react"
import { getMyMysteryRewards, type MysteryBoxReward } from "@/services/mysteryBoxService"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function MysteryBoxHistoryPage() {
  const [rewards, setRewards] = useState<MysteryBoxReward[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyMysteryRewards()
      setRewards(Array.isArray(data) ? data : [])
    } catch {
      setRewards([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const onUpdate = () => load()
    window.addEventListener("ub-mystery-rewards-updated", onUpdate)
    return () => window.removeEventListener("ub-mystery-rewards-updated", onUpdate)
  }, [load])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      <div>
        <Link
          to="/mystery"
          className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Mystery boxes
        </Link>
        <h1 className="font-display font-bold text-2xl text-surface-50">Reward History</h1>
        <p className="text-xs text-surface-400 mt-0.5">Every box you opened and what you won.</p>
      </div>

      {loading ? (
        <p className="text-sm text-surface-400 text-center py-12 animate-pulse">Loading history…</p>
      ) : rewards.length === 0 ? (
        <div className="rounded-3xl glass p-12 text-center border border-surface-800/40 space-y-4">
          <Gift className="w-12 h-12 text-surface-500 mx-auto" />
          <p className="text-sm text-surface-400">No mystery boxes opened yet.</p>
          <Link
            to="/mystery"
            className="inline-flex py-2 px-5 gradient-primary text-white rounded-full text-xs font-semibold"
          >
            Browse boxes
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((r) => {
            const products = Array.isArray(r.products) ? r.products : []
            const title = r.mystery_boxes?.title || "Mystery Box"
            return (
              <Link
                key={r.id}
                to={`/mystery/reveal/${r.id}`}
                className="block rounded-2xl glass border border-surface-800/40 p-4 hover:border-primary-500/30 hover:bg-surface-800/10 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-surface-100">{title}</p>
                    <p className="text-[10px] text-surface-500 mt-0.5">
                      {formatDate(r.created_at)} · {products.length} item
                      {products.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] text-primary-400 font-semibold mt-1">
                      Worth {formatCurrency(r.total_retail_value)} · Paid{" "}
                      {formatCurrency(r.box_price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex -space-x-2">
                      {products.slice(0, 3).map((p) => (
                        <img
                          key={p.product_id}
                          src={p.image_url || ""}
                          alt=""
                          className="w-9 h-9 rounded-lg border-2 border-surface-900 object-cover"
                        />
                      ))}
                    </div>
                    <ChevronRight className="w-5 h-5 text-surface-500" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
