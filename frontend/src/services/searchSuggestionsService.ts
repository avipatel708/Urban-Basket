import { apiGet } from "./api"
import type { Product } from "./productService"

export interface SearchSuggestionsResponse {
  query: string
  phrases: string[]
  trending: string[]
  categories: { id: string; name: string }[]
  products: Product[]
}

export async function fetchSearchSuggestions(query: string, limit = 8) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  params.set("limit", String(limit))
  return apiGet<SearchSuggestionsResponse>(`/products/search/suggestions?${params.toString()}`)
}
