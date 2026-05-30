import { CATEGORIES } from "@/utils/constants"
import { PRODUCT_SEMANTIC_GROUPS } from "@/utils/searchSynonyms"
import { TRENDING_SEARCHES } from "@/utils/trendingSearches"

const SEMANTIC_GROUPS = PRODUCT_SEMANTIC_GROUPS as Record<string, string[]>
import type { Product } from "@/services/productService"

export interface SearchSuggestionCategory {
  id: string
  name: string
}

export interface SearchSuggestionsResult {
  phrases: string[]
  products: Product[]
  categories: SearchSuggestionCategory[]
  trending: string[]
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      let val: number
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1]!
      } else {
        val = Math.min(row[j - 1]!, row[j]!, prev) + 1
      }
      row[j - 1] = prev
      prev = val
    }
    row[b.length] = prev
  }
  return row[b.length]!
}

function fuzzyPrefix(word: string, query: string) {
  if (!query) return true
  if (word.startsWith(query)) return true
  if (query.length >= 3 && word.length >= 3) {
    if (levenshtein(word.slice(0, query.length), query) <= 1) return true
    if (levenshtein(word, query) <= 1) return true
  }
  return false
}

function collectPhrases(query: string): string[] {
  const q = normalize(query)
  if (!q) return []

  const phrases = new Set<string>()

  for (const terms of Object.values(SEMANTIC_GROUPS)) {
    for (const term of terms) {
      const t = normalize(term)
      if (!t) continue
      if (t.includes(q) || t.split(" ").some((w) => fuzzyPrefix(w, q))) {
        phrases.add(term)
      }
    }
  }

  return [...phrases]
    .sort((a, b) => {
      const an = normalize(a)
      const bn = normalize(b)
      if (an.startsWith(q) && !bn.startsWith(q)) return -1
      if (bn.startsWith(q) && !an.startsWith(q)) return 1
      return an.length - bn.length
    })
    .slice(0, 8)
}

function scoreProduct(product: Product, query: string): number {
  const q = normalize(query)
  if (!q) return (product.review_count || 0) / 10 + (product.rating || 0)

  const title = normalize(product.title)
  const desc = normalize(product.description || "")
  const cat = normalize(product.category)
  let score = 0

  if (title.startsWith(q)) score += 40
  if (title.includes(q)) score += 25
  if (cat.includes(q)) score += 12

  for (const word of `${title} ${desc}`.split(" ")) {
    if (fuzzyPrefix(word, q)) score += 15
  }

  for (const terms of Object.values(SEMANTIC_GROUPS)) {
    if (
      terms.some(
        (t: string) =>
          normalize(t).includes(q) &&
          `${title} ${desc} ${cat}`.includes(normalize(t).split(" ")[0])
      )
    ) {
      score += 18
    }
  }

  score += (product.rating || 0) * 2
  score += Math.min((product.review_count || 0) / 10, 5)
  if (product.is_featured) score += 2

  return score
}

function collectCategories(query: string, products: Product[]): SearchSuggestionCategory[] {
  const q = normalize(query)
  const hits = new Map<string, string>()

  for (const cat of CATEGORIES) {
    if (!q || cat.id.includes(q) || cat.name.toLowerCase().includes(q)) {
      hits.set(cat.id, cat.name)
    }
  }

  for (const p of products) {
    if (p.category && (!q || scoreProduct(p, query) > 10)) {
      const meta = CATEGORIES.find((c) => c.id === p.category)
      hits.set(p.category, meta?.name || p.category)
    }
  }

  return [...hits.entries()].slice(0, 4).map(([id, name]) => ({ id, name }))
}

/** Instant client-side suggestions from cached products. */
export function buildLocalSearchSuggestions(
  query: string,
  products: Product[],
  limit = 8
): SearchSuggestionsResult {
  const q = query.trim()

  if (!q) {
    return {
      phrases: [],
      products: [...products]
        .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
        .slice(0, limit),
      categories: CATEGORIES.slice(0, 4).map((c) => ({ id: c.id, name: c.name })),
      trending: [...TRENDING_SEARCHES],
    }
  }

  const phrases = collectPhrases(q)
  const ranked = products
    .map((p) => ({ product: p, score: scoreProduct(p, q) }))
    .filter((x) => x.score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.product)

  return {
    phrases,
    products: ranked,
    categories: collectCategories(q, ranked.length ? ranked : products),
    trending: [...TRENDING_SEARCHES].slice(0, 5),
  }
}
