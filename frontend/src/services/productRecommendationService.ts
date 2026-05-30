import { apiGet } from "./api"
import type { Product } from "./productService"

export interface RecommendationMeta {
  score: number
  reasons: string[]
  matchType: "complement" | "similar"
}

export type RecommendedProduct = Product & {
  _recommendation?: RecommendationMeta
}

export interface ProductRecommendationsResponse {
  product: Product
  sectionTitle: string
  matchReasons: string[]
  detectedStyles: string[]
  detectedColors: string[]
  complements: RecommendedProduct[]
  similar: RecommendedProduct[]
  frequentlyBoughtTogether: Array<{
    id: string
    title: string
    price: number
    image_url: string | null
    category: string
    stock: number
  }>
  bundleSavings: number
}

export async function getProductRecommendations(
  productId: string,
  recentIds: string[] = []
) {
  const query =
    recentIds.length > 0 ? `?recent=${encodeURIComponent(recentIds.join(","))}` : ""
  return apiGet<ProductRecommendationsResponse>(
    `/products/${productId}/recommendations${query}`
  )
}
