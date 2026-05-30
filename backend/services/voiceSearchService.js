const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const VOICE_MODEL = process.env.GEMINI_VOICE_MODEL || "gemini-2.0-flash"
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_VOICE_TIMEOUT_MS) || 5000
const PARSE_CACHE_MAX = 200

/** @type {Map<string, object>} */
const parseCache = new Map()

const VOICE_SEARCH_PROMPT = `Parse ecommerce voice query to JSON. INR prices. category: electronics|fashion|sports|home|beauty|books|toys|automotive|null. intent=product type. keywords=extra terms. sort: relevance|rating|price_asc|price_desc|popular|newest. interpretation=short UI label.
Schema: {"search":"","intent":null,"category":null,"keywords":[],"features":[],"color":null,"brand":null,"maxPrice":null,"minPrice":null,"minRating":null,"sort":"relevance","dealsOnly":false,"interpretation":""}`

const VALID_CATEGORIES = new Set([
  "electronics",
  "fashion",
  "sports",
  "home",
  "beauty",
  "books",
  "toys",
  "automotive",
])

const INTENT_CATEGORY_MAP = {
  shoes: "sports",
  shirt: "fashion",
  yoga: "sports",
  sunglasses: "fashion",
  bag: "fashion",
  lamp: "home",
  coffee: "home",
  headphones: "electronics",
  laptop: "electronics",
  phone: "electronics",
  watch: "electronics",
  mouse: "electronics",
  keyboard: "electronics",
  speaker: "electronics",
  monitor: "electronics",
}

const PRODUCT_TYPES = [
  "headphones",
  "earbuds",
  "earphone",
  "laptop",
  "phone",
  "smartphone",
  "mobile",
  "watch",
  "shoes",
  "sneaker",
  "keyboard",
  "mouse",
  "speaker",
  "monitor",
  "shirt",
  "backpack",
]

function cacheGet(key) {
  const hit = parseCache.get(key)
  if (!hit) return null
  parseCache.delete(key)
  parseCache.set(key, hit)
  return hit
}

function cacheSet(key, value) {
  if (parseCache.size >= PARSE_CACHE_MAX) {
    const first = parseCache.keys().next().value
    parseCache.delete(first)
  }
  parseCache.set(key, value)
}

async function callGeminiJson(userQuery) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const cacheKey = userQuery.toLowerCase().trim()
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS)

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${VOICE_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: VOICE_SEARCH_PROMPT }] },
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 220,
          responseMimeType: "application/json",
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini ${VOICE_MODEL}: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Empty Gemini response")

    const parsed = JSON.parse(text)
    cacheSet(cacheKey, parsed)
    return parsed
  } finally {
    clearTimeout(timeoutId)
  }
}

function quickParse(query) {
  const text = query.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim()
  const parsed = {
    search: "",
    intent: null,
    category: null,
    keywords: [],
    features: [],
    color: null,
    brand: null,
    maxPrice: null,
    minPrice: null,
    minRating: null,
    sort: "relevance",
    dealsOnly: false,
    interpretation: query,
    rawQuery: query,
  }

  if (!text) return parsed

  const under = text.match(/(?:under|below|less than|upto|up to|max)\s+(\d+(?:\.\d+)?)\s*(k|lakh|lac)?/i)
  if (under) {
    let amount = parseFloat(under[1])
    const unit = (under[2] || "").toLowerCase()
    if (unit === "k") amount *= 1000
    if (unit === "lakh" || unit === "lac") amount *= 100000
    parsed.maxPrice = amount
  }

  const above = text.match(/(?:above|over|more than|from)\s+(\d+(?:\.\d+)?)\s*(k|lakh|lac)?/i)
  if (above) {
    let amount = parseFloat(above[1])
    const unit = (above[2] || "").toLowerCase()
    if (unit === "k") amount *= 1000
    if (unit === "lakh" || unit === "lac") amount *= 100000
    parsed.minPrice = amount
  }

  if (/\b(cheap|budget|affordable|low cost)\b/.test(text)) parsed.sort = "price_asc"
  if (/\b(best|top|highest rated)\b/.test(text)) parsed.sort = "rating"
  if (/\b(premium|luxury|expensive)\b/.test(text)) parsed.sort = "price_desc"
  if (/\b(deal|deals|discount|sale|offer)\b/.test(text)) parsed.dealsOnly = true

  const brands = ["nike", "adidas", "apple", "samsung", "sony", "bose", "jbl", "puma", "logitech"]
  for (const b of brands) {
    if (text.includes(b)) {
      parsed.brand = b
      if (!parsed.keywords.includes(b)) parsed.keywords.push(b)
      break
    }
  }

  const featureWords = ["gaming", "wireless", "bluetooth", "noise cancelling", "fitness", "student", "portable"]
  for (const f of featureWords) {
    if (text.includes(f)) parsed.features.push(f.replace(/\s+/g, " "))
  }

  for (const kw of ["gaming", "gym", "student", "wireless", "bluetooth", "fitness"]) {
    if (text.includes(kw) && !parsed.keywords.includes(kw)) parsed.keywords.push(kw)
  }

  for (const t of PRODUCT_TYPES) {
    if (text.includes(t)) {
      const intent = t === "earbuds" || t === "earphone" ? "headphones" : t === "sneaker" ? "shoes" : t === "smartphone" || t === "mobile" ? "phone" : t
      parsed.intent = intent
      parsed.search = intent
      if (INTENT_CATEGORY_MAP[intent]) parsed.category = INTENT_CATEGORY_MAP[intent]
      break
    }
  }

  const categoryAliases = {
    electronics: ["electronics", "electronic", "gadget", "tech"],
    fashion: ["fashion", "clothing", "clothes", "apparel"],
    sports: ["sports", "sport", "fitness", "gym"],
    home: ["home", "furniture", "kitchen"],
    beauty: ["beauty", "skincare", "makeup"],
  }
  if (!parsed.category) {
    for (const [cat, words] of Object.entries(categoryAliases)) {
      if (words.some((w) => text.includes(w))) {
        parsed.category = cat
        break
      }
    }
  }

  if (!parsed.search && parsed.intent) parsed.search = parsed.intent
  if (!parsed.search) parsed.search = text.split(" ").filter((w) => w.length > 2).slice(0, 2).join(" ") || query

  parsed.interpretation = [
    parsed.brand,
    parsed.intent || parsed.search,
    parsed.maxPrice != null ? `under ₹${Math.round(parsed.maxPrice)}` : null,
    parsed.features[0],
  ]
    .filter(Boolean)
    .join(" ")

  return parsed
}

function isConfidentParse(parsed) {
  return !!(
    parsed.intent ||
    parsed.maxPrice != null ||
    parsed.minPrice != null ||
    parsed.category ||
    parsed.brand ||
    (parsed.features && parsed.features.length > 0) ||
    parsed.minRating != null
  )
}

function normalizeGeminiParsed(raw, originalQuery) {
  const parsed = {
    search: String(raw.search || raw.intent || "").trim(),
    intent: raw.intent ? String(raw.intent).toLowerCase().trim() : null,
    category: raw.category ? String(raw.category).toLowerCase().trim() : null,
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords.map((k) => String(k).toLowerCase().trim()).filter(Boolean)
      : [],
    features: Array.isArray(raw.features)
      ? raw.features.map((f) => String(f).toLowerCase().trim()).filter(Boolean)
      : [],
    color: raw.color ? String(raw.color).toLowerCase().trim() : null,
    brand: raw.brand ? String(raw.brand).toLowerCase().trim() : null,
    maxPrice: raw.maxPrice != null && !Number.isNaN(Number(raw.maxPrice)) ? Number(raw.maxPrice) : null,
    minPrice: raw.minPrice != null && !Number.isNaN(Number(raw.minPrice)) ? Number(raw.minPrice) : null,
    minRating:
      raw.minRating != null && !Number.isNaN(Number(raw.minRating)) ? Number(raw.minRating) : null,
    sort: ["relevance", "rating", "price_asc", "price_desc", "popular", "newest"].includes(raw.sort)
      ? raw.sort
      : "relevance",
    dealsOnly: !!raw.dealsOnly,
    interpretation: String(raw.interpretation || originalQuery).trim(),
    rawQuery: originalQuery,
  }

  if (parsed.category && !VALID_CATEGORIES.has(parsed.category)) {
    parsed.category = null
  }

  if (!parsed.category && parsed.intent && INTENT_CATEGORY_MAP[parsed.intent]) {
    parsed.category = INTENT_CATEGORY_MAP[parsed.intent]
  }

  if (parsed.brand && !parsed.keywords.includes(parsed.brand)) {
    parsed.keywords.unshift(parsed.brand)
  }

  if (!parsed.search && parsed.intent) parsed.search = parsed.intent
  if (!parsed.search) parsed.search = originalQuery

  return parsed
}

function buildSearchParamsFromParsed(parsed) {
  const params = new URLSearchParams()
  params.set("smart", "true")

  if (parsed.search) params.set("search", parsed.search)
  if (parsed.intent) params.set("intent", parsed.intent)
  if (parsed.category) params.set("category", parsed.category)
  if (parsed.maxPrice != null) params.set("maxPrice", String(parsed.maxPrice))
  if (parsed.minPrice != null) params.set("minPrice", String(parsed.minPrice))
  if (parsed.minRating != null) params.set("minRating", String(parsed.minRating))
  if (parsed.color) params.set("color", parsed.color)
  if (parsed.brand) params.set("brand", parsed.brand)
  if (parsed.features?.length) params.set("features", parsed.features.join(","))
  if (parsed.keywords?.length) params.set("keywords", parsed.keywords.join(","))
  if (parsed.sort && parsed.sort !== "relevance") params.set("sort", parsed.sort)
  if (parsed.dealsOnly) params.set("deals", "true")

  return params
}

function buildResponse(trimmed, parsed, aiPowered) {
  const searchParams = buildSearchParamsFromParsed(parsed)
  const path = `/products?${searchParams.toString()}`

  const suggestions = [
    parsed.intent,
    parsed.category,
    parsed.brand,
    parsed.maxPrice != null ? `Under ₹${parsed.maxPrice}` : null,
    parsed.minPrice != null ? `From ₹${parsed.minPrice}` : null,
    ...(parsed.keywords || []),
    ...(parsed.features || []),
  ].filter(Boolean)

  const interpretation = parsed.interpretation.startsWith("Searching")
    ? parsed.interpretation
    : `Searching for ${parsed.interpretation}`

  return {
    query: trimmed,
    suggestions: [...new Set(suggestions.map((s) => String(s)))].slice(0, 6),
    interpretation,
    parsed: {
      search: parsed.search,
      intent: parsed.intent,
      category: parsed.category,
      keywords: parsed.keywords,
      features: parsed.features,
      color: parsed.color,
      brand: parsed.brand,
      maxPrice: parsed.maxPrice,
      minPrice: parsed.minPrice,
      minRating: parsed.minRating,
      sort: parsed.sort,
      dealsOnly: parsed.dealsOnly,
    },
    searchParams: searchParams.toString(),
    path,
    aiPowered,
    fallback: !aiPowered,
    fastPath: !aiPowered,
  }
}

/**
 * Parse voice query (fast local path, Gemini only when needed). Products load on /products page.
 * @param {string} query
 */
export async function executeVoiceSearch(query) {
  const trimmed = (query || "").trim()
  if (!trimmed) {
    throw new Error("Query is required.")
  }

  let parsed = quickParse(trimmed)
  let aiPowered = false

  if (!isConfidentParse(parsed)) {
    try {
      const geminiRaw = await callGeminiJson(trimmed)
      parsed = normalizeGeminiParsed(geminiRaw, trimmed)
      aiPowered = true
    } catch (geminiErr) {
      console.warn("Gemini voice search:", geminiErr.message)
      if (!isConfidentParse(parsed)) {
        parsed.search = trimmed
        parsed.interpretation = trimmed
      }
    }
  }

  return buildResponse(trimmed, parsed, aiPowered)
}
