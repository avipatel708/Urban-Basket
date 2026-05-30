/**
 * Instant client-side product filtering and relevance ranking.
 */

import { expandColorTerms, expandFeatureTerms } from "./searchSynonyms.js"

/** Title/description must contain at least one of these when intent is set (voice search). */
const INTENT_CORE_TERMS = {
  headphones: ["headphone", "headphones", "headset", "earbud", "earbuds", "earphone", "airpods"],
  laptop: ["laptop", "notebook", "macbook", "chromebook", "ultrabook"],
  phone: ["phone", "smartphone", "iphone", "mobile", "cellphone"],
  watch: ["watch", "smartwatch", "smart band", "fitness band"],
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "footwear", "trainer"],
  keyboard: ["keyboard"],
  mouse: ["mouse", "gaming mouse"],
  speaker: ["speaker", "soundbar", "bluetooth speaker"],
  monitor: ["monitor", "monitors", "gaming monitor", "4k monitor"],
  bag: ["backpack", "bag", "handbag"],
  lamp: ["lamp", "desk lamp", "lighting lamp"],
  sunglasses: ["sunglasses", "eyewear", "shades"],
  shirt: ["shirt", "tshirt", "t-shirt", "tee", "crop top", "crop", "hoodie", "blouse", "polo"],
  yoga: ["yoga mat", "yoga"],
  coffee: ["coffee", "pour over", "espresso", "brew"],
  camera: ["camera", "webcam"],
  skincare: ["skincare", "moisturizer", "serum"],
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function getWordVariants(word) {
  const w = normalize(word)
  if (!w) return []
  const variants = new Set([w])
  if (w.endsWith("s") && w.length > 3) variants.add(w.slice(0, -1))
  else if (!w.endsWith("s")) variants.add(`${w}s`)
  if (w.includes(" ")) variants.add(w.replace(/\s+/g, ""))
  return [...variants]
}

function fuzzyIncludes(haystack, needle) {
  const h = normalize(haystack)
  const n = normalize(needle)
  if (!n) return false
  if (h.includes(n)) return true

  const checkWord = (word) => {
    if (!word) return false
    if (word === n) return true
    for (const variant of getWordVariants(n)) {
      if (word === variant || word.includes(variant) || variant.includes(word)) return true
    }
    return false
  }

  const words = h.split(" ")
  for (const word of words) {
    if (checkWord(word)) return true
  }

  if (n.includes(" ")) return h.includes(n)
  return false
}

function matchesAnyAlias(haystack, aliases) {
  return aliases.some((alias) => fuzzyIncludes(haystack, alias))
}

function productSearchableText(product) {
  return `${product.title || ""} ${product.description || ""} ${product.category || ""}`
}

/** Word/phrase match — avoids "top" matching inside "desktop". */
function phraseMatches(haystack, phrase) {
  const h = normalize(haystack)
  const p = normalize(phrase)
  if (!p) return false
  if (p.includes(" ")) return h.includes(p)
  const re = new RegExp(`\\b${escapeRegex(p)}`, "i")
  return re.test(h)
}

function productMatchesCoreIntent(product, filters) {
  const text = normalize(productSearchableText(product))
  const title = normalize(product.title || "")

  if (filters.intent && INTENT_CORE_TERMS[filters.intent]) {
    const core = INTENT_CORE_TERMS[filters.intent]
    const matched = core.some(
      (term) => phraseMatches(text, term) || phraseMatches(title, term)
    )
    if (!matched) return false
  } else if (filters.search) {
    const tokens = filters.search
      .split(/\s+/)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length > 2)
    if (tokens.length > 0) {
      const matched = tokens.some(
        (t) => phraseMatches(text, t) || phraseMatches(title, t)
      )
      if (!matched) return false
    }
  }

  return true
}

function isStrictSmartSearch(filters) {
  return !!(
    filters.smart &&
    (filters.voice || filters.intent || (filters.search && filters.search.trim().length > 2))
  )
}

function expandIntentTerms(filters) {
  const terms = new Set()
  const strict = isStrictSmartSearch(filters)

  if (filters.intent) {
    terms.add(filters.intent.toLowerCase())
    const core = INTENT_CORE_TERMS[filters.intent] || []
    core.forEach((t) => terms.add(t.toLowerCase()))
  }

  ;(filters.keywords || []).slice(0, strict ? 6 : 12).forEach((k) => terms.add(k.toLowerCase()))

  if (filters.search) {
    filters.search.split(/\s+/).forEach((t) => {
      if (t.length > 2) terms.add(t.toLowerCase())
    })
  }

  if (!strict && filters.terms?.length) {
    filters.terms.slice(0, 16).forEach((t) => terms.add(t.toLowerCase()))
  }

  return [...terms]
}

function scoreProduct(product, filters) {
  const text = productSearchableText(product)
  const title = normalize(product.title)
  let score = 1

  const intentTerms = expandIntentTerms(filters)
  const hasIntent = intentTerms.length > 0

  if (hasIntent) {
    let intentHits = 0
    for (const term of intentTerms) {
      if (fuzzyIncludes(text, term) || fuzzyIncludes(title, term)) {
        intentHits++
        score += fuzzyIncludes(title, term) ? 24 : 14
      }
    }
    if (intentHits === 0) {
      score -= 6
    } else {
      score += intentHits * 6
    }
  }

  for (const feature of filters.features || []) {
    const aliases = expandFeatureTerms(feature)
    if (matchesAnyAlias(text, aliases)) score += 14
    else score -= 2
  }

  if (filters.color) {
    const colorAliases = expandColorTerms(filters.color)
    if (matchesAnyAlias(text, colorAliases)) score += 12
    else score -= 2
  }

  if (filters.brand) {
    if (fuzzyIncludes(text, filters.brand)) score += 16
    else score -= 3
  }

  if (filters.storage && fuzzyIncludes(text, filters.storage)) score += 8
  if (filters.ram && fuzzyIncludes(text, filters.ram)) score += 8
  if (filters.size && fuzzyIncludes(text, filters.size)) score += 6

  if (filters.category) {
    if (product.category === filters.category) score += 10
    else if (hasIntent) score -= 1
    else score -= 4
  }

  if (filters.minRating != null && (product.rating || 0) > 0) {
    if ((product.rating || 0) >= filters.minRating) score += 10
    else score -= 4
  }

  if (filters.maxPrice != null) {
    if (product.price <= filters.maxPrice) {
      score += 10
      const ratio = product.price / filters.maxPrice
      if (ratio > 0.5 && ratio <= 1) score += 5
    } else {
      const overBy = product.price - filters.maxPrice
      if (overBy <= filters.maxPrice * 0.2) score -= 3
      else if (overBy <= filters.maxPrice * 0.5) score -= 8
      else score -= 14
    }
  }

  if (filters.minPrice != null) {
    if (product.price >= filters.minPrice) score += 7
    else score -= 6
  }

  if (filters.deals) {
    if (product.is_featured) score += 6
    else score -= 1
  }

  score += (product.rating || 0) * 3
  score += Math.min((product.review_count || 0) / 5, 8)
  if (product.is_featured) score += 2

  return score
}

function sortProducts(products, sort) {
  const list = [...products]
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price)
    case "price_desc":
      return list.sort((a, b) => b.price - a.price)
    case "rating":
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case "popular":
      return list.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    case "relevance":
      return list
    case "newest":
    default:
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
  }
}

/**
 * Build filter object from URL search params.
 * @param {URLSearchParams} searchParams
 */
export function filtersFromSearchParams(searchParams) {
  const search = searchParams.get("search") || ""
  const keywords = searchParams.get("keywords")
    ? searchParams.get("keywords").split(",").map((k) => k.trim()).filter(Boolean)
    : []
  const terms = searchParams.get("terms")
    ? searchParams.get("terms").split(",").map((t) => t.trim()).filter(Boolean)
    : []

  return {
    search: search.trim(),
    keywords,
    terms,
    intent: searchParams.get("intent") || null,
    category: searchParams.get("category") || null,
    minPrice: searchParams.get("minPrice") != null ? parseFloat(searchParams.get("minPrice")) : null,
    maxPrice: searchParams.get("maxPrice") != null ? parseFloat(searchParams.get("maxPrice")) : null,
    minRating: searchParams.get("minRating") != null ? parseFloat(searchParams.get("minRating")) : null,
    color: searchParams.get("color") || null,
    brand: searchParams.get("brand") || null,
    features: searchParams.get("features")
      ? searchParams.get("features").split(",").map((f) => f.trim()).filter(Boolean)
      : [],
    storage: searchParams.get("storage") || null,
    ram: searchParams.get("ram") || null,
    size: searchParams.get("size") || null,
    deals: searchParams.get("deals") === "true",
    sort: searchParams.get("sort") || "relevance",
    smart: searchParams.get("smart") === "true",
    voice: searchParams.get("voice") === "1",
    voiceQuery: searchParams.get("voiceQuery") || null,
  }
}

export function isSmartSearchParams(searchParams) {
  if (searchParams.get("smart") === "true") return true
  return !!(
    searchParams.get("intent") ||
    searchParams.get("terms") ||
    searchParams.get("keywords") ||
    searchParams.get("color") ||
    searchParams.get("brand") ||
    searchParams.get("features") ||
    searchParams.get("storage") ||
    searchParams.get("ram") ||
    searchParams.get("size")
  )
}

/**
 * Filter and rank products on the client (instant).
 * @param {Array} products
 * @param {Object} filters
 */
export function filterAndRankProducts(products, filters) {
  if (!filters.smart) {
    let list = [...products]
    if (filters.category && filters.category !== "all") {
      list = list.filter((p) => p.category === filters.category)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter((p) => productSearchableText(p).includes(q))
    }
    if (filters.maxPrice != null) list = list.filter((p) => p.price <= filters.maxPrice)
    if (filters.minPrice != null) list = list.filter((p) => p.price >= filters.minPrice)
    if (filters.minRating != null) {
      list = list.filter((p) => (p.rating || 0) >= filters.minRating)
    }
    if (filters.deals) list = list.filter((p) => p.is_featured)
    return sortProducts(list, filters.sort || "newest")
  }

  const strict = isStrictSmartSearch(filters)
  const minScore = strict ? 10 : 0

  let scored = products
    .map((p) => ({ product: p, score: scoreProduct(p, filters) }))
    .filter(({ product, score }) => {
      if (strict && !productMatchesCoreIntent(product, filters)) return false
      return score >= minScore
    })
    .sort((a, b) => b.score - a.score)

  if (scored.length > 1 && strict) {
    const topScore = scored[0].score
    const cutoff = Math.max(14, topScore * 0.5)
    scored = scored.filter((item) => item.score >= cutoff)
  }

  if (scored.length === 0) {
    const relaxed = {
      ...filters,
      category: null,
      maxPrice: null,
      minPrice: null,
      minRating: null,
    }
    scored = products
      .map((p) => ({ product: p, score: scoreProduct(p, relaxed) }))
      .filter(({ product, score }) => {
        if (strict && !productMatchesCoreIntent(product, filters)) return false
        return score >= (strict ? 8 : 1)
      })
      .sort((a, b) => b.score - a.score)

    if (strict && scored.length > 1) {
      const topScore = scored[0].score
      const cutoff = Math.max(10, topScore * 0.45)
      scored = scored.filter((item) => item.score >= cutoff)
    }
  }

  if (strict && scored.length > 30) {
    scored = scored.slice(0, 30)
  }

  if (filters.sort === "relevance") {
    return scored.map((s) => s.product)
  }

  return sortProducts(
    scored.map((s) => s.product),
    filters.sort
  )
}
