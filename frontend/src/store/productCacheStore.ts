import { create } from "zustand"
import { getProducts } from "@/services/productService"
import type { Product } from "@/services/productService"

const CACHE_TTL_MS = 5 * 60 * 1000

interface ProductCacheState {
  products: Product[]
  loadedAt: number | null
  loading: boolean
  error: string | null
  fetchProducts: (force?: boolean) => Promise<Product[]>
  invalidate: () => void
}

export const useProductCacheStore = create<ProductCacheState>((set, get) => ({
  products: [],
  loadedAt: null,
  loading: false,
  error: null,

  async fetchProducts(force = false) {
    const { products, loadedAt, loading } = get()
    const now = Date.now()

    if (!force && products.length > 0 && loadedAt && now - loadedAt < CACHE_TTL_MS) {
      return products
    }

    if (loading) return products

    set({ loading: true, error: null })
    try {
      const res = await getProducts({ limit: 200 })
      const data = res.data || []
      set({ products: data, loadedAt: Date.now(), loading: false })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load products"
      set({ loading: false, error: message })
      throw err
    }
  },

  invalidate() {
    set({ loadedAt: null })
  },
}))
