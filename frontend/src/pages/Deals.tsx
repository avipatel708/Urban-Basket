import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion } from "motion/react"
import {
  Flame,
  Clock,
  Zap,
  Tag,
  ArrowRight,
  Star,
  ShoppingCart,
  Heart,
  Percent,
  Loader2,
  Gift,
} from "lucide-react"
import { DEMO_PRODUCTS } from "@/utils/demoData"
import { useCartStore } from "@/store/cartStore"
import { useWishlistStore } from "@/store/wishlistStore"
import { useAuthStore } from "@/store/authStore"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { getProducts } from "@/services/productService"
import type { Product } from "@/services/productService"

// Simulated deal data — discounts on existing products
interface DealProduct extends Product {
  originalPrice: number
  discountPercent: number
  dealEndsAt: Date
}

// Countdown hook
function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

// Countdown display component
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const { days, hours, minutes, seconds } = useCountdown(targetDate)
  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Min", value: minutes },
    { label: "Sec", value: seconds },
  ]

  return (
    <div className="flex items-center gap-2">
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center glass-light rounded-lg px-2.5 py-1.5 border border-surface-700/30 min-w-[46px]"
        >
          <span className="text-base font-bold text-surface-100 font-sans tabular-nums">
            {String(u.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-surface-500 font-sans">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// Deal card component
function DealCard({ deal, index }: { deal: DealProduct; index: number }) {
  const { addItem } = useCartStore()
  const { toggleItem, isInWishlist } = useWishlistStore()
  const { user } = useAuthStore()
  const isLiked = isInWishlist(deal.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      id: deal.id,
      product_id: deal.id,
      title: deal.title,
      price: deal.price,
      image_url: deal.image_url || "",
      stock: deal.stock,
    })
    toast.success(`${deal.title} added to cart!`)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error("Please sign in to add to wishlist")
      return
    }
    toggleItem({
      id: deal.id,
      product_id: deal.id,
      title: deal.title,
      price: deal.price,
      image_url: deal.image_url || "",
    })
    toast.success(isLiked ? "Removed from wishlist" : "Added to wishlist!")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.05 }}
      className="group relative rounded-2xl glass hover:scale-[1.02] active:scale-[0.99] border border-surface-800/40 hover:border-primary-500/40 transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] flex flex-col h-full"
    >
      <Link to={`/product/${deal.id}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-square w-full bg-surface-900/35 overflow-hidden border-b border-surface-800/40">
          <img
            src={deal.image_url || ""}
            alt={deal.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/60 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Discount Badge */}
          <span className="absolute top-3 left-3 flex items-center gap-1 text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full bg-red-500/90 text-white shadow-lg shadow-red-500/30 backdrop-blur-sm">
            <Percent className="w-3 h-3" />
            {deal.discountPercent}% OFF
          </span>

          {/* Wishlist */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
              isLiked
                ? "bg-primary-500/20 border-primary-500/40 text-primary-400 scale-105"
                : "glass-light border-surface-700/40 text-surface-400 hover:text-red-400 hover:border-red-500/30 hover:scale-105"
            }`}
            aria-label="Toggle Wishlist"
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-primary-400" : ""}`} />
          </button>
        </div>

        {/* Details */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex items-center text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-[11px] font-semibold text-surface-300 font-sans mt-0.5">
                {deal.rating?.toFixed(1) || "4.5"}
              </span>
              <span className="text-[10px] text-surface-500 font-sans mt-0.5">
                ({deal.review_count || "0"})
              </span>
            </div>

            <h3 className="font-sans font-semibold text-sm text-surface-100 group-hover:text-primary-300 transition-colors line-clamp-2 leading-snug">
              {deal.title}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-surface-100 font-sans tracking-tight">
                  {formatCurrency(deal.price)}
                </p>
                <p className="text-xs text-surface-500 font-sans line-through">
                  {formatCurrency(deal.originalPrice)}
                </p>
              </div>
              <p className="text-[10px] text-green-400 font-semibold font-sans mt-0.5">
                You save {formatCurrency(deal.originalPrice - deal.price)}
              </p>
            </div>

            <button
              onClick={handleAddToCart}
              className="p-2.5 rounded-xl gradient-primary text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/35 cursor-pointer"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Deals() {
  const [deals, setDeals] = useState<DealProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDeals() {
      try {
        const res = await getProducts({ limit: 100 })
        const productsList = res.data && res.data.length > 0 ? res.data : DEMO_PRODUCTS
        const discounts = [30, 25, 40, 20, 35, 15, 50, 45]
        const formattedDeals = productsList.map((p, i) => {
          const discount = discounts[i % discounts.length]
          const originalPrice = parseFloat((p.price / (1 - discount / 100)).toFixed(2))
          const endsAt = new Date()
          endsAt.setDate(endsAt.getDate() + ((i % 7) + 1))
          endsAt.setHours(23, 59, 59, 0)
          return {
            ...p,
            originalPrice,
            discountPercent: discount,
            dealEndsAt: endsAt,
          }
        })
        setDeals(formattedDeals)
      } catch (err) {
        console.error("Failed to load deals:", err)
        const discounts = [30, 25, 40, 20, 35, 15, 50, 45]
        const fallback = DEMO_PRODUCTS.map((p, i) => {
          const discount = discounts[i % discounts.length]
          const originalPrice = parseFloat((p.price / (1 - discount / 100)).toFixed(2))
          const endsAt = new Date()
          endsAt.setDate(endsAt.getDate() + ((i % 7) + 1))
          endsAt.setHours(23, 59, 59, 0)
          return {
            ...p,
            originalPrice,
            discountPercent: discount,
            dealEndsAt: endsAt,
          }
        })
        setDeals(fallback)
      } finally {
        setLoading(false)
      }
    }
    loadDeals()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 rounded-full text-primary-500 animate-spin" />
      </div>
    )
  }

  // Split deals into featured (top discount) and the rest
  const sortedDeals = [...deals].sort((a, b) => b.discountPercent - a.discountPercent)
  const featuredDeals = sortedDeals.slice(0, 4)
  const limitedTimeDeals = sortedDeals.slice(4)

  // Hero deal countdown — use the nearest ending deal
  const nextEndingDeal = [...deals].sort(
    (a, b) => a.dealEndsAt.getTime() - b.dealEndsAt.getTime()
  )[0] || { dealEndsAt: new Date() }

  return (
    <div className="min-h-screen gradient-bg pt-28 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden glass border border-surface-800/40 mb-14"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-500/10 to-transparent" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light border border-red-500/30 text-red-400 text-xs font-semibold font-sans mb-4">
                <Flame className="w-3.5 h-3.5" />
                HOT DEALS — LIMITED TIME
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-surface-100 mb-3">
                Up to{" "}
                <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
                  50% Off
                </span>
              </h1>
              <p className="text-surface-400 font-sans text-sm md:text-base max-w-lg">
                Incredible savings on premium products. These deals won't last long — grab them before they're gone.
              </p>

              <Link
                to="/mystery"
                className="inline-flex items-center gap-2 mt-4 py-2 px-4 rounded-full glass-light border border-primary-500/30 text-xs font-semibold text-primary-300 hover:border-primary-500/50 transition-all"
              >
                <Gift className="w-4 h-4" />
                Try Mystery Boxes — surprise loot worth more than you pay
              </Link>

              {/* Countdown */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-1.5 text-surface-400 text-xs font-sans">
                  <Clock className="w-4 h-4 text-primary-400" />
                  Next deal ends in:
                </div>
                <CountdownTimer targetDate={nextEndingDeal.dealEndsAt} />
              </div>
            </div>

            <div className="flex-shrink-0">
              <Link
                to="#featured-deals"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full gradient-primary text-sm font-sans font-semibold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4" />
                Shop Deals Now
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Featured Deals Section */}
        <section id="featured-deals" className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2 rounded-xl gradient-primary">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-surface-100">Featured Deals</h2>
              <p className="text-sm text-surface-400 font-sans">Our biggest discounts right now</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} />
            ))}
          </div>
        </section>

        {/* Limited Time Offers Section */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-surface-100">
                Limited Time Offers
              </h2>
              <p className="text-sm text-surface-400 font-sans">
                More deals you don't want to miss
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {limitedTimeDeals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center"
        >
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full glass border border-surface-700/40 text-sm font-sans font-semibold text-surface-200 hover:border-primary-500/40 hover:text-primary-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Browse All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
