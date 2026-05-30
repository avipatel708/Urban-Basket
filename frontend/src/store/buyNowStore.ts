import { create } from "zustand"

export interface BuyNowItem {
  id: string
  product_id: string
  title: string
  price: number
  image_url: string
  quantity: number
  stock: number
  color?: string
  size?: string
  variant_label?: string
}

interface BuyNowState {
  item: BuyNowItem | null
  isActive: boolean
  setBuyNow: (item: BuyNowItem) => void
  updateQuantity: (quantity: number) => void
  clearBuyNow: () => void
  totalPrice: () => number
}

export const useBuyNowStore = create<BuyNowState>((set, get) => ({
  item: null,
  isActive: false,

  setBuyNow: (item) => set({ item, isActive: true }),

  updateQuantity: (quantity) => {
    const { item } = get()
    if (!item) return
    if (quantity <= 0) {
      set({ item: null, isActive: false })
      return
    }
    set({
      item: { ...item, quantity: Math.min(quantity, item.stock) },
    })
  },

  clearBuyNow: () => set({ item: null, isActive: false }),

  totalPrice: () => {
    const { item } = get()
    if (!item) return 0
    return item.price * item.quantity
  },
}))
