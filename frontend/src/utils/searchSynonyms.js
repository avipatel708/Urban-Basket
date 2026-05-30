/**
 * Semantic product groups & synonyms for intelligent voice/text search.
 * Any term in a group can match products related to that intent.
 */

export const PRODUCT_SEMANTIC_GROUPS = {
  headphones: [
    "headphone", "headphones", "headset", "headsets", "earbud", "earbuds",
    "earphone", "earphones", "earpods", "airpods", "headphone",
    "bluetooth headset", "gaming headset", "wireless headset",
  ],
  laptop: [
    "laptop", "laptops", "notebook", "notebooks", "macbook", "chromebook",
    "ultrabook", "gaming laptop",
  ],
  phone: [
    "phone", "phones", "smartphone", "smartphones", "iphone", "mobile",
    "cellphone", "android phone",
  ],
  watch: [
    "watch", "watches", "smartwatch", "smartwatches", "fitness watch",
    "fitness band", "smart band",
  ],
  shoes: [
    "shoe", "shoes", "sneaker", "sneakers", "footwear", "running shoes",
    "trainers", "loafers",
  ],
  keyboard: ["keyboard", "keyboards", "mechanical keyboard", "gaming keyboard"],
  mouse: ["mouse", "mice", "gaming mouse", "wireless mouse"],
  speaker: ["speaker", "speakers", "soundbar", "bluetooth speaker"],
  monitor: ["monitor", "monitors", "display", "screen", "4k monitor"],
  camera: ["camera", "cameras", "webcam"],
  bag: ["bag", "bags", "backpack", "backpacks", "handbag"],
  lamp: ["lamp", "lamps", "light", "lighting", "desk lamp"],
  sunglasses: ["sunglasses", "shades", "glasses", "eyewear"],
  skincare: ["skincare", "skin care", "beauty", "cosmetic", "moisturizer"],
  yoga: ["yoga", "mat", "yoga mat", "fitness mat"],
  coffee: ["coffee", "brew", "pour over", "espresso"],
  shirt: ["shirt", "tshirt", "t-shirt", "tee", "top", "crop top"],
}

export const FEATURE_SYNONYMS = {
  wireless: ["wireless", "bluetooth", "bt", "cordless", "true wireless", "tws"],
  "noise cancellation": [
    "noise cancellation", "noise cancelling", "noise canceling",
    "noise-canceling", "noise-cancelling", "anc", "active noise",
  ],
  gaming: ["gaming", "gamer", "esports", "game", "rgb"],
  waterproof: ["waterproof", "water resistant", "water-resistant", "ipx7", "ipx8"],
  rgb: ["rgb", "led", "per-key", "backlit", "illuminated"],
  rtx: ["rtx", "ray tracing", "ray-tracing", "geforce", "dedicated graphics", "graphics card"],
  premium: ["premium", "luxury", "high-end", "high end", "flagship", "pro"],
  fitness: ["fitness", "health", "workout", "gym", "sport", "sports"],
  stylish: ["stylish", "designer", "fashion", "trendy", "premium"],
  smart: ["smart", "intelligent", "connected", "ai"],
  organic: ["organic", "natural", "botanical", "cruelty-free"],
  polarized: ["polarized", "uv400", "uv protection"],
  mechanical: ["mechanical", "hot-swappable", "gasket"],
  portable: ["portable", "compact", "travel"],
}

export const COLOR_SYNONYMS = {
  black: ["black", "obsidian", "dark", "midnight", "charcoal"],
  white: ["white", "pearl", "ivory", "snow"],
  red: ["red", "crimson", "maroon"],
  blue: ["blue", "navy", "azure"],
  green: ["green", "olive", "mint"],
  silver: ["silver", "chrome", "metallic", "titanium"],
  gold: ["gold", "golden"],
}

export const INTENT_KEYWORDS = {
  cheap: { sort: "price_asc", maxPriceBoost: 500 },
  budget: { sort: "price_asc", maxPriceBoost: 800 },
  affordable: { sort: "price_asc", maxPriceBoost: 1000 },
  best: { sort: "rating" },
  premium: { sort: "price_desc" },
  latest: { sort: "newest" },
  new: { sort: "newest" },
}

/**
 * Find semantic group id for a term.
 * @param {string} term
 * @returns {string|null}
 */
export function findSemanticGroup(term) {
  const t = term.toLowerCase().trim()
  for (const [groupId, terms] of Object.entries(PRODUCT_SEMANTIC_GROUPS)) {
    if (terms.some((alias) => t === alias || t.includes(alias) || alias.includes(t))) {
      return groupId
    }
  }
  return null
}

/**
 * Expand terms to all synonyms in their semantic groups.
 * @param {string[]} terms
 * @returns {string[]}
 */
export function expandSemanticTerms(terms) {
  const expanded = new Set()
  for (const term of terms) {
    const t = term.toLowerCase().trim()
    if (!t) continue
    expanded.add(t)
    const groupId = findSemanticGroup(t)
    if (groupId) {
      PRODUCT_SEMANTIC_GROUPS[groupId].forEach((a) => expanded.add(a))
    }
  }
  return [...expanded]
}

/**
 * Expand feature phrase to synonym list.
 * @param {string} feature
 * @returns {string[]}
 */
export function expandFeatureTerms(feature) {
  const f = feature.toLowerCase().trim()
  for (const [key, aliases] of Object.entries(FEATURE_SYNONYMS)) {
    if (f === key || aliases.some((a) => f.includes(a) || a.includes(f))) {
      return [key, ...aliases]
    }
  }
  return [f]
}

/**
 * Expand color to description variants.
 * @param {string} color
 * @returns {string[]}
 */
export function expandColorTerms(color) {
  const c = color.toLowerCase().trim()
  return COLOR_SYNONYMS[c] || [c]
}
