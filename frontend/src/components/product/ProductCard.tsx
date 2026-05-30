import { Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { Heart, ShoppingCart, Star, Zap } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useBuyNowStore } from "@/store/buyNowStore"
import { useWishlistStore } from "@/store/wishlistStore"
import { useAuthStore } from "@/store/authStore"
import { handleBuyNow } from "@/utils/buyNow"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import type { Product } from "@/services/productService"

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const setBuyNow = useBuyNowStore((s) => s.setBuyNow)
  const { toggleItem, isInWishlist } = useWishlistStore()
  const { user } = useAuthStore()

  const isLiked = isInWishlist(product.id)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (user?.role === "seller") {
      toast.error("Seller accounts can only manage and sell products.")
      return
    }
    addItem({
      id: product.id,
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url || "",
      stock: product.stock,
    })
    toast.success(`${product.title} added to cart!`)
  }

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (user?.role === "seller") {
      toast.error("Seller accounts cannot place customer orders.")
      return
    }
    handleBuyNow(product, { quantity: 1, navigate, setBuyNow, user })
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error("Please sign in to add to wishlist")
      return
    }
    toggleItem({
      id: product.id,
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url || ""
    })
    if (isLiked) {
      toast.success("Removed from wishlist")
    } else {
      toast.success("Added to wishlist!")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.05 }}
      className="group relative rounded-2xl glass hover:scale-[1.02] active:scale-[0.99] border border-surface-800/40 hover:border-primary-500/40 transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] flex flex-col h-full"
    >
      <Link to={`/product/${product.id}`} className="flex flex-col h-full">
        {/* Product Image Panel */}
        <div className="relative aspect-square w-full bg-surface-900/35 overflow-hidden border-b border-surface-800/40">
          <img
            src={product.image_url || ""}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/60 via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Category Badge */}
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full glass-light text-primary-300 border border-primary-500/20 backdrop-blur-md">
            {product.category}
          </span>

          {/* Wishlist Heart Toggle */}
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

        {/* Product Description details */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Star Rating display */}
            <div className="flex items-center gap-1">
              <div className="flex items-center text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-[11px] font-semibold text-surface-300 font-sans mt-0.5">
                {product.rating?.toFixed(1) || "4.5"}
              </span>
              <span className="text-[10px] text-surface-500 font-sans mt-0.5">
                ({product.review_count || "0"})
              </span>
            </div>

            <h3 className="font-sans font-semibold text-sm text-surface-100 group-hover:text-primary-300 transition-colors line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-[10px] text-surface-400 font-sans">Price</p>
              <p className="text-base font-bold text-surface-100 font-sans tracking-tight">
                {formatCurrency(product.price)}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="p-2.5 rounded-xl gradient-primary text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary-500/20 hover:shadow-primary-500/35 cursor-pointer disabled:opacity-40"
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
              <button
                onClick={handleBuyNowClick}
                disabled={product.stock <= 0}
                className="px-2.5 py-2 rounded-xl glass-light border border-primary-500/30 text-[10px] font-bold font-sans text-primary-300 hover:border-primary-500/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.25)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                aria-label="Buy now"
              >
                <Zap className="w-3 h-3" />
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
