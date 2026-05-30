/**
 * Fast natural-language voice query parser.
 * Extracts category, price, colors, features, and product intent instantly.
 */

import {
  PRODUCT_SEMANTIC_GROUPS,
  FEATURE_SYNONYMS,
  INTENT_KEYWORDS,
  findSemanticGroup,
} from "./searchSynonyms.js"

const STOP_WORDS = new Set([
  "show", "me", "find", "get", "search", "for", "the", "a", "an", "with",
  "and", "or", "in", "on", "at", "to", "of", "please", "want", "need",
  "looking", "some", "any", "all", "products", "product", "items", "item",
  "buy", "purchase", "order", "like", "would", "could", "can", "you", "my",
  "i", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "do", "does", "did", "will", "just", "really", "also", "something", "thing",
  "give", "tell", "help", "let", "see", "display", "list",
])

const COLORS = [
  "black", "white", "red", "blue", "green", "yellow", "pink", "purple",
  "orange", "grey", "gray", "silver", "gold", "brown", "beige", "navy",
]

const CATEGORY_ALIASES = {
  electronics: [
    "electronics", "electronic", "gadget", "gadgets", "tech", "device", "devices",
  ],
  fashion: [
    "fashion", "clothing", "clothes", "apparel", "wear", "outfit", "dress",
    "shirt", "tshirt", "t-shirt", "tee", "jeans", "jacket", "stylish",
  ],
  sports: [
    "sports", "sport", "fitness", "gym", "running", "athletic", "workout",
  ],
  home: ["home", "living", "furniture", "decor", "kitchen"],
  beauty: ["beauty", "skincare", "cosmetic", "cosmetics", "makeup"],
  books: ["books", "book", "novel", "reading"],
  toys: ["toys", "toy"],
  automotive: ["automotive", "car", "vehicle", "auto"],
}

const PRODUCT_TYPE_PATTERNS = [
  { group: "headphones", patterns: ["gaming headset", "gaming headphones", "headphone", "headphones", "headset", "earbud", "earbuds", "earphone", "airpods"] },
  { group: "laptop", patterns: ["laptop", "laptops", "notebook", "macbook"] },
  { group: "phone", patterns: ["phone", "phones", "smartphone", "iphone", "mobile"] },
  { group: "watch", patterns: ["watch", "watches", "smartwatch", "smart band"] },
  { group: "shoes", patterns: ["shoe", "shoes", "sneaker", "sneakers", "footwear"] },
  { group: "mouse", patterns: ["mouse", "mice", "gaming mouse"] },
  { group: "keyboard", patterns: ["keyboard", "keyboards", "gaming keyboard"] },
  { group: "speaker", patterns: ["speaker", "speakers", "soundbar"] },
  { group: "monitor", patterns: ["monitor", "monitors", "display", "4k monitor", "screen"] },
  { group: "bag", patterns: ["backpack", "bag", "bags"] },
  { group: "lamp", patterns: ["lamp", "lamps", "desk lamp", "lighting"] },
  { group: "sunglasses", patterns: ["sunglasses", "shades"] },
  { group: "shirt", patterns: ["shirt", "tshirt", "t-shirt", "tee", "top", "crop top"] },
  { group: "yoga", patterns: ["yoga mat", "yoga"] },
  { group: "coffee", patterns: ["coffee", "pour over", "brew"] },
]

const FEATURE_PHRASES = Object.keys(FEATURE_SYNONYMS).sort((a, b) => b.length - a.length)

const BRANDS = [
  "apple", "iphone", "samsung", "nike", "adidas", "sony", "bose", "jbl",
  "dell", "hp", "lenovo", "asus", "puma", "logitech", "hyperx",
]

/**
 * Clean spoken transcript before parsing.
 * @param {string} transcript
 */
export function cleanTranscript(transcript) {
  return (transcript || "")
    .toLowerCase()
    .replace(/[^\w\s₹.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Parse voice transcript into structured search filters.
 * @param {string} transcript
 */
export function parseVoiceQuery(transcript) {
  const rawQuery = (transcript || "").trim()
  let text = cleanTranscript(transcript)

  const result = {
    rawQuery,
    search: "",
    keywords: [],
    category: null,
    color: null,
    minPrice: null,
    maxPrice: null,
    minRating: null,
    features: [],
    brand: null,
    specs: {},
    sort: "relevance",
    sortBy: "relevance",
    dealsOnly: false,
    intent: null,
    semanticTerms: [],
    searchText: "",
  }

  if (!text) return result

  for (const [word, config] of Object.entries(INTENT_KEYWORDS)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
      if (config.sort) result.sort = config.sort
      if (config.maxPriceBoost && result.maxPrice == null) {
        result.maxPrice = config.maxPriceBoost
      }
      text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), " ")
    }
  }

  if (/\b(deals?|discounts?|offers?|sale|on sale|clearance)\b/.test(text)) {
    result.dealsOnly = true
    text = text.replace(/\b(deals?|discounts?|offers?|sale|on sale|clearance)\b/g, " ")
  }

  if (/\b(best|top rated|top-rated|highest rated)\b/.test(text)) {
    result.sort = "rating"
    text = text.replace(/\b(best|top rated|top-rated|highest rated)\b/g, " ")
  } else if (/\b(cheapest|lowest price)\b/.test(text)) {
    result.sort = "price_asc"
    text = text.replace(/\b(cheapest|lowest price)\b/g, " ")
  } else if (/\b(expensive|luxury)\b/.test(text)) {
    result.sort = "price_desc"
    text = text.replace(/\b(expensive|luxury)\b/g, " ")
  } else if (/\b(newest|latest|new arrivals)\b/.test(text)) {
    result.sort = "newest"
    text = text.replace(/\b(newest|latest|new arrivals)\b/g, " ")
  } else if (/\b(popular|trending)\b/.test(text)) {
    result.sort = "popular"
    text = text.replace(/\b(popular|trending)\b/g, " ")
  }

  const starMatch = text.match(/(\d(?:\.\d)?)\s*(?:star|stars|rating)/)
  if (starMatch) {
    result.minRating = parseFloat(starMatch[1])
    text = text.replace(starMatch[0], " ")
  }

  const betweenMatch = text.match(
    /between\s+(\d[\d,]*)\s*(?:and|to)\s+(\d[\d,]*)\s*(k|thousand|lakh|lac)?/i
  )
  if (betweenMatch) {
    const a = parsePriceNumber(betweenMatch[1], betweenMatch[3])
    const b = parsePriceNumber(betweenMatch[2], betweenMatch[3])
    result.minPrice = Math.min(a, b)
    result.maxPrice = Math.max(a, b)
    text = text.replace(betweenMatch[0], " ")
  }

  const underMatch = text.match(
    /(?:under|below|less than|upto|up to|max|maximum|within|cheaper than)\s+(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|lac)?/i
  )
  if (underMatch && result.maxPrice == null) {
    result.maxPrice = parsePriceNumber(underMatch[1], underMatch[2])
    text = text.replace(underMatch[0], " ")
  }

  const overMatch = text.match(
    /(?:over|above|more than|minimum|min|from|starting)\s+(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakh|lac)?/i
  )
  if (overMatch && result.minPrice == null) {
    result.minPrice = parsePriceNumber(overMatch[1], overMatch[2])
    text = text.replace(overMatch[0], " ")
  }

  const barePriceMatch = text.match(/(\d[\d,]*)\s*(?:rupees?|rs\.?|inr|₹)/i)
  if (barePriceMatch && result.maxPrice == null && result.minPrice == null) {
    result.maxPrice = parsePriceNumber(barePriceMatch[1])
    text = text.replace(barePriceMatch[0], " ")
  }

  const trailingPriceMatch = text.match(/\b(\d[\d,]{2,})\s*(k|thousand|lakh|lac)?\s*$/i)
  if (trailingPriceMatch && result.maxPrice == null && result.minPrice == null) {
    result.maxPrice = parsePriceNumber(trailingPriceMatch[1], trailingPriceMatch[2])
    text = text.replace(trailingPriceMatch[0], " ")
  }

  const storageMatch = text.match(/(\d+)\s*(gb|tb)\s*(?:storage|memory|rom)?/i)
  if (storageMatch) {
    result.specs.storage = `${storageMatch[1]}${storageMatch[2].toLowerCase()}`
    text = text.replace(storageMatch[0], " ")
  }
  const ramMatch = text.match(/(\d+)\s*gb\s*ram/i)
  if (ramMatch) {
    result.specs.ram = `${ramMatch[1]}gb`
    text = text.replace(ramMatch[0], " ")
  }
  if (/\b4k\b/i.test(text)) {
    result.specs.resolution = "4k"
    if (!result.features.includes("4k")) result.features.push("4k")
    text = text.replace(/\b4k\b/gi, " ")
  }
  const rtxMatch = text.match(/\b(rtx\s*\d+|graphics card|dedicated graphics)\b/i)
  if (rtxMatch) {
    if (!result.features.includes("rtx")) result.features.push("rtx")
    text = text.replace(rtxMatch[0], " ")
  }

  for (const size of ["xs", "small", "medium", "large", "xl", "xxl"]) {
    if (new RegExp(`\\b${size}\\b`, "i").test(text)) {
      result.specs.size = size
      text = text.replace(new RegExp(`\\b${size}\\b`, "gi"), " ")
      break
    }
  }

  for (const color of COLORS) {
    if (new RegExp(`\\b${color}\\b`, "i").test(text)) {
      result.color = color
      text = text.replace(new RegExp(`\\b${color}\\b`, "gi"), " ")
      break
    }
  }

  for (const brand of BRANDS) {
    if (new RegExp(`\\b${brand}\\b`, "i").test(text)) {
      result.brand = brand
      text = text.replace(new RegExp(`\\b${brand}\\b`, "gi"), " ")
      break
    }
  }

  const sortedPatterns = [...PRODUCT_TYPE_PATTERNS].sort(
    (a, b) =>
      Math.max(...b.patterns.map((p) => p.length)) -
      Math.max(...a.patterns.map((p) => p.length))
  )
  for (const { group, patterns } of sortedPatterns) {
    for (const pattern of patterns.sort((a, b) => b.length - a.length)) {
      if (new RegExp(`\\b${escapeRegex(pattern)}\\b`, "i").test(text)) {
        result.intent = group
        result.keywords.push(pattern.split(" ")[0])
        result.category = inferCategoryFromGroup(group)
        text = text.replace(new RegExp(`\\b${escapeRegex(pattern)}\\b`, "gi"), " ")
        break
      }
    }
    if (result.intent) break
  }

  if (!result.category) {
    for (const [catId, aliases] of Object.entries(CATEGORY_ALIASES)) {
      if (aliases.some((a) => new RegExp(`\\b${escapeRegex(a)}\\b`, "i").test(text))) {
        result.category = catId
        break
      }
    }
  }

  for (const feature of FEATURE_PHRASES) {
    if (text.includes(feature)) {
      if (!result.features.includes(feature)) result.features.push(feature)
      text = text.replace(new RegExp(escapeRegex(feature), "gi"), " ")
    }
  }

  const tokens = text
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t))

  for (const token of tokens) {
    const normalized = singularize(token)
    if (!result.keywords.includes(normalized)) {
      result.keywords.push(normalized)
    }
  }

  if (!result.intent) {
    for (const token of result.keywords) {
      const group = findSemanticGroup(token)
      if (group) {
        result.intent = group
        if (!result.category) result.category = inferCategoryFromGroup(group)
        break
      }
    }
  }

  if (result.intent) {
    result.semanticTerms = [
      result.intent,
      ...(PRODUCT_SEMANTIC_GROUPS[result.intent] || []).slice(0, 8),
    ]
  } else {
    result.semanticTerms = result.keywords.slice(0, 6)
  }

  const spokenParts = []
  if (result.intent) {
    spokenParts.push(...(PRODUCT_SEMANTIC_GROUPS[result.intent] || []).slice(0, 2))
  }
  spokenParts.push(...result.keywords.slice(0, 5))
  if (result.color) spokenParts.push(result.color)
  spokenParts.push(...(result.features || []).slice(0, 2))

  const primaryLabel =
    result.intent ||
    result.keywords.slice(0, 3).join(" ") ||
    rawQuery.split(/\s+/).slice(0, 4).join(" ")

  result.search =
    [...new Set(spokenParts.map((p) => p.trim()).filter(Boolean))].join(" ").trim() ||
    primaryLabel
  result.searchText = [
    primaryLabel,
    ...result.features,
    result.color,
    result.brand,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  result.sortBy = result.sort
  return result
}

export function voiceSearchToUrlParams(parsed) {
  const params = new URLSearchParams()

  if (parsed.search) params.set("search", parsed.search)
  else if (parsed.rawQuery) params.set("search", parsed.rawQuery)

  if (parsed.intent) params.set("intent", parsed.intent)
  if (parsed.category && !parsed.intent) params.set("category", parsed.category)
  if (parsed.maxPrice != null) params.set("maxPrice", String(parsed.maxPrice))
  if (parsed.minPrice != null) params.set("minPrice", String(parsed.minPrice))
  if (parsed.minRating != null) params.set("minRating", String(parsed.minRating))
  if (parsed.color) params.set("color", parsed.color)
  if (parsed.features?.length) params.set("features", parsed.features.join(","))
  if (parsed.brand) params.set("brand", parsed.brand)
  if (parsed.keywords?.length) params.set("keywords", parsed.keywords.slice(0, 12).join(","))
  if (parsed.sort && parsed.sort !== "relevance") params.set("sort", parsed.sort)
  if (parsed.dealsOnly) params.set("deals", "true")
  if (parsed.specs?.storage) params.set("storage", parsed.specs.storage)
  if (parsed.specs?.ram) params.set("ram", parsed.specs.ram)
  if (parsed.specs?.size) params.set("size", parsed.specs.size)
  if (parsed.semanticTerms?.length) {
    params.set("terms", parsed.semanticTerms.slice(0, 12).join(","))
  }

  params.set("smart", "true")
  params.set("voice", "1")
  if (parsed.rawQuery) params.set("voiceQuery", parsed.rawQuery.slice(0, 120))
  return params
}

export function describeVoiceSearch(parsed) {
  const parts = []
  if (parsed.intent) parts.push(parsed.intent.replace(/_/g, " "))
  else if (parsed.search) parts.push(parsed.search)
  if (parsed.color) parts.push(parsed.color)
  if (parsed.maxPrice != null) parts.push(`under ₹${Math.round(parsed.maxPrice)}`)
  if (parsed.minPrice != null) parts.push(`above ₹${Math.round(parsed.minPrice)}`)
  if (parsed.features?.length) parts.push(parsed.features.slice(0, 2).join(", "))
  if (parsed.minRating != null) parts.push(`${parsed.minRating}+ stars`)
  return parts.join(" · ") || parsed.rawQuery
}

/** @deprecated Use parseVoiceQuery */
export const parseVoiceSearch = parseVoiceQuery

function parsePriceNumber(str, unit) {
  let amount = parseFloat(String(str).replace(/,/g, "")) || 0
  const u = (unit || "").toLowerCase()
  if (u === "k" || u === "thousand") amount *= 1000
  if (u === "lakh" || u === "lac") amount *= 100000
  return amount
}

function inferCategoryFromGroup(group) {
  const map = {
    shoes: "sports",
    shirt: "fashion",
    yoga: "sports",
    sunglasses: "fashion",
    bag: "fashion",
    lamp: "home",
    coffee: "home",
    skincare: "beauty",
  }
  return map[group] || "electronics"
}

function singularize(word) {
  if (word.length < 3) return word
  if (word.endsWith("ies")) return word.slice(0, -3) + "y"
  if (word.endsWith("ses") || word.endsWith("ches")) return word.slice(0, -2)
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1)
  return word
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
