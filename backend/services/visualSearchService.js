import { supabaseAdmin } from "../config/supabase.js"
import sharp from "sharp"
import { PRODUCT_GROUPS } from "./productSearchService.js"

async function analyzeImageWithGemini(buffer) {
  if (!buffer || !process.env.GEMINI_API_KEY) {
    console.log("No image buffer or GEMINI_API_KEY available for backend visual search.")
    return null
  }

  try {
    const base64Image = buffer.toString("base64")
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

    const prompt = `Analyze this product image. Your task is to identify what kind of product it is.
Return a JSON object with the following fields:
- "category": Must be one of "electronics", "fashion", "sports", "home", "beauty".
- "intent": Must be one of "shoes", "headphones", "laptop", "watch", "keyboard", "mouse", "bag", "shirt", "sunglasses", "lamp", "coffee", "yoga", "speaker", "monitor".
- "keywords": An array of 3-5 descriptive words about the product (e.g. ["sneaker", "running", "sporty", "breathable", "cushioning"] for running shoes).
- "colors": An array of the main colors visible in the product (e.g. ["black", "red"]).

Return ONLY a raw JSON object matching this schema. Do not include markdown code block formatting (such as \`\`\`json), do not include extra explanations, just raw JSON.`

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Gemini Visual Search API Error (${response.status}): ${errText}`)
      return null
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) return null

    // Parse safety
    let cleanText = content.trim()
    if (cleanText.includes("```")) {
      cleanText = cleanText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim()
    }

    return JSON.parse(cleanText)
  } catch (err) {
    console.error("Error analyzing image with Gemini on backend:", err.message)
    return null
  }
}

async function rankProductsWithGemini(buffer, products) {
  if (!buffer || !process.env.GEMINI_API_KEY || !products || products.length === 0) {
    console.log("No image buffer, GEMINI_API_KEY, or catalog products available for ranking.")
    return null
  }

  try {
    const base64Image = buffer.toString("base64")
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

    // Minimal representation of the product catalog to fit cleanly in context
    const catalog = products.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      description: (p.description || "").slice(0, 150)
    }))

    const prompt = `You are the Urban-Basket Multimodal Visual Search Engine.
We have an uploaded product image from a user, and a list of catalog products from our store database.
Your task is to examine the uploaded product image and identify its category, intent, color, style, and design.
Then, compare it to each product in our catalog and select/rank the catalog products that are visually and conceptually most similar to the product in the image.

Here is the complete product catalog:
${JSON.stringify(catalog, null, 2)}

Instructions:
1. Examine the uploaded image carefully. Identify what kind of product it is, its color, features, shape, style, and design.
2. Select the catalog products that match this visual item. Rank them from most visually/semantically similar (best match) to least.
3. Return a JSON array of objects representing the matched catalog products, where each object contains:
   - "id": The product ID of the matched product.
   - "score": A similarity score between 0 and 100 (e.g. 95 for extremely similar, 70 for moderately similar).
   - "reasons": An array of 1-3 short, friendly, descriptive match reasons explaining the similarity (e.g. ["matching color", "similar sneaker design", "sporty aesthetic"]).

Return ONLY a raw JSON array matching this schema. Do not include markdown code block formatting (such as \`\`\`json), do not include extra explanations, just raw JSON.`

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Gemini Visual Ranking API Error (${response.status}): ${errText}`)
      return null
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) return null

    let cleanText = content.trim()
    if (cleanText.includes("```")) {
      cleanText = cleanText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim()
    }

    return JSON.parse(cleanText)
  } catch (err) {
    console.error("Error ranking products with Gemini on backend:", err.message)
    return null
  }
}


const COLOR_BUCKETS = {
  black: { r: [0, 55], g: [0, 55], b: [0, 55] },
  white: { r: [200, 255], g: [200, 255], b: [200, 255] },
  red: { r: [140, 255], g: [0, 90], b: [0, 90] },
  blue: { r: [0, 90], g: [0, 140], b: [140, 255] },
  green: { r: [0, 100], g: [100, 200], b: [0, 100] },
  silver: { r: [150, 210], g: [150, 210], b: [150, 210] },
  gold: { r: [180, 255], g: [140, 220], b: [0, 100] },
}

const TEXT_COLOR_ALIASES = {
  black: ["black", "obsidian", "dark", "midnight", "charcoal"],
  white: ["white", "pearl", "ivory"],
  red: ["red", "crimson"],
  blue: ["blue", "navy", "azure", "nebula"],
  green: ["green", "olive"],
  silver: ["silver", "chrome", "titanium", "metallic"],
  gold: ["gold", "golden"],
}

const VISUAL_INTENT_KEYWORDS = {
  shoes: ["shoe", "shoes", "sneaker", "sneakers", "footwear", "trainer", "running shoe"],
  headphones: ["headphone", "headphones", "headset", "earbud", "earbuds", "earphone", "earphones", "airpods"],
  laptop: ["laptop", "notebook", "macbook", "chromebook"],
  phone: ["smartphone", "iphone", "android phone", "mobile phone", "cell phone"],
  watch: ["smartwatch", "smart watch", "wristwatch", "digital watch"],
  keyboard: ["keyboard", "mechanical keyboard", "gaming keyboard"],
  mouse: ["mouse", "gaming mouse", "wireless mouse"],
  bag: ["backpack", "backpacks", "handbag", "rucksack"],
  shirt: [
    "shirt", "tshirt", "t-shirt", "tee", "blouse", "jersey", "dress", "hoodie", "jacket", "coat",
    "top", "crop top", "crop", "tank", "tank top", "camisole", "bandeau", "bodysuit", "vest", "polo",
    "apparel", "swim", "swimsuit", "maillot", "bikini", "leotard", "tunic", "knit",
  ],
  sunglasses: ["sunglasses", "shades", "eyewear"],
  lamp: ["lamp", "desk lamp", "led lamp", "smart lamp"],
  coffee: ["coffee", "pour over", "mug", "ceramic"],
  yoga: ["yoga mat", "yoga", "exercise mat"],
  speaker: ["speaker", "speakers", "soundbar", "bluetooth speaker"],
}

const LABEL_RULES = [
  { re: /\b(shoe|sneaker|boot|sandal|slipper|trainer|footwear)\b/i, intents: ["shoes"], category: "fashion" },
  { re: /\b(headphone|earphone|headset|earbud|earbuds)\b/i, intents: ["headphones"], category: "electronics" },
  { re: /\b(laptop|notebook|macbook)\b/i, intents: ["laptop"], category: "electronics" },
  { re: /\b(keyboard|mechanical keyboard)\b/i, intents: ["keyboard"], category: "electronics" },
  { re: /\b(mouse|gaming mouse)\b/i, intents: ["mouse"], category: "electronics" },
  { re: /\b(monitor|display screen)\b/i, intents: ["mouse"], category: "electronics" },
  { re: /\b(smartphone|iphone|mobile phone|cellular phone)\b/i, intents: ["phone"], category: "electronics" },
  { re: /\b(smartwatch|wristwatch|digital watch)\b/i, intents: ["watch"], category: "electronics" },
  { re: /\b(backpack|handbag|purse|suitcase|rucksack|knapsack)\b/i, intents: ["bag"], category: "fashion" },
  { re: /\b(shirt|jersey|tee|blouse|dress|coat|jacket|sweater|hoodie|jean|trouser)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(bra|brassiere|bandeau|bikini|camisole|crop top|crop|tank top|bodysuit|leotard|tunic|vest)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(maillot|tank suit|swimsuit|swimwear|bathing suit|one piece|two piece)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(miniskirt|minidress|overskirt|garment|apparel|clothing|wardrobe)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(sunglass|eyewear|goggles|shades)\b/i, intents: ["sunglasses"], category: "fashion" },
  { re: /\b(lamp|lighting|chandelier)\b/i, intents: ["lamp"], category: "home" },
  { re: /\b(coffee mug|coffee cup|pour over|coffee pot)\b/i, intents: ["coffee"], category: "home" },
  { re: /\b(yoga mat|exercise mat|dumbbell)\b/i, intents: ["yoga"], category: "sports" },
  { re: /\b(lipstick|cosmetic|perfume|skincare|lotion)\b/i, intents: ["shirt"], category: "beauty" },
  { re: /\b(speaker|soundbar|microphone)\b/i, intents: ["speaker", "headphones"], category: "electronics" },
]

const FASHION_PRODUCT_KEYWORDS = [
  "top", "crop", "shirt", "tee", "blouse", "dress", "tank", "camisole", "hoodie", "jacket",
  "polo", "vest", "apparel", "swim", "knit", "jersey", "fashion",
]

const APPAREL_LABEL_RE =
  /\b(bra|brassiere|bandeau|bikini|camisole|crop|tank|maillot|swimsuit|swimwear|leotard|bodysuit|blouse|minidress|garment|apparel|clothing|top|tee|jersey|vest|tunic)\b/i

function labelsSuggestApparel(labels) {
  return labels.some((label) => {
    const raw = label.className || String(label)
    return APPAREL_LABEL_RE.test(raw)
  })
}

function relatedApparelMatch(labels, product) {
  if (!labelsSuggestApparel(labels)) return { score: 0, matched: false }

  const text = productText(product)
  const isFashion =
    product.category === "fashion" ||
    product.category === "beauty" ||
    hasAnyKeyword(text, FASHION_PRODUCT_KEYWORDS)

  if (!isFashion) return { score: 0, matched: false }

  return { score: 32, matched: true }
}

function directLabelTokenMatch(labels, product) {
  const text = productText(product)
  let score = 0
  let matched = false

  for (const label of labels.slice(0, 5)) {
    const prob = typeof label.probability === "number" ? label.probability : 0.5
    const parts = (label.className || String(label)).split(/[,;]/).map((s) => s.trim())

    for (const part of parts) {
      const tokens = normalize(part)
        .split(/\s+/)
        .filter((t) => t.length > 3 && t !== "suit" && t !== "product")

      for (const token of tokens) {
        if (hasWord(text, token)) {
          score += 30 * prob
          matched = true
        }
      }
    }
  }

  return { score, matched }
}

const MIN_SEMANTIC_SCORE = 24
const MAX_RESULTS = 12

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

function hasWord(text, word) {
  const w = normalize(word)
  if (!w) return false

  // Try exact word boundary match
  const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
  if (re.test(text)) return true

  // Try singular version if the query word ends in 's'
  if (w.endsWith("s") && w.length > 3) {
    const singular = w.slice(0, -1)
    const reSingular = new RegExp(`\\b${singular.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    if (reSingular.test(text)) return true
  }

  // Try plural version if the query word doesn't end in 's'
  if (!w.endsWith("s")) {
    const plural = `${w}s`
    const rePlural = new RegExp(`\\b${plural.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    if (rePlural.test(text)) return true
  }

  // Try substring checks on words inside the text to handle other suffixes
  const words = text.split(/\s+/)
  return words.some(wd => wd === w || wd.startsWith(w) || w.startsWith(wd))
}

function hasAnyKeyword(text, keywords) {
  return keywords.some((kw) => {
    const k = normalize(kw)
    if (!k) return false
    if (k.includes(" ")) return text.includes(k)
    return hasWord(text, k)
  })
}

function bucketPixel(r, g, b) {
  for (const [name, range] of Object.entries(COLOR_BUCKETS)) {
    if (
      r >= range.r[0] &&
      r <= range.r[1] &&
      g >= range.g[0] &&
      g <= range.g[1] &&
      b >= range.b[0] &&
      b <= range.b[1]
    ) {
      return name
    }
  }
  return null
}

export async function analyzeImageBuffer(buffer) {
  if (!buffer?.length) {
    return { colors: [], brightness: 0.5, width: 0, height: 0 }
  }

  const { data, info } = await sharp(buffer)
    .rotate()
    .resize(128, 128, { fit: "cover" })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const counts = {}
  let brightnessSum = 0
  const pixels = info.width * info.height

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    brightnessSum += (r + g + b) / (255 * 3)
    const bucket = bucketPixel(r, g, b)
    if (bucket) counts[bucket] = (counts[bucket] || 0) + 1
  }

  const colors = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color)

  return {
    colors,
    brightness: brightnessSum / Math.max(pixels, 1),
    width: info.width,
    height: info.height,
  }
}

export function parseVisualHints(hints = {}) {
  const labels = Array.isArray(hints.labels) ? hints.labels : []
  const clientColors = Array.isArray(hints.colors) ? hints.colors : []
  const intents = new Set(Array.isArray(hints.intents) ? hints.intents : [])
  const categories = new Set(Array.isArray(hints.categories) ? hints.categories : [])

  const intentScores = new Map()

  for (const label of labels) {
    const raw = label.className || String(label)
    const prob = typeof label.probability === "number" ? label.probability : 0.5
    const parts = raw.split(/[,;]/).map((s) => s.trim())
    for (const part of parts) {
      const text = normalize(part)
      if (!text || text === "product" || text.length < 3) continue
      for (const rule of LABEL_RULES) {
        if (rule.re.test(text)) {
          for (const intent of rule.intents) {
            intentScores.set(intent, Math.max(intentScores.get(intent) || 0, prob))
          }
          if (rule.category) categories.add(rule.category)
        }
      }
    }
  }

  // Prefer the strongest AI labels — avoid matching every product type at once.
  let rankedIntents = [...intentScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score >= 0.12)

  // MobileNet often returns swimwear / tops labels that miss strict gadget rules.
  if (rankedIntents.length === 0 && labelsSuggestApparel(labels)) {
    const topProb = labels[0]?.probability ?? 0.18
    intentScores.set("shirt", Math.max(intentScores.get("shirt") || 0, topProb))
    categories.add("fashion")
    rankedIntents = [...intentScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([, score]) => score >= 0.08)
  }

  intents.clear()
  if (rankedIntents.length > 0) {
    for (const [intent] of rankedIntents.slice(0, 2)) {
      intents.add(intent)
    }
  } else if (Array.isArray(hints.intents)) {
    hints.intents.slice(0, 2).forEach((i) => intents.add(i))
  }

  if (hints.category) categories.add(hints.category)

  return {
    labels,
    colors: clientColors,
    intents: [...intents],
    categories: [...categories],
  }
}

function intentTextMatch(intents, product) {
  const text = productText(product)
  let score = 0
  let matched = false

  for (const intent of intents) {
    const keywords = VISUAL_INTENT_KEYWORDS[intent] || PRODUCT_GROUPS[intent] || [intent]
    if (hasAnyKeyword(text, keywords)) {
      score += 45
      matched = true
    }
  }

  return { score, matched }
}

function categoryMatch(categories, product, hasIntentMatch) {
  if (!categories.length) return { score: 0, matched: false }
  if (!categories.includes(product.category)) return { score: 0, matched: false }
  // Category alone is weak; stronger when combined with intent
  return { score: hasIntentMatch ? 12 : 8, matched: true }
}

function colorTextMatch(productColors, product, hasIntentMatch) {
  if (!productColors.length) return { score: 0, matched: false }
  const text = productText(product)
  let score = 0
  let matched = false

  for (const color of productColors) {
    const aliases = TEXT_COLOR_ALIASES[color] || [color]
    if (aliases.some((a) => hasWord(text, a) || text.includes(a))) {
      score += hasIntentMatch ? 14 : 6
      matched = true
    }
  }

  return { score, matched }
}

function labelConfidenceBoost(labels, product) {
  const text = productText(product)
  let score = 0
  let matched = false

  for (const label of labels.slice(0, 5)) {
    const raw = label.className || String(label)
    const prob = typeof label.probability === "number" ? label.probability : 0.5
    const parts = raw.split(/[,;]/).map((s) => s.trim())

    for (const part of parts) {
      const normalizedPart = normalize(part)
      if (!normalizedPart || normalizedPart === "product" || normalizedPart.length < 3) continue

      for (const rule of LABEL_RULES) {
        if (!rule.re.test(part)) continue

        for (const intent of rule.intents) {
          const keywords = VISUAL_INTENT_KEYWORDS[intent] || PRODUCT_GROUPS[intent] || [intent]
          if (hasAnyKeyword(text, keywords)) {
            score += 38 * prob
            matched = true
          }
        }
      }
    }
  }

  return { score, matched }
}

function scoreProduct(product, analysis) {
  const allColors = [...new Set([...(analysis.imageColors || []), ...(analysis.colors || [])])]

  const intent = intentTextMatch(analysis.intents, product)
  const label = labelConfidenceBoost(analysis.labels, product)
  const direct = directLabelTokenMatch(analysis.labels, product)
  const apparel = relatedApparelMatch(analysis.labels, product)
  const hasCoreMatch = intent.matched || label.matched || direct.matched || apparel.matched

  const category = categoryMatch(analysis.categories, product, hasCoreMatch)
  const color = colorTextMatch(allColors, product, hasCoreMatch)

  const semanticScore =
    intent.score + label.score + direct.score + apparel.score + category.score + color.score
  const qualityBoost =
    Math.min(parseFloat(product.rating) || 0, 5) * 1.5 +
    Math.min((product.review_count || 0) / 20, 3)

  const totalScore = semanticScore + qualityBoost

  return {
    totalScore,
    semanticScore,
    hasCoreMatch: hasCoreMatch || (category.matched && semanticScore >= 20),
  }
}

function buildMatchReasons(product, analysis) {
  const reasons = []
  const text = productText(product)
  const allColors = [...new Set([...(analysis.imageColors || []), ...(analysis.colors || [])])]

  for (const intent of analysis.intents) {
    const keywords = VISUAL_INTENT_KEYWORDS[intent] || PRODUCT_GROUPS[intent] || [intent]
    if (hasAnyKeyword(text, keywords)) {
      reasons.push(`matches ${intent}`)
      break
    }
  }

  for (const label of analysis.labels.slice(0, 3)) {
    const raw = normalize(label.className || "")
    if (raw.length > 3 && raw !== "product" && hasAnyKeyword(text, raw.split(/[\s,]+/))) {
      reasons.push("visual similarity")
      break
    }
  }

  if (analysis.categories.includes(product.category) && reasons.length) {
    reasons.push("same category")
  }

  for (const color of allColors) {
    const aliases = TEXT_COLOR_ALIASES[color] || [color]
    if (aliases.some((a) => text.includes(a)) && reasons.length) {
      reasons.push(`${color} tone`)
      break
    }
  }

  return reasons.slice(0, 3)
}

function filterAndRankResults(scored, analysis) {
  const hasSignals =
    analysis.intents.length > 0 ||
    analysis.categories.length > 0 ||
    analysis.labels.some((l) => {
      const n = normalize(l.className || "")
      return n.length > 3 && n !== "product"
    })

  let filtered = scored.filter((r) => {
    if (r.semanticScore < MIN_SEMANTIC_SCORE) return false
    if (hasSignals && !r.hasCoreMatch) return false
    return true
  })

  if (filtered.length === 0) {
    filtered = scored
      .filter((r) => r.semanticScore >= 16 && r.hasCoreMatch)
      .sort((a, b) => b.score - a.score)
  }

  if (filtered.length === 0 && labelsSuggestApparel(analysis.labels)) {
    filtered = scored
      .filter((r) => {
        const text = productText(r.product)
        return (
          r.product.category === "fashion" ||
          hasAnyKeyword(text, FASHION_PRODUCT_KEYWORDS)
        )
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)

    if (filtered.length > 0) {
      return { results: filtered, isFallback: true }
    }
  }

  // Relaxed search fallback: return products that have any positive semantic score
  if (filtered.length === 0) {
    filtered = scored
      .filter((r) => r.semanticScore > 0)
      .sort((a, b) => b.score - a.score)
  }

  // Ultimate catalog fallback: return top rated products
  if (filtered.length === 0) {
    filtered = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
    if (filtered.length > 0) {
      return { results: filtered, isFallback: true }
    }
  }

  if (filtered.length === 0) {
    return { results: [], isFallback: true }
  }

  const maxSemantic = filtered[0]?.semanticScore || 0
  const cutoff = Math.max(MIN_SEMANTIC_SCORE * 0.45, maxSemantic * 0.45)

  filtered = filtered
    .filter((r) => r.semanticScore >= cutoff)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)

  return { results: filtered, isFallback: false }
}

export async function runVisualSearch(imageBuffer, hints = {}) {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .gt("stock", 0)
    .limit(200)

  if (error) throw new Error(error.message)
  const pool = products || []

  let scored = []
  let isFallback = false
  let geminiRanked = null

  // ENGINE A: Direct Visual Comparison using Gemini 2.5 Flash Vision
  if (imageBuffer) {
    try {
      console.log("Initiating Engine A: Direct Visual Comparison using Gemini 2.5 Flash Multimodal...")
      geminiRanked = await rankProductsWithGemini(imageBuffer, pool)
    } catch (err) {
      console.error("Gemini Visual Ranking failed, falling back to Engine B:", err.message)
    }
  }

  // If Gemini Visual comparison returned ranked items, map them and use them directly!
  if (Array.isArray(geminiRanked) && geminiRanked.length > 0) {
    console.log("Engine A succeeded! Ranking products directly from multimodal analysis.")
    scored = geminiRanked.map(item => {
      const product = pool.find(p => p.id === item.id)
      if (!product) return null
      
      const score = item.score || 50
      const semanticScore = score
      
      return {
        product,
        score,
        semanticScore,
        hasCoreMatch: true,
        matchReasons: Array.isArray(item.reasons) ? item.reasons : ["visual match"]
      }
    }).filter(Boolean)
    
    // Sort descending by score
    scored.sort((a, b) => b.score - a.score)
    
    // Build simulated analysis metadata for display
    const matchedCategories = [...new Set(scored.map(s => s.product.category))]
    const matchedIntents = [...new Set(geminiRanked.map(item => {
      const p = pool.find(prod => prod.id === item.id)
      return p ? p.title.toLowerCase().split(/\s+/)[0] : null
    }).filter(Boolean))]

    return {
      analysis: {
        detectedColors: [...new Set(scored.flatMap(s => s.matchReasons.filter(r => r.includes("color") || r.includes("tone") || r.includes("shade")).map(r => r.split(/\s+/)[0])))].slice(0, 3),
        detectedIntents: matchedIntents.slice(0, 2),
        detectedCategories: matchedCategories.slice(0, 2),
        topLabels: geminiRanked.slice(0, 5).map(r => {
          const p = pool.find(prod => prod.id === r.id)
          return { label: p ? p.title : "Similar Product", confidence: (r.score / 100) }
        }),
        brightness: 0.5,
      },
      results: scored.map(({ product, score, matchReasons }) => ({
        ...product,
        _visualMatch: { score, matchReasons, fallback: false },
      })),
      total: scored.length,
      fallback: false,
    }
  }

  // ENGINE B (Fallback): Existing Keyword/Color Match
  console.log("Using Fallback Engine B: Tag-based metadata matching...")
  const parsed = parseVisualHints(hints)
  const imageAnalysis = imageBuffer ? await analyzeImageBuffer(imageBuffer) : { colors: [] }

  // Analyze image using backend Gemini to get general tags as a secondary fallback
  if (imageBuffer) {
    try {
      const geminiAnalysis = await analyzeImageWithGemini(imageBuffer)
      if (geminiAnalysis) {
        if (geminiAnalysis.category && !parsed.categories.includes(geminiAnalysis.category)) {
          parsed.categories.push(geminiAnalysis.category)
        }
        if (geminiAnalysis.intent && !parsed.intents.includes(geminiAnalysis.intent)) {
          parsed.intents.push(geminiAnalysis.intent)
        }
        if (Array.isArray(geminiAnalysis.keywords)) {
          geminiAnalysis.keywords.forEach(kw => {
            if (!parsed.labels.some(l => (l.className || l).toLowerCase() === kw.toLowerCase())) {
              parsed.labels.push({ className: kw, probability: 0.95 })
            }
          })
        }
        if (Array.isArray(geminiAnalysis.colors)) {
          geminiAnalysis.colors.forEach(col => {
            if (!imageAnalysis.colors.includes(col)) {
              imageAnalysis.colors.push(col)
            }
          })
        }
      }
    } catch (err) {
      console.error("Gemini Visual Analysis failed:", err.message)
    }
  }

  const analysis = {
    ...parsed,
    imageColors: imageAnalysis.colors,
    brightness: imageAnalysis.brightness,
  }

  const scoredPool = pool.map((product) => {
    const { totalScore, semanticScore, hasCoreMatch } = scoreProduct(product, analysis)
    return {
      product,
      score: totalScore,
      semanticScore,
      hasCoreMatch,
      matchReasons: buildMatchReasons(product, analysis),
    }
  })

  const { results: filtered, isFallback: rankingIsFallback } = filterAndRankResults(scoredPool, analysis)

  return {
    analysis: {
      detectedColors: [...new Set([...analysis.colors, ...analysis.imageColors])],
      detectedIntents: analysis.intents,
      detectedCategories: analysis.categories,
      topLabels: analysis.labels.slice(0, 5).map((l) => ({
        label: l.className || String(l),
        confidence: l.probability ?? null,
      })),
      brightness: analysis.brightness,
    },
    results: filtered.map(({ product, score, matchReasons }) => ({
      ...product,
      _visualMatch: { score, matchReasons, fallback: rankingIsFallback },
    })),
    total: filtered.length,
    fallback: rankingIsFallback,
  }
}
