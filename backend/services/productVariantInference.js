/** Shared rules: infer size/color options from product title, category & description. */

export const COLOR_VOCAB = {
  black: "Black",
  white: "White",
  blue: "Blue",
  navy: "Navy",
  red: "Red",
  green: "Green",
  pink: "Pink",
  purple: "Purple",
  grey: "Grey",
  gray: "Grey",
  yellow: "Yellow",
  orange: "Orange",
  brown: "Brown",
  beige: "Beige",
  olive: "Olive",
  maroon: "Maroon",
  cream: "Cream",
  teal: "Teal",
  lime: "Lime",
  gold: "Gold",
  silver: "Silver",
  charcoal: "Charcoal",
}

const APPAREL_RE =
  /\b(shirt|tshirt|t-shirt|tee|top|crop\s*top|croptop|dress|hoodie|jacket|coat|blouse|polo|jersey|tunic|kurti|leggings|joggers|trouser|pants|jeans|skirt|sweater|cardigan|vest|camisole|bodysuit)\b/i

const SHOE_RE =
  /\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|slipper|slippers|footwear|trainer|trainers|running shoe)\b/i

const WATCH_RE = /\b(watch|smartwatch|smart watch|wristwatch)\b/i

const ACCESSORY_COLOR_ONLY_RE =
  /\b(backpack|bag|handbag|sunglasses|wallet|belt|scarf|cap|hat|purse|clutch|sling bag)\b/i

const NO_VARIANT_RE =
  /\b(pour.?over|ceramic set|coffee set|skincare set|skin care set|gift set|bundle set|starter kit|pour over set)\b/i

const ELECTRONICS_COLOR_RE =
  /\b(headphone|earbud|speaker|keyboard|mouse|laptop|phone|tablet|lamp|charger|cable|monitor|webcam)\b/i

const APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"]
const SHOE_SIZES = ["6 UK", "7 UK", "8 UK", "9 UK", "10 UK"]
const WATCH_BAND_SIZES = ["S", "M", "L"]

const DEFAULT_APPAREL_PALETTE = [
  ["black", "Black"],
  ["white", "White"],
  ["blue", "Blue"],
  ["navy", "Navy"],
  ["pink", "Pink"],
]

const DEFAULT_ELECTRONICS_PALETTE = [
  ["black", "Black"],
  ["white", "White"],
  ["silver", "Silver"],
]

const COLOR_HEX = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  blue: "#2563eb",
  navy: "#1e3a5f",
  red: "#dc2626",
  green: "#16a34a",
  pink: "#ec4899",
  purple: "#9333ea",
  grey: "#6b7280",
  gray: "#6b7280",
  yellow: "#eab308",
  orange: "#ea580c",
  brown: "#92400e",
  beige: "#d4b896",
  olive: "#556b2f",
  maroon: "#7f1d1d",
  cream: "#fef3c7",
  teal: "#0d9488",
  lime: "#84cc16",
  gold: "#ca8a04",
  silver: "#94a3b8",
  charcoal: "#374151",
  mint: "#6ee7b7",
  rose: "#fb7185",
}

function productText(product) {
  return `${product.title || ""} ${product.description || ""}`.toLowerCase()
}

export function extractColorsFromText(text) {
  const lower = String(text || "").toLowerCase()
  const found = []
  const seen = new Set()

  for (const [key, label] of Object.entries(COLOR_VOCAB)) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
    if (re.test(lower) && !seen.has(label)) {
      found.push([key, label])
      seen.add(label)
    }
  }
  return found
}

function buildPalette(extracted, defaults) {
  const palette = [...extracted]
  const used = new Set(palette.map(([id]) => id))
  for (const entry of defaults) {
    if (palette.length >= 5) break
    if (!used.has(entry[0])) {
      palette.push(entry)
      used.add(entry[0])
    }
  }
  return palette.slice(0, 5)
}

function buildColorOptions(product, palette, { priceVariance = false } = {}) {
  const basePrice = parseFloat(product.price) || 0
  const baseMrp = Math.round(basePrice * 1.28)
  const baseStock = Math.max(parseInt(product.stock, 10) || 0, 0)
  const image = product.image_url || ""
  const perStock = Math.max(1, Math.floor(baseStock / Math.max(palette.length, 1)))

  return palette.map(([id, name], index) => {
    const priceOffset = priceVariance ? (index % 3) * 100 - 100 : 0
    const price = Math.max(1, basePrice + priceOffset)
    const mrp = Math.max(price + 1, baseMrp + (priceVariance ? index * 50 : 0))
    return {
      id,
      name,
      image_url: image,
      hex: COLOR_HEX[id] || COLOR_HEX[id.split(/[-_/]/)[0]] || undefined,
      price,
      mrp: mrp > price ? mrp : undefined,
      stock: perStock,
    }
  })
}

function apparelConfig(product) {
  const text = productText(product)
  const extracted = extractColorsFromText(text)
  const palette = buildPalette(extracted, DEFAULT_APPAREL_PALETTE)

  return {
    has_sizes: true,
    sizes: APPAREL_SIZES,
    size_chart: true,
    color_display: "strip",
    colors: buildColorOptions(product, palette),
  }
}

function shoeConfig(product) {
  const text = productText(product)
  const extracted = extractColorsFromText(text)
  const palette = buildPalette(extracted, [
    ["black", "Black"],
    ["white", "White"],
    ["blue", "Blue/Navy"],
    ["red", "Red/White"],
    ["green", "Green"],
  ])

  return {
    has_sizes: true,
    sizes: SHOE_SIZES,
    size_chart: true,
    color_display: "grid",
    colors: buildColorOptions(product, palette, { priceVariance: true }),
  }
}

function watchConfig(product) {
  const text = productText(product)
  const extracted = extractColorsFromText(text)
  const palette = buildPalette(extracted, [
    ["black", "Midnight Black"],
    ["silver", "Silver"],
    ["gold", "Gold"],
  ])

  return {
    has_sizes: true,
    sizes: WATCH_BAND_SIZES,
    size_chart: true,
    color_display: "strip",
    colors: buildColorOptions(product, palette),
  }
}

function colorOnlyConfig(product, defaults = DEFAULT_ELECTRONICS_PALETTE) {
  const text = productText(product)
  const extracted = extractColorsFromText(text)
  const palette = buildPalette(extracted, defaults)

  return {
    has_sizes: false,
    color_display: "strip",
    colors: buildColorOptions(product, palette),
  }
}

/**
 * @param {object} product
 * @returns {object|null}
 */
export function inferVariantsFromProduct(product) {
  if (!product?.title) return null

  const text = productText(product)
  const category = String(product.category || "").toLowerCase()

  if (NO_VARIANT_RE.test(text)) return null

  if (SHOE_RE.test(text)) return shoeConfig(product)

  if (WATCH_RE.test(text)) return watchConfig(product)

  if (ACCESSORY_COLOR_ONLY_RE.test(text)) {
    return colorOnlyConfig(product, [
      ["black", "Black"],
      ["brown", "Brown"],
      ["navy", "Navy"],
      ["olive", "Olive"],
    ])
  }

  const isApparel =
    category === "fashion" ||
    APPAREL_RE.test(text) ||
    (category === "sports" && /\b(jersey|shorts|track|activewear|leggings)\b/i.test(text))

  if (isApparel && !ACCESSORY_COLOR_ONLY_RE.test(text)) {
    return apparelConfig(product)
  }

  if (category === "electronics" || ELECTRONICS_COLOR_RE.test(text)) {
    return colorOnlyConfig(product)
  }

  if (category === "sports" && /\b(yoga mat|mat|dumbbell|resistance band)\b/i.test(text)) {
    return colorOnlyConfig(product, [
      ["purple", "Purple"],
      ["black", "Black"],
      ["teal", "Teal"],
    ])
  }

  if (category === "home" && /\b(lamp|cushion|bedsheet|curtain|vase)\b/i.test(text)) {
    return colorOnlyConfig(product, [
      ["white", "White"],
      ["black", "Black"],
      ["gold", "Rose Gold"],
    ])
  }

  return null
}
