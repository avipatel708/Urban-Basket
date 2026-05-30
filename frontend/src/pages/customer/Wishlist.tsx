import { Link } from "react-router"
import { motion } from "motion/react"
import { Heart, Trash2, ShoppingCart } from "lucide-react"
import { useWishlistStore } from "@/store/wishlistStore"
import { useCartStore } from "@/store/cartStore"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore()
  const { addItem } = useCartStore()

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.product_id,
      product_id: item.product_id,
      title: item.title,
      price: item.price,
      image_url: item.image_url,
      stock: 10 // Mock stock limit
    })
    toast.success("Added to cart!")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
    >
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-surface-50">My Wishlist</h1>
        <p className="text-xs text-surface-400 font-sans mt-0.5">Your curated list of desired futuristic products.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl glass p-12 text-center space-y-4 border border-surface-800/40 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full glass flex items-center justify-center mx-auto text-surface-500">
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-surface-200">Your wishlist is empty</h3>
            <p className="text-xs text-surface-400 mt-1 leading-relaxed">
              Explore our catalogs and click the heart icon on any product to save it here for later.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex py-2.5 px-6 gradient-primary text-white rounded-full font-sans text-xs font-semibold"
          >
            Find Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.product_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl glass overflow-hidden border border-surface-800/40 flex flex-col justify-between h-full hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all group"
            >
              {/* Product Image */}
              <div className="aspect-square bg-surface-900/35 relative overflow-hidden border-b border-surface-800/40">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <button
                  onClick={() => {
                    removeItem(item.product_id)
                    toast.success("Removed from wishlist")
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full glass-light border border-surface-700/40 text-surface-400 hover:text-red-400 hover:border-red-500/25 transition-all cursor-pointer"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-sans font-semibold text-sm text-surface-200 line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-sm font-bold text-primary-400 font-sans mt-1">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl gradient-primary text-xs font-semibold text-white shadow-md shadow-primary-500/15 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
