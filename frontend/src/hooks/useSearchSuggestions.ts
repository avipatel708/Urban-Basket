import { useState, useEffect, useRef } from "react"
import { useProductCacheStore } from "@/store/productCacheStore"
import { buildLocalSearchSuggestions } from "@/utils/searchSuggestionsEngine"
import { fetchSearchSuggestions } from "@/services/searchSuggestionsService"
import type { SearchSuggestionsResult } from "@/utils/searchSuggestionsEngine"

const EMPTY: SearchSuggestionsResult = {
  phrases: [],
  products: [],
  categories: [],
  trending: [],
}

export function useSearchSuggestions(query: string, enabled: boolean) {
  const products = useProductCacheStore((s) => s.products)
  const [result, setResult] = useState<SearchSuggestionsResult>(EMPTY)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const id = ++requestId.current
    const q = query.trim()

    const local = buildLocalSearchSuggestions(q, products, 8)
    setResult(local)
    setLoading(false)

    const timer = window.setTimeout(async () => {
      try {
        const remote = await fetchSearchSuggestions(q, 8)
        if (requestId.current !== id) return

        if (remote.products?.length || remote.phrases?.length) {
          setResult({
            phrases: remote.phrases || local.phrases,
            products: remote.products?.length ? remote.products : local.products,
            categories: remote.categories?.length ? remote.categories : local.categories,
            trending: remote.trending?.length ? remote.trending : local.trending,
          })
        }
      } catch {
        /* keep local — instant fallback */
      } finally {
        if (requestId.current === id) setLoading(false)
      }
    }, q ? 120 : 0)

    return () => window.clearTimeout(timer)
  }, [query, enabled, products])

  return { ...result, loading }
}
