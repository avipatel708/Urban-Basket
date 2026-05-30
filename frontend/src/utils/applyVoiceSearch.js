import {
  parseVoiceQuery,
  voiceSearchToUrlParams,
  describeVoiceSearch,
} from "./parseVoiceQuery.js"

export function isInstantVoiceParse(transcript) {
  return (transcript || "").trim().length > 0
}

function buildSuggestions(parsed) {
  return [
    parsed.intent,
    parsed.category,
    parsed.brand,
    parsed.maxPrice != null ? `Under ₹${Math.round(parsed.maxPrice)}` : null,
    parsed.minPrice != null ? `From ₹${Math.round(parsed.minPrice)}` : null,
    ...(parsed.features || []),
    ...(parsed.keywords || []),
  ]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6)
}

function buildFromParsed(parsed, transcript) {
  const params = voiceSearchToUrlParams(parsed)
  const label = `Searching for ${describeVoiceSearch(parsed)}`
  params.set("voiceHint", label)
  const suggestions = buildSuggestions(parsed)
  if (suggestions.length) params.set("suggestions", suggestions.join(","))

  return {
    parsed: {
      ...parsed,
      searchText: parsed.searchText || parsed.search || transcript,
      sort: parsed.sort || parsed.sortBy || "relevance",
    },
    params,
    path: `/products?${params.toString()}`,
    label,
    suggestions,
    aiPowered: false,
    fallback: false,
    instant: true,
  }
}

/**
 * Process voice transcript into navigation + API-ready state (local only, instant).
 * @param {string} transcript
 */
export function processVoiceSearch(transcript) {
  const parsed = parseVoiceQuery((transcript || "").trim())
  return buildFromParsed(parsed, transcript)
}

/**
 * Instant voice search — always local parse, no backend AI.
 * @param {string} transcript
 */
export function processVoiceSearchAsync(transcript) {
  return Promise.resolve(processVoiceSearch(transcript))
}

/**
 * Run voice search and return navigation target (for navbar / products).
 * @param {string} transcript
 */
export async function executeVoiceSearch(transcript) {
  const trimmed = (transcript || "").trim()
  if (!trimmed) {
    throw new Error("Empty transcript")
  }
  return processVoiceSearchAsync(trimmed)
}

/**
 * Build getProducts() params from URL search params.
 * @param {URLSearchParams} searchParams
 */
export function buildProductQueryFromUrl(searchParams) {
  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || "all"
  const sort = searchParams.get("sort") || "newest"

  const maxPrice = searchParams.get("maxPrice")
  const minPrice = searchParams.get("minPrice")
  const minRating = searchParams.get("minRating")
  const color = searchParams.get("color")
  const brand = searchParams.get("brand")
  const features = searchParams.get("features")
  const storage = searchParams.get("storage")
  const ram = searchParams.get("ram")
  const size = searchParams.get("size")
  const deals = searchParams.get("deals")
  const intent = searchParams.get("intent")
  const terms = searchParams.get("terms")
  const keywords = searchParams.get("keywords")
  const smart = searchParams.get("smart") === "true"

  const hasSmart =
    smart ||
    !!(
      intent ||
      terms ||
      keywords ||
      maxPrice ||
      minPrice ||
      minRating ||
      color ||
      brand ||
      features ||
      storage ||
      ram ||
      size ||
      deals ||
      search.trim()
    )

  const params = {
    limit: 100,
    sort: sort === "relevance" ? "relevance" : sort,
    smart: hasSmart,
  }

  if (category !== "all") params.category = category
  if (search.trim()) params.search = search.trim()
  if (intent) params.intent = intent
  if (terms) params.terms = terms
  if (keywords) params.keywords = keywords
  if (maxPrice) params.maxPrice = parseFloat(maxPrice)
  if (minPrice) params.minPrice = parseFloat(minPrice)
  if (minRating) params.minRating = parseFloat(minRating)
  if (color) params.color = color
  if (brand) params.brand = brand
  if (features) params.features = features
  if (storage) params.storage = storage
  if (ram) params.ram = ram
  if (size) params.size = size
  if (deals === "true") params.deals = true

  return { params, category, sort, search }
}
