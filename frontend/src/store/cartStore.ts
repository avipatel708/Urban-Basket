import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
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

interface CartState {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

function lineKey(item: Pick<CartItem, "id" | "product_id" | "color" | "size">) {
  return item.id || `${item.product_id}::${item.color || ""}::${item.size || ""}`
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const items = get().items
        const key = lineKey(item)
        const normalized = { ...item, id: key }
        const existing = items.find((i) => lineKey(i) === key)

        if (existing) {
          set({
            items: items.map((i) =>
              lineKey(i) === key
                ? { ...i, quantity: Math.min(i.quantity + (item.quantity || 1), i.stock) }
                : i
            ),
          })
        } else {
          set({
            items: [...items, { ...normalized, quantity: item.quantity || 1 }],
          })
        }
      },

      removeItem: (lineId) =>
        set({ items: get().items.filter((i) => lineKey(i) !== lineId) }),

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId)
          return
        }
        set({
          items: get().items.map((i) =>
            lineKey(i) === lineId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "ub-cart" }
  )
)
