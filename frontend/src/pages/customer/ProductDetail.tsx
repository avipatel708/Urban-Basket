import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { ShoppingCart, Heart, Shield, Truck, RefreshCw, ChevronRight, Zap } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useBuyNowStore } from "@/store/buyNowStore"
import { handleBuyNow } from "@/utils/buyNow"
import { useWishlistStore } from "@/store/wishlistStore"
import { useAuthStore } from "@/store/authStore"
import { ProductMatchRecommendations } from "@/components/product/ProductMatchRecommendations"
import { ProductReviews, ReviewSummary } from "@/components/reviews/ProductReviews"
import {
  ProductPriceDisplay,
  ProductVariantPicker,
} from "@/components/product/ProductVariantPicker"
import { useProductVariants } from "@/hooks/useProductVariants"
import { getProduct, type Product } from "@/services/productService"
import { trackRecentlyViewed } from "@/utils/recentlyViewed"
import { ColorTintedImage, resolveColorHex } from "@/utils/colorSwatches"
import { toast } from "sonner"

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCartStore()
  const setBuyNow = useBuyNowStore((s) => s.setBuyNow)
  const { toggleItem, isInWishlist } = useWishlistStore()
  const { user } = useAuthStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  const variants = useProductVariants(product)

  useEffect(() => {
    async function loadProduct() {
      if (!id) return
      setLoading(true)
      try {
        const found = await getProduct(id)
        if (found) {
          setProduct(found)
          setQuantity(1)
          trackRecentlyViewed(found.id)
        } else {
          setProduct(null)
        }
      } catch (err: unknown) {
        console.error("Error loading product detail:", err)
        toast.error("Failed to load product detail from database.")
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  useEffect(() => {
    setQuantity(1)
  }, [variants.selectedColorId, variants.selectedSize, product?.id])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="font-display font-bold text-2xl text-surface-200">Product Not Found</h2>
        <p className="text-sm text-surface-400 font-sans">The requested product could not be located in our catalogue.</p>
        <Link to="/products" className="inline-flex py-2 px-5 gradient-primary text-white rounded-full font-sans text-xs font-semibold">
          Back to catalogue
        </Link>
      </div>
    )
  }

  const isLiked = isInWishlist(product.id)
  const hasVariants = variants.hasColors || variants.hasSizes
  const activeStock = variants.displayStock
  const activePrice = variants.displayPrice
  const activeImage = variants.displayImage || product.image_url || ""
  const selectedColorHex = variants.selected?.color
    ? resolveColorHex(variants.selected.color)
    : undefined

  const buildCartPayload = () => {
    const variantLabel = variants.selected?.label
    const titleSuffix = variantLabel ? ` (${variantLabel})` : ""
    return {
      id: variants.selected?.lineId || product.id,
      product_id: product.id,
      title: `${product.title}${titleSuffix}`,
      price: activePrice,
      image_url: activeImage,
      stock: activeStock,
      quantity,
      color: variants.selected?.color?.name,
      size: variants.selected?.size,
      variant_label: variantLabel || undefined,
    }
  }

  const handleAddToCart = () => {
    if (user?.role === "seller") {
      toast.error("Seller accounts can only manage and sell products.")
      return
    }
    if (hasVariants && !variants.selectionComplete) {
      toast.error(variants.hasSizes ? "Please select a size" : "Please select an option")
      return
    }
    addItem(buildCartPayload())
    toast.success(`Added ${quantity} item${quantity > 1 ? "s" : ""} to cart!`)
  }

  const handleBuyNowClick = () => {
    if (user?.role === "seller") {
      toast.error("Seller accounts cannot place customer orders.")
      return
    }
    if (hasVariants && !variants.selectionComplete) {
      toast.error(variants.hasSizes ? "Please select a size" : "Please select an option")
      return
    }
    const payload = buildCartPayload()
    handleBuyNow(
      { ...product, price: payload.price, stock: payload.stock, image_url: payload.image_url },
      {
        quantity,
        navigate,
        setBuyNow,
        user,
        variant: {
          lineId: payload.id,
          title: payload.title,
          color: payload.color,
          size: payload.size,
          variant_label: payload.variant_label,
        },
      }
    )
  }

  const handleWishlistToggle = () => {
    if (!user) {
      toast.error("Please sign in to add to wishlist")
      return
    }
    toggleItem({
      id: product.id,
      product_id: product.id,
      title: product.title,
      price: activePrice,
      image_url: activeImage,
    })
    if (isLiked) {
      toast.success("Removed from wishlist")
    } else {
      toast.success("Added to wishlist!")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
    >
      <nav className="flex items-center gap-2 text-xs text-surface-400 font-sans">
        <Link to="/" className="hover:text-primary-400">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-primary-400">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${product.category}`} className="capitalize hover:text-primary-400">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-surface-300 truncate max-w-[200px]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-6 rounded-2xl overflow-hidden glass border border-surface-800/40 aspect-square relative shadow-2xl">
          {variants.hasColors && selectedColorHex ? (
            <ColorTintedImage
              src={activeImage}
              alt={product.title}
              colorHex={selectedColorHex}
              className="w-full h-full"
              tintOpacity={0.45}
            />
          ) : (
            <img src={activeImage} alt={product.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/40 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full gradient-primary text-white">
              {product.category}
            </span>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50 leading-tight">
              {product.title}
              {variants.selected?.color ? ` — ${variants.selected.color.name}` : ""}
            </h1>

            <ReviewSummary rating={product.rating || 0} count={product.review_count || 0} />
          </div>

          <ProductPriceDisplay
            price={activePrice}
            mrp={variants.displayMrp}
            stock={activeStock}
          />

          {hasVariants && (
            <ProductVariantPicker
              hasColors={variants.hasColors}
              hasSizes={variants.hasSizes}
              colorDisplay={variants.colorDisplay}
              colors={variants.colors}
              sizes={variants.sizes}
              selectedColorId={variants.selectedColorId}
              selectedSize={variants.selectedSize}
              onColorChange={variants.setSelectedColorId}
              onSizeChange={variants.setSelectedSize}
              showSizeChart={variants.showSizeChart}
            />
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wide">Product Description</h4>
            <p className="text-sm text-surface-450 leading-relaxed font-sans">{product.description}</p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wide">Quantity</label>
                <div className="flex items-center gap-2 glass-light border border-surface-800/50 rounded-xl px-4 py-2 w-max">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-surface-400 hover:text-primary-400 px-2 cursor-pointer font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-semibold font-sans w-8 text-center text-surface-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(activeStock, quantity + 1))}
                    className="text-surface-400 hover:text-primary-400 px-2 cursor-pointer font-bold"
                    disabled={quantity >= activeStock}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={activeStock <= 0 || (hasVariants && !variants.selectionComplete)}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full gradient-primary font-semibold text-white shadow-xl shadow-primary-500/20 hover:scale-[1.01] transition-all text-sm disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNowClick}
                disabled={activeStock <= 0 || (hasVariants && !variants.selectionComplete)}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full glass border border-primary-500/40 font-semibold text-primary-300 shadow-lg shadow-primary-500/10 hover:border-primary-500/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:scale-[1.01] transition-all text-sm disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-3.5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isLiked
                    ? "bg-primary-500/20 border-primary-500/40 text-primary-400"
                    : "glass border-surface-700/60 text-surface-200 hover:border-red-500/30 hover:text-red-400"
                }`}
                aria-label="Toggle Wishlist"
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-primary-400" : ""}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-surface-800/30 text-center">
            <div className="flex flex-col items-center space-y-1.5 p-3 rounded-xl glass-light">
              <Truck className="w-4.5 h-4.5 text-primary-400" />
              <span className="text-[10px] font-semibold text-surface-200 font-sans">Fast Delivery</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5 p-3 rounded-xl glass-light">
              <Shield className="w-4.5 h-4.5 text-primary-400" />
              <span className="text-[10px] font-semibold text-surface-200 font-sans">Trusted Warranty</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5 p-3 rounded-xl glass-light">
              <RefreshCw className="w-4.5 h-4.5 text-primary-400" />
              <span className="text-[10px] font-semibold text-surface-200 font-sans">Easy Swap</span>
            </div>
          </div>
        </div>
      </div>

      <ProductMatchRecommendations productId={product.id} />

      <section className="space-y-6 pt-10 border-t border-surface-800/30">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-xl text-surface-100">Customer Reviews</h2>
          <p className="text-xs text-surface-400 font-sans">
            Real ratings with comments and photo reviews from delivered orders.
          </p>
        </div>
        <ProductReviews productId={product.id} />
      </section>
    </motion.div>
  )
}
