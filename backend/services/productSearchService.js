/**
 * AI-powered product search: weighted relevance, synonyms, fuzzy match, soft filters.
 */

export const PRODUCT_GROUPS = {
  headphones: [
    "headphone", "headphones", "headset", "headsets", "earbud", "earbuds",
    "earphone", "earphones", "earpods", "airpods", "anc", "noise cancelling",
    "noise canceling", "noise-cancelling", "noise-canceling",
  ],
  laptop: ["laptop", "laptops", "notebook", "notebooks", "macbook", "gaming laptop"],
  phone: ["phone", "phones", "smartphone", "smartphones", "iphone", "mobile", "cellphone"],
  watch: ["watch", "watches", "smartwatch", "smartwatches", "fitness watch", "fitness band"],
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "footwear", "running shoes", "trainers"],
  keyboard: ["keyboard", "keyboards", "mechanical keyboard", "gaming keyboard"],
  mouse: ["mouse", "mice", "gaming mouse", "wireless mouse"],
  speaker: ["speaker", "speakers", "soundbar", "bluetooth speaker", "echo"],
  monitor: ["monitor", "monitors", "display", "screen", "4k"],
  bag: ["bag", "bags", "backpack", "backpacks"],
  lamp: ["lamp", "lamps", "light", "lighting", "desk lamp", "led"],
  sunglasses: ["sunglasses", "shades", "polarized"],
  shirt: ["shirt", "tshirt", "t-shirt", "tee", "top", "crop top"],
  yoga: ["yoga", "mat", "yoga mat"],
  coffee: ["coffee", "pour over", "brew", "ceramic"],
}

const FEATURE_ALIASES = {
  wireless: ["wireless", "bluetooth", "bt", "cordless", "true wireless", "tws"],
  "noise cancellation": [
    "noise cancellation", "noise cancelling", "noise canceling",
    "noise-cancelling", "noise-canceling", "anc", "active noise",
  ],
  gaming: ["gaming", "gamer", "esports", "game", "rgb", "mechanical"],
  waterproof: ["waterproof", "water resistant", "water-resistant", "ipx7", "ipx8"],
  rgb: ["rgb", "led", "per-key", "backlit", "illuminated"],
  rtx: ["rtx", "ray tracing", "ray-tracing", "geforce", "graphics", "dedicated"],
  premium: ["premium", "luxury", "high-end", "flagship", "pro", "ultra", "designer"],
  fitness: ["fitness", "health", "workout", "gym", "sport", "running"],
  stylish: ["stylish", "designer", "fashion", "trendy", "aurora"],
  smart: ["smart", "intelligent", "connected", "hub"],
  organic: ["organic", "natural", "botanical", "cruelty-free", "luxe"],
  polarized: ["polarized", "uv400", "uv protection", "horizon"],
  mechanical: ["mechanical", "hot-swappable", "gasket", "titan"],
  portable: ["portable", "compact", "travel"],
  "4k": ["4k", "uhd", "ultra hd", "retina"],
}

const COLOR_ALIASES = {
  black: ["black", "obsidian", "dark", "midnight", "charcoal"],
  white: ["white", "pearl", "ivory"],
  red: ["red", "crimson"],
  blue: ["blue", "navy", "azure", "nebula"],
  green: ["green", "olive"],
  silver: ["silver", "chrome", "titanium", "metallic"],
  gold: ["gold", "golden"],
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

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function fuzzyIncludes(haystack, needle) {
  const h = normalize(haystack)
  const n = normalize(needle)
  if (!n) return false

  const checkWord = (word) => {
    if (!word) return false
    if (word === n) return true
    for (const variant of getWordVariants(n)) {
      if (word === variant) return true
    }
    return false
  }

  const words = h.split(" ")
  for (const word of words) {
    if (checkWord(word)) return true
  }

  if (n.includes(" ")) {
    return h.includes(n)
  }

  return false
}

function matchesAnyAlias(haystack, aliases) {
  return aliases.some((alias) => fuzzyIncludes(haystack, alias))
}

function productSearchableText(product) {
  return `${product.title || ""} ${product.description || ""} ${product.category || ""}`
}

function expandIntentTerms(filters) {
  const terms = new Set()

  if (filters.intent && PRODUCT_GROUPS[filters.intent]) {
    PRODUCT_GROUPS[filters.intent].forEach((t) => terms.add(t))
  }

  if (filters.terms?.length) {
    filters.terms.forEach((t) => terms.add(t.toLowerCase()))
  }

  ;(filters.keywords || []).forEach((k) => terms.add(k.toLowerCase()))

  if (filters.search) {
    filters.search.split(/\s+/).forEach((t) => {
      if (t.length > 1) terms.add(t.toLowerCase())
    })
  }

  return [...terms]
}

/**
 * Weighted relevance score — never requires ALL terms; uses soft matching.
 */
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
        score += fuzzyIncludes(title, term) ? 22 : 12
      }
    }
    if (intentHits === 0) {
      return -1
    }
    score += intentHits * 5
  }

  for (const feature of filters.features || []) {
    const aliases = FEATURE_ALIASES[feature] || [feature]
    if (matchesAnyAlias(text, aliases)) score += 12
    else score -= 3
  }

  if (filters.color) {
    const colorAliases = COLOR_ALIASES[filters.color] || [filters.color]
    if (matchesAnyAlias(text, colorAliases)) score += 10
    else score -= 2
  }

  if (filters.brand) {
    if (fuzzyIncludes(text, filters.brand)) score += 14
    else score -= 4
  }

  if (filters.storage && fuzzyIncludes(text, filters.storage)) score += 8
  if (filters.ram && fuzzyIncludes(text, filters.ram)) score += 8
  if (filters.size && fuzzyIncludes(text, filters.size)) score += 5

  if (filters.category) {
    if (product.category === filters.category) score += 8
    else if (hasIntent) score -= 1
    else score -= 3
  }

  if (filters.minRating != null && (product.rating || 0) > 0) {
    if ((product.rating || 0) >= filters.minRating) score += 10
    else score -= 5
  }

  if (filters.maxPrice != null) {
    if (product.price <= filters.maxPrice) {
      score += 8
      const ratio = product.price / filters.maxPrice
      if (ratio > 0.5 && ratio <= 1) score += 4
    } else {
      const overBy = product.price - filters.maxPrice
      if (overBy <= filters.maxPrice * 0.25) score -= 4
      else if (overBy <= filters.maxPrice * 0.5) score -= 10
      else score -= 18
    }
  }

  if (filters.minPrice != null) {
    if (product.price >= filters.minPrice) score += 6
    else score -= 8
  }

  if (filters.deals) {
    if (product.is_featured) score += 6
    else score -= 2
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

export function parseSearchFilters(query) {
  const search = (query.search || query.q || "").trim()
  const keywords = query.keywords
    ? query.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : []
  const terms = query.terms
    ? query.terms.split(",").map((t) => t.trim()).filter(Boolean)
    : []

  return {
    search,
    keywords,
    terms,
    intent: query.intent || null,
    category: query.category || null,
    minPrice: query.minPrice != null ? parseFloat(query.minPrice) : null,
    maxPrice: query.maxPrice != null ? parseFloat(query.maxPrice) : null,
    minRating: query.minRating != null ? parseFloat(query.minRating) : null,
    color: query.color || null,
    brand: query.brand || null,
    features: query.features
      ? query.features.split(",").map((f) => f.trim()).filter(Boolean)
      : [],
    storage: query.storage || null,
    ram: query.ram || null,
    size: query.size || null,
    deals: query.deals === "true",
    sort: query.sort || "relevance",
    smart: query.smart === "true" || hasSmartFilters(query),
  }
}

function hasSmartFilters(query) {
  return !!(
    query.smart === "true" ||
    query.intent ||
    query.terms ||
    query.minPrice ||
    query.maxPrice ||
    query.minRating ||
    query.color ||
    query.brand ||
    query.features ||
    query.keywords ||
    query.storage ||
    query.ram ||
    query.size ||
    query.deals
  )
}

export function applyDatabaseFilters(query, filters) {
  if (!filters.smart) {
    if (filters.category) query = query.eq("category", filters.category)
    if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
      query = query.lte("price", filters.maxPrice)
    }
    if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
      query = query.gte("price", filters.minPrice)
    }
    if (filters.minRating != null && !Number.isNaN(filters.minRating)) {
      query = query.gte("rating", filters.minRating)
    }
    if (filters.deals) query = query.eq("is_featured", true)
    if (filters.search) query = query.ilike("title", `%${filters.search}%`)
    return query
  }

  // Smart mode: fetch broader set; rank in memory (soft category/price)
  if (filters.deals) query = query.eq("is_featured", true)

  if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
    query = query.lte("price", filters.maxPrice * 1.35)
  }
  if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
    query = query.gte("price", filters.minPrice * 0.65)
  }

  return query
}

function broadenAndRank(products, filters) {
  const relaxed = { ...filters, category: null, maxPrice: null, minPrice: null }
  const scored = products
    .map((p) => ({ product: p, score: scoreProduct(p, relaxed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map((s) => s.product)
}

export function filterAndRankProducts(products, filters) {
  if (!filters.smart) {
    return sortProducts(products, filters.sort)
  }

  const minScore = 2
  let scored = products
    .map((p) => ({ product: p, score: scoreProduct(p, filters) }))
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    const broadened = broadenAndRank(products, filters)
    return sortProducts(broadened, filters.sort === "relevance" ? "rating" : filters.sort)
  }

  if (filters.sort === "relevance") {
    return scored.map((s) => s.product)
  }

  return sortProducts(
    scored.map((s) => s.product),
    filters.sort
  )
}
