import { useEffect, useState } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { Plus, ShoppingCart, Sparkles, Wand2 } from "lucide-react"
import { ProductCard } from "@/components/product/ProductCard"
import {
  getProductRecommendations,
  type ProductRecommendationsResponse,
  type RecommendedProduct,
} from "@/services/productRecommendationService"
import { getRecentlyViewed } from "@/utils/recentlyViewed"
import { useCartStore } from "@/store/cartStore"
import { useAuthStore } from "@/store/authStore"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/services/productService"
import { toast } from "sonner"

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80"

interface ProductMatchRecommendationsProps {
  productId: string
}

function stripRecommendationMeta(product: RecommendedProduct): Product {
  const { _recommendation, ...rest } = product
  return rest
}

export function ProductMatchRecommendations({ productId }: ProductMatchRecommendationsProps) {
  const [data, setData] = useState<ProductRecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const { addItem } = useCartStore()
  const { user } = useAuthStore()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const recentIds = getRecentlyViewed(productId)
        const res = await getProductRecommendations(productId, recentIds)
        if (!cancelled) setData(res)
      } catch {
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [productId])

  if (loading) {
    return (
      <section className="space-y-6 pt-10 border-t border-surface-800/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />
          <p className="text-xs text-surface-400 font-sans animate-pulse">
            AI is finding matching products…
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl skeleton" />
          ))}
        </div>
      </section>
    )
  }

  if (!data) return null

  const matchItems = data.complements.length > 0 ? data.complements : data.similar
  const showAlsoLike =
    data.similar.length > 0 &&
    data.complements.length > 0 &&
    data.similar.some((s) => !data.complements.find((c) => c.id === s.id))

  if (matchItems.length === 0 && data.frequentlyBoughtTogether.length <= 1) return null

  const handleAddBundle = () => {
    if (user?.role === "seller") {
      toast.error("Seller accounts can only manage and sell products.")
      return
    }
    for (const item of data.frequentlyBoughtTogether) {
      if (item.stock <= 0) continue
      addItem({
        id: item.id,
        product_id: item.id,
        title: item.title,
        price: item.price,
        image_url: item.image_url || "",
        stock: item.stock,
        quantity: 1,
      })
    }
    toast.success("Bundle added to cart!")
  }

  return (
    <section className="space-y-10 pt-10 border-t border-surface-800/30">
      {data.frequentlyBoughtTogether.length > 1 && (
        <FrequentlyBoughtTogether
          items={data.frequentlyBoughtTogether}
          savings={data.bundleSavings}
          onAddBundle={handleAddBundle}
        />
      )}

      {matchItems.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary-400" />
              <h2 className="font-display font-bold text-xl text-surface-100">
                {data.sectionTitle}
              </h2>
            </div>
            <p className="text-xs text-surface-400 font-sans">
              AI-matched complementary picks based on category, style, and compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {matchItems.slice(0, 4).map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="relative"
                >
                  {p._recommendation?.reasons?.length ? (
                    <div className="absolute top-3 left-3 z-20 max-w-[85%]">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full glass border border-primary-500/30 text-primary-300">
                        <Sparkles className="w-2.5 h-2.5" />
                        {p._recommendation.reasons[0]}
                      </span>
                    </div>
                  ) : null}
                  <ProductCard product={stripRecommendationMeta(p)} index={idx} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {showAlsoLike && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl text-surface-100">You May Also Like</h2>
            <p className="text-xs text-surface-400 font-sans">
              Similar items customers explored alongside this product.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.similar.slice(0, 4).map((p, idx) => (
              <ProductCard key={p.id} product={stripRecommendationMeta(p)} index={idx} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function FrequentlyBoughtTogether({
  items,
  savings,
  onAddBundle,
}: {
  items: ProductRecommendationsResponse["frequentlyBoughtTogether"]
  savings: number
  onAddBundle: () => void
}) {
  const total = items.reduce((s, i) => s + i.price, 0)
  const inStock = items.every((i) => i.stock > 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass border border-surface-800/40 p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-lg text-surface-100">
            Frequently Bought Together
          </h2>
          <p className="text-xs text-surface-400 font-sans">
            Smart bundle — add the full combo in one tap.
          </p>
        </div>
        {savings > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-green-400">
            Save ~₹{savings}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-3 sm:gap-4">
            <Link
              to={`/product/${item.id}`}
              className="group flex flex-col items-center gap-2 w-24 sm:w-28"
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-surface-800/50 bg-surface-900/40 group-hover:border-primary-500/40 transition-colors">
                <img
                  src={item.image_url || PLACEHOLDER}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] text-surface-300 text-center line-clamp-2 leading-snug">
                {item.title}
              </p>
              <p className="text-[11px] font-semibold text-primary-400">
                {formatCurrency(item.price)}
              </p>
            </Link>
            {idx < items.length - 1 && (
              <Plus className="w-4 h-4 text-surface-500 flex-shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-surface-800/30">
        <div className="text-center sm:text-left">
          <p className="text-[10px] uppercase tracking-wide text-surface-500">Bundle total</p>
          <p className="text-lg font-bold text-surface-50">{formatCurrency(total)}</p>
        </div>
        <button
          type="button"
          onClick={onAddBundle}
          disabled={!inStock}
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full gradient-primary font-semibold text-white text-sm shadow-lg shadow-primary-500/20 hover:scale-[1.01] transition-all disabled:opacity-45 disabled:scale-100 cursor-pointer w-full sm:w-auto"
        >
          <ShoppingCart className="w-4 h-4" />
          Add all to cart
        </button>
      </div>
    </motion.div>
  )
}
