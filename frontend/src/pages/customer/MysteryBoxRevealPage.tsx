import { useState, useEffect, useCallback } from "react"
import { Link, useParams } from "react-router"
import { motion } from "motion/react"
import { ArrowLeft, Gift, Sparkles } from "lucide-react"
import { getMysteryReward, type MysteryBoxReward } from "@/services/mysteryBoxService"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function MysteryBoxRevealPage() {
  const { rewardId } = useParams<{ rewardId: string }>()
  const [reward, setReward] = useState<MysteryBoxReward | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!rewardId) return
    setLoading(true)
    try {
      const data = await getMysteryReward(rewardId)
      setReward(data)
    } catch {
      setReward(null)
    } finally {
      setLoading(false)
    }
  }, [rewardId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-surface-400 text-sm animate-pulse">
        Loading your rewards…
      </div>
    )
  }

  if (!reward) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-surface-400 text-sm">Reward not found.</p>
        <Link to="/mystery" className="text-primary-400 text-sm">
          Back to mystery boxes
        </Link>
      </div>
    )
  }

  const products = Array.isArray(reward.products) ? reward.products : []
  const boxTitle = reward.mystery_boxes?.title || "Mystery Box"
  const savings = Math.max(0, reward.total_retail_value - reward.box_price)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      <Link
        to="/mystery/history"
        className="inline-flex items-center gap-1.5 text-xs text-surface-400 hover:text-primary-400"
      >
        <ArrowLeft className="w-4 h-4" />
        Reward history
      </Link>

      <div className="rounded-3xl glass border border-primary-500/25 p-6 sm:p-8 text-center bg-gradient-to-b from-primary-950/30 to-transparent">
        <Sparkles className="w-10 h-10 text-primary-400 mx-auto mb-3" />
        <h1 className="font-display font-bold text-2xl text-surface-50">{boxTitle}</h1>
        <p className="text-xs text-surface-400 mt-1">{formatDate(reward.created_at)}</p>
        <p className="text-sm text-amber-300 font-semibold mt-3">
          You saved {formatCurrency(savings)} · Retail {formatCurrency(reward.total_retail_value)}
        </p>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.product_id}
            className="flex gap-4 p-4 rounded-2xl glass border border-surface-800/40"
          >
            <img
              src={p.image_url || ""}
              alt={p.title}
              className="w-16 h-16 rounded-xl object-cover border border-surface-700/50"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-100">{p.title}</p>
              <p className="text-xs text-primary-400 font-bold mt-1">{formatCurrency(p.price)}</p>
            </div>
          </div>
        ))}
      </div>

      {reward.order_id && (
        <Link
          to={`/orders/track/${reward.order_id}`}
          className="block text-center text-xs text-primary-400 hover:text-primary-300"
        >
          Track shipping for this order →
        </Link>
      )}

      <Link
        to="/mystery"
        className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl gradient-primary text-white text-sm font-bold"
      >
        <Gift className="w-4 h-4" />
        Open another box
      </Link>
    </motion.div>
  )
}
