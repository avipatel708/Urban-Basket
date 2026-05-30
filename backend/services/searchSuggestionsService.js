import { supabaseAdmin } from "../config/supabase.js"
import { PRODUCT_GROUPS } from "./productSearchService.js"

const TRENDING = [
  "wireless headphones",
  "gaming laptop",
  "smart watch",
  "noise cancelling earbuds",
  "mechanical keyboard",
  "running shoes",
  "bluetooth speaker",
  "4k monitor",
]

const CATEGORY_LABELS = {
  electronics: "Electronics",
  fashion: "Fashion",
  home: "Home & Living",
  sports: "Sports",
  beauty: "Beauty",
  books: "Books",
  toys: "Toys & Games",
  automotive: "Automotive",
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1
      row[j - 1] = prev
      prev = val
    }
    row[b.length] = prev
  }
  return row[b.length]
}

function fuzzyPrefix(word, query) {
  if (!query) return true
  if (word.startsWith(query)) return true
  if (query.length >= 3 && word.length >= 3) {
    if (levenshtein(word.slice(0, query.length), query) <= 1) return true
    if (levenshtein(word, query) <= 1) return true
  }
  return false
}

function collectPhraseSuggestions(query) {
  const q = normalize(query)
  if (!q) return []

  const phrases = new Set()

  for (const terms of Object.values(PRODUCT_GROUPS)) {
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

function scoreProduct(product, query) {
  const q = normalize(query)
  if (!q) return 0

  const title = normalize(product.title)
  const desc = normalize(product.description)
  const cat = normalize(product.category)
  let score = 0

  if (title.startsWith(q)) score += 40
  if (title.includes(q)) score += 25
  if (cat.includes(q)) score += 12

  const words = `${title} ${desc}`.split(" ")
  for (const word of words) {
    if (fuzzyPrefix(word, q)) score += 15
  }

  for (const terms of Object.values(PRODUCT_GROUPS)) {
    if (terms.some((t) => normalize(t).includes(q) && fuzzyIncludesProduct(product, t))) {
      score += 20
    }
  }

  score += (product.rating || 0) * 2
  score += Math.min((product.review_count || 0) / 10, 5)
  if (product.is_featured) score += 2

  return score
}

function fuzzyIncludesProduct(product, term) {
  const text = `${product.title} ${product.description} ${product.category}`.toLowerCase()
  return text.includes(term.toLowerCase())
}

function collectCategories(query, products) {
  const q = normalize(query)
  const hits = new Map()

  for (const [id, label] of Object.entries(CATEGORY_LABELS)) {
    if (!q || id.includes(q) || label.toLowerCase().includes(q)) {
      hits.set(id, label)
    }
  }

  for (const p of products) {
    if (p.category && scoreProduct(p, query) > 10) {
      hits.set(p.category, CATEGORY_LABELS[p.category] || p.category)
    }
  }

  return [...hits.entries()].slice(0, 4).map(([id, name]) => ({ id, name }))
}

export async function buildSearchSuggestions(query, limit = 8) {
  const q = (query || "").trim()

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, title, description, price, image_url, category, rating, review_count, is_featured")
    .gt("stock", 0)
    .limit(250)

  if (error) throw new Error(error.message)

  const list = products || []

  if (!q) {
    return {
      query: "",
      phrases: [],
      trending: TRENDING,
      categories: Object.entries(CATEGORY_LABELS)
        .slice(0, 4)
        .map(([id, name]) => ({ id, name })),
      products: list
        .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
        .slice(0, limit),
    }
  }

  const phrases = collectPhraseSuggestions(q)

  const ranked = list
    .map((p) => ({ product: p, score: scoreProduct(p, q) }))
    .filter((x) => x.score > 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.product)

  return {
    query: q,
    phrases,
    trending: TRENDING.slice(0, 5),
    categories: collectCategories(q, ranked.length ? ranked : list),
    products: ranked,
  }
}
