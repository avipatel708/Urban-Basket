import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react"
import { useCartStore } from "@/store/cartStore"
import { useBuyNowStore } from "@/store/buyNowStore"
import { formatCurrency } from "@/lib/utils"

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalPrice,
    totalItems
  } = useCartStore()
  const clearBuyNow = useBuyNowStore((s) => s.clearBuyNow)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Slide-out Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-strong border-l border-surface-800/40 shadow-2xl z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-surface-800/40 flex justify-between items-center bg-surface-950/20">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-primary-400" />
                <h3 className="font-display font-bold text-lg text-surface-100">Your Cart</h3>
                {totalItems() > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full gradient-primary text-white">
                    {totalItems()} {totalItems() === 1 ? "item" : "items"}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 rounded-full glass-light hover:bg-surface-800/60 transition-colors text-surface-400 hover:text-primary-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-surface-500">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface-200">Your cart is empty</h4>
                    <p className="text-xs text-surface-400 mt-1 max-w-xs leading-relaxed">
                      Looks like you haven't added any products to your cart yet. Explore our latest drops to get started!
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/20 hover:scale-102 transition-all cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 p-3 rounded-xl glass-light border border-surface-800/20 hover:border-surface-700/40 transition-all relative overflow-hidden"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-surface-800/40 bg-surface-900/30 flex-shrink-0">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-sans font-medium text-sm text-surface-200 line-clamp-1 pr-6">
                          {item.title}
                        </h4>
                        {item.variant_label && (
                          <p className="text-[10px] text-surface-500 font-sans mt-0.5 capitalize">
                            {item.variant_label}
                          </p>
                        )}
                        <p className="text-xs text-primary-400 font-semibold mt-1">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 glass-light border border-surface-800/50 rounded-full px-2 py-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-surface-400 hover:text-primary-400 p-0.5 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold font-sans w-6 text-center text-surface-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-surface-400 hover:text-primary-400 p-0.5 cursor-pointer"
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 rounded-full hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-surface-800/40 bg-surface-950/40 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface-400 font-sans">Subtotal</span>
                  <span className="text-lg font-bold text-surface-100 font-sans">
                    {formatCurrency(totalPrice())}
                  </span>
                </div>
                <p className="text-[10px] text-surface-500 leading-relaxed">
                  Shipping fees and taxes will be calculated at checkout. Discount codes can be applied on the checkout page.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/checkout"
                    onClick={() => {
                      clearBuyNow()
                      closeCart()
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full gradient-primary font-semibold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:scale-[1.01] transition-all text-sm cursor-pointer"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full text-center text-xs text-surface-400 hover:text-primary-400 py-2.5 transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
