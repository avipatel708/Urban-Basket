import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WishlistItem {
  id: string
  product_id: string
  title: string
  price: number
  image_url: string
}

interface WishlistState {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  toggleItem: (item: WishlistItem) => void
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (!get().isInWishlist(item.product_id)) {
          set({ items: [...get().items, item] })
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.product_id !== productId) }),

      isInWishlist: (productId) =>
        get().items.some((i) => i.product_id === productId),

      toggleItem: (item) => {
        if (get().isInWishlist(item.product_id)) {
          get().removeItem(item.product_id)
        } else {
          get().addItem(item)
        }
      },

      clearWishlist: () => set({ items: [] }),
    }),
    { name: "ub-wishlist" }
  )
)
