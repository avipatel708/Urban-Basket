import { apiGet, apiPost, apiPut, apiDelete } from "./api"

export interface ProductColorOption {
  id: string
  name: string
  image_url: string
  price: number
  mrp?: number
  stock: number
  hex?: string
}

export interface ProductVariantConfig {
  has_sizes: boolean
  sizes?: string[]
  size_chart?: boolean
  color_display?: "grid" | "strip"
  colors?: ProductColorOption[]
}

export interface Product {
  id: string
  title: string
  description: string | null
  price: number
  image_url: string | null
  stock: number
  seller_id: string
  category: string
  rating: number
  review_count: number
  is_featured: boolean
  created_at: string
  variants?: ProductVariantConfig | null
}

export async function getProducts(params?: {
  category?: string
  search?: string
  sort?: string
  limit?: number
  offset?: number
  sellerId?: string
  featured?: boolean
  smart?: boolean
  minPrice?: number
  maxPrice?: number
  minRating?: number
  color?: string
  brand?: string
  features?: string
  storage?: string
  ram?: string
  size?: string
  deals?: boolean
  intent?: string
  terms?: string
  keywords?: string
}) {
  const queryParts: string[] = []
  if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`)
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`)
  if (params?.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`)
  if (params?.limit) queryParts.push(`limit=${params.limit}`)
  if (params?.offset) queryParts.push(`offset=${params.offset}`)
  if (params?.sellerId) queryParts.push(`sellerId=${params.sellerId}`)
  if (params?.featured) queryParts.push(`featured=${params.featured}`)
  if (params?.smart) queryParts.push(`smart=true`)
  if (params?.minPrice != null) queryParts.push(`minPrice=${params.minPrice}`)
  if (params?.maxPrice != null) queryParts.push(`maxPrice=${params.maxPrice}`)
  if (params?.minRating != null) queryParts.push(`minRating=${params.minRating}`)
  if (params?.color) queryParts.push(`color=${encodeURIComponent(params.color)}`)
  if (params?.brand) queryParts.push(`brand=${encodeURIComponent(params.brand)}`)
  if (params?.features) queryParts.push(`features=${encodeURIComponent(params.features)}`)
  if (params?.storage) queryParts.push(`storage=${encodeURIComponent(params.storage)}`)
  if (params?.ram) queryParts.push(`ram=${encodeURIComponent(params.ram)}`)
  if (params?.size) queryParts.push(`size=${encodeURIComponent(params.size)}`)
  if (params?.deals) queryParts.push(`deals=true`)
  if (params?.intent) queryParts.push(`intent=${encodeURIComponent(params.intent)}`)
  if (params?.terms) queryParts.push(`terms=${encodeURIComponent(params.terms)}`)
  if (params?.keywords) queryParts.push(`keywords=${encodeURIComponent(params.keywords)}`)

  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : ""
  
  return apiGet<{ data: Product[]; count: number | null }>(`/products${queryString}`)
}

export async function getProduct(id: string) {
  return apiGet<Product & { profiles: { name: string; avatar_url: string | null } }>(`/products/${id}`)
}

export async function createProduct(product: Omit<Product, "id" | "created_at" | "rating" | "review_count">) {
  return apiPost<Product>(`/products`, product)
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  return apiPut<Product>(`/products/${id}`, updates)
}

export async function deleteProduct(id: string) {
  return apiDelete<{ message: string }>(`/products/${id}`)
}

export async function getSellerStats(sellerId: string) {
  // GET /stats/seller (ignores parameter since backend uses req.user.id securely)
  return apiGet<{ totalRevenue: number; totalOrders: number; totalProducts: number; lowStock: number }>("/stats/seller")
}
