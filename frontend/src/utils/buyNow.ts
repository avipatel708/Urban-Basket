import type { NavigateFunction } from "react-router"
import { toast } from "sonner"
import type { Product } from "@/services/productService"
import type { BuyNowItem } from "@/store/buyNowStore"

export interface BuyNowVariantOptions {
  lineId?: string
  title?: string
  color?: string
  size?: string
  variant_label?: string
}

export function buildBuyNowItem(
  product: Product,
  quantity = 1,
  variant?: BuyNowVariantOptions
): BuyNowItem {
  const qty = Math.max(1, Math.min(quantity, product.stock || 1))
  return {
    id: variant?.lineId || product.id,
    product_id: product.id,
    title: variant?.title || product.title,
    price: product.price,
    image_url: product.image_url || "",
    quantity: qty,
    stock: product.stock,
    color: variant?.color,
    size: variant?.size,
    variant_label: variant?.variant_label,
  }
}

/** Set Buy Now state and redirect to checkout (skips cart). */
export function handleBuyNow(
  product: Product,
  options: {
    quantity?: number
    navigate: NavigateFunction
    setBuyNow: (item: BuyNowItem) => void
    user: { id: string } | null
    variant?: BuyNowVariantOptions
  }
) {
  const { quantity = 1, navigate, setBuyNow, user, variant } = options

  if (!user) {
    toast.error("Please sign in to use Buy Now")
    navigate("/login")
    return
  }

  if (!product.stock || product.stock <= 0) {
    toast.error("This product is out of stock")
    return
  }

  setBuyNow(buildBuyNowItem(product, quantity, variant))
  toast.success("Proceeding to checkout…")
  navigate("/checkout")
}

/** Alias for handleBuyNow — direct single-product checkout. */
export const directCheckout = handleBuyNow
