import { supabaseAdmin } from "../config/supabase.js"
import { PRODUCT_GROUPS } from "./productSearchService.js"

const COLOR_ALIASES = {
  black: ["black", "obsidian", "dark", "midnight", "charcoal"],
  white: ["white", "pearl", "ivory"],
  red: ["red", "crimson"],
  blue: ["blue", "navy", "azure", "nebula"],
  green: ["green", "olive"],
  silver: ["silver", "chrome", "titanium", "metallic"],
  gold: ["gold", "golden"],
}

/** Complementary product intents for each detected intent. */
const COMPLEMENT_INTENTS = {
  shoes: ["shirt", "watch", "bag", "sunglasses", "headphones"],
  shirt: ["shoes", "bag", "watch", "sunglasses"],
  bag: ["shoes", "shirt", "watch", "laptop", "headphones"],
  watch: ["headphones", "shirt", "shoes", "bag"],
  sunglasses: ["shirt", "bag", "watch", "shoes"],
  laptop: ["mouse", "keyboard", "headphones", "bag", "monitor"],
  phone: ["headphones", "watch", "bag"],
  headphones: ["phone", "watch", "laptop", "bag"],
  keyboard: ["mouse", "headphones", "monitor", "laptop"],
  mouse: ["keyboard", "headphones", "monitor", "laptop"],
  monitor: ["keyboard", "mouse", "headphones", "laptop"],
  speaker: ["phone", "laptop", "headphones"],
  lamp: ["keyboard", "bag", "coffee"],
  coffee: ["lamp", "bag"],
  yoga: ["shoes", "shirt", "bag", "watch"],
}

const CATEGORY_COMPLEMENTS = {
  electronics: ["electronics", "fashion", "home"],
  fashion: ["fashion", "beauty", "sports", "electronics"],
  sports: ["sports", "fashion", "electronics", "beauty"],
  beauty: ["beauty", "fashion", "home"],
  home: ["home", "electronics", "fashion"],
  toys: ["toys", "electronics", "sports"],
  books: ["books", "electronics", "home"],
  automotive: ["automotive", "electronics"],
}

const FASHION_CATEGORIES = new Set(["fashion", "beauty", "sports"])

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function productText(product) {
  return normalize(`${product.title} ${product.description} ${product.category}`)
}

function detectIntents(product) {
  const text = productText(product)
  const intents = []
  for (const [intent, keywords] of Object.entries(PRODUCT_GROUPS)) {
    if (keywords.some((kw) => text.includes(normalize(kw)))) {
      intents.push(intent)
    }
  }
  if (intents.length === 0 && product.category) {
    if (product.category === "fashion") intents.push("shirt", "bag")
    if (product.category === "electronics") intents.push("headphones")
    if (product.category === "sports") intents.push("shoes", "yoga")
  }
  return [...new Set(intents)]
}

function detectColors(product) {
  const text = productText(product)
  const colors = []
  for (const [color, aliases] of Object.entries(COLOR_ALIASES)) {
    if (aliases.some((a) => text.includes(a))) colors.push(color)
  }
  return colors
}

function detectStyles(product) {
  const text = productText(product)
  const styles = []
  const styleKeywords = {
    gaming: ["gaming", "gamer", "rgb", "mechanical", "cyber", "aero"],
    premium: ["premium", "luxury", "pro", "ultra", "flagship", "designer", "luxe"],
    sport: ["running", "sport", "fitness", "velocity", "athletic"],
    minimal: ["minimal", "ceramic", "botanical", "organic"],
    tech: ["smart", "wireless", "quantum", "neo", "digital"],
  }
  for (const [style, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some((k) => text.includes(k))) styles.push(style)
  }
  return styles
}

function intentMatchScore(sourceIntents, candidate) {
  const candidateText = productText(candidate)
  let score = 0
  for (const intent of sourceIntents) {
    const complements = COMPLEMENT_INTENTS[intent] || []
    for (const comp of complements) {
      const keywords = PRODUCT_GROUPS[comp] || [comp]
      if (keywords.some((kw) => candidateText.includes(normalize(kw)))) {
        score += 28
      }
    }
  }
  return score
}

function categoryComplementScore(sourceCategory, candidate) {
  const complements = CATEGORY_COMPLEMENTS[sourceCategory] || [sourceCategory]
  const idx = complements.indexOf(candidate.category)
  if (idx === -1) return 0
  if (candidate.category === sourceCategory) return 8
  return 22 - idx * 4
}

function colorHarmonyScore(sourceColors, candidate) {
  if (!sourceColors.length) return 0
  const candidateColors = detectColors(candidate)
  if (!candidateColors.length) return 4
  const overlap = sourceColors.filter((c) => candidateColors.includes(c))
  return overlap.length ? 14 : 6
}

function styleAffinityScore(sourceStyles, candidate) {
  if (!sourceStyles.length) return 0
  const candidateStyles = detectStyles(candidate)
  const overlap = sourceStyles.filter((s) => candidateStyles.includes(s))
  return overlap.length * 12
}

function priceCompatibilityScore(sourcePrice, candidatePrice) {
  const ratio = candidatePrice / Math.max(sourcePrice, 1)
  if (ratio >= 0.15 && ratio <= 0.85) return 16
  if (ratio >= 0.08 && ratio <= 1.2) return 10
  if (ratio <= 2) return 4
  return 0
}

function behaviorBoost(candidate, context = {}) {
  let boost = 0
  const { recentIds = [], wishlistCategories = [] } = context

  if (recentIds.includes(candidate.id)) boost -= 20
  if (wishlistCategories.includes(candidate.category)) boost += 8

  boost += Math.min(parseFloat(candidate.rating) || 0, 5) * 2
  boost += Math.min((candidate.review_count || 0) / 10, 5)

  if (candidate.stock > 0) boost += 5
  else boost -= 50

  return boost
}

function scoreCandidate(source, candidate, context) {
  if (source.id === candidate.id) return -1

  const sourceIntents = detectIntents(source)
  const sourceColors = detectColors(source)
  const sourceStyles = detectStyles(source)

  let score = 0
  score += intentMatchScore(sourceIntents, candidate)
  score += categoryComplementScore(source.category, candidate)
  score += colorHarmonyScore(sourceColors, candidate)
  score += styleAffinityScore(sourceStyles, candidate)
  score += priceCompatibilityScore(parseFloat(source.price), parseFloat(candidate.price))
  score += behaviorBoost(candidate, context)

  const candidateIntents = detectIntents(candidate)
  const isComplement = sourceIntents.some((si) =>
    (COMPLEMENT_INTENTS[si] || []).some((ci) => candidateIntents.includes(ci))
  )
  const isSameCategory = candidate.category === source.category

  let matchType = "similar"
  if (isComplement && !isSameCategory) matchType = "complement"
  else if (isComplement) matchType = "complement"
  else if (isSameCategory) matchType = "similar"

  const reasons = []
  if (intentMatchScore(sourceIntents, candidate) > 0) reasons.push("pairs well")
  if (colorHarmonyScore(sourceColors, candidate) >= 14) reasons.push("matching color")
  if (styleAffinityScore(sourceStyles, candidate) > 0) reasons.push("same style")
  if (categoryComplementScore(source.category, candidate) >= 18) reasons.push("complete the setup")

  return { score, matchType, reasons: reasons.slice(0, 3), intents: candidateIntents }
}

function pickSectionTitle(source) {
  if (source.category === "electronics" || source.category === "automotive") {
    return "You May Also Like"
  }
  if (FASHION_CATEGORIES.has(source.category)) {
    return "Complete Your Look"
  }
  const intents = detectIntents(source)
  const fashionIntents = new Set(["shirt", "shoes", "bag", "sunglasses"])
  if (intents.some((i) => fashionIntents.has(i))) return "Complete Your Look"
  return "You May Also Like"
}

export async function getProductRecommendations(productId, context = {}) {
  const { data: source, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single()

  if (error || !source) {
    return null
  }

  const { data: catalog, error: catalogError } = await supabaseAdmin
    .from("products")
    .select("*")
    .gt("stock", 0)
    .limit(200)

  if (catalogError) {
    throw new Error(catalogError.message)
  }

  const pool = (catalog || []).filter((p) => p.id !== productId)

  const scored = pool
    .map((candidate) => {
      const result = scoreCandidate(source, candidate, context)
      return { product: candidate, ...result }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)

  const complements = scored.filter((r) => r.matchType === "complement").slice(0, 8)
  const similar = scored.filter((r) => r.matchType === "similar").slice(0, 8)

  const matchProducts = (complements.length >= 3 ? complements : scored).slice(0, 8)
  const alsoLike = similar.length >= 2 ? similar : scored.slice(0, 6)

  const bundleCandidates = scored
    .filter((r) => r.matchType === "complement")
    .filter((r, i, arr) => {
      const cats = arr.slice(0, i).map((x) => x.product.category)
      return !cats.includes(r.product.category)
    })
    .slice(0, 2)

  const frequentlyBoughtTogether = [source, ...bundleCandidates.map((b) => b.product)]

  return {
    product: source,
    sectionTitle: pickSectionTitle(source),
    matchReasons: detectIntents(source),
    detectedStyles: detectStyles(source),
    detectedColors: detectColors(source),
    complements: matchProducts.map(({ product, score, reasons, matchType }) => ({
      ...product,
      _recommendation: { score, reasons, matchType },
    })),
    similar: alsoLike.map(({ product, score, reasons, matchType }) => ({
      ...product,
      _recommendation: { score, reasons, matchType },
    })),
    frequentlyBoughtTogether: frequentlyBoughtTogether.map((p) => ({
      id: p.id,
      title: p.title,
      price: parseFloat(p.price),
      image_url: p.image_url,
      category: p.category,
      stock: p.stock,
    })),
    bundleSavings:
      frequentlyBoughtTogether.length > 1
        ? parseFloat(
            (
              frequentlyBoughtTogether.reduce((s, p) => s + parseFloat(p.price), 0) * 0.05
            ).toFixed(0)
          )
        : 0,
  }
}
