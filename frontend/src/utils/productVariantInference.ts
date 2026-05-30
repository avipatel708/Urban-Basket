import type { Product, ProductVariantConfig } from "@/services/productService"
import { COLOR_HEX } from "@/utils/colorTokens"

/** Client-side fallback when API has not attached variants yet. */

const COLOR_VOCAB: Record<string, string> = {
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

function productText(product: Pick<Product, "title" | "description" | "category">) {
  return `${product.title || ""} ${product.description || ""}`.toLowerCase()
}

function extractColorsFromText(text: string) {
  const lower = text.toLowerCase()
  const found: [string, string][] = []
  const seen = new Set<string>()

  for (const [key, label] of Object.entries(COLOR_VOCAB)) {
    const re = new RegExp(`\\b${key}\\b`, "i")
    if (re.test(lower) && !seen.has(label)) {
      found.push([key, label])
      seen.add(label)
    }
  }
  return found
}

function buildPalette(extracted: [string, string][], defaults: [string, string][]) {
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

function buildColorOptions(
  product: Pick<Product, "price" | "stock" | "image_url">,
  palette: [string, string][],
  priceVariance = false
) {
  const basePrice = Number(product.price) || 0
  const baseMrp = Math.round(basePrice * 1.28)
  const baseStock = Math.max(Number(product.stock) || 0, 0)
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

export function inferVariantsFromProduct(product: Product): ProductVariantConfig | null {
  if (!product?.title) return null

  const text = productText(product)
  const category = String(product.category || "").toLowerCase()

  if (NO_VARIANT_RE.test(text)) return null
  if (SHOE_RE.test(text)) {
    const palette = buildPalette(extractColorsFromText(text), [
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
      colors: buildColorOptions(product, palette, true),
    }
  }

  if (WATCH_RE.test(text)) {
    const palette = buildPalette(extractColorsFromText(text), [
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

  if (ACCESSORY_COLOR_ONLY_RE.test(text)) {
    const palette = buildPalette(extractColorsFromText(text), [
      ["black", "Black"],
      ["brown", "Brown"],
      ["navy", "Navy"],
      ["olive", "Olive"],
    ])
    return {
      has_sizes: false,
      color_display: "strip",
      colors: buildColorOptions(product, palette),
    }
  }

  const isApparel =
    category === "fashion" ||
    APPAREL_RE.test(text) ||
    (category === "sports" && /\b(jersey|shorts|track|activewear|leggings)\b/i.test(text))

  if (isApparel && !ACCESSORY_COLOR_ONLY_RE.test(text)) {
    const palette = buildPalette(extractColorsFromText(text), [
      ["black", "Black"],
      ["white", "White"],
      ["blue", "Blue"],
      ["navy", "Navy"],
      ["pink", "Pink"],
    ])
    return {
      has_sizes: true,
      sizes: APPAREL_SIZES,
      size_chart: true,
      color_display: "strip",
      colors: buildColorOptions(product, palette),
    }
  }

  if (category === "electronics" || ELECTRONICS_COLOR_RE.test(text)) {
    const palette = buildPalette(extractColorsFromText(text), [
      ["black", "Black"],
      ["white", "White"],
      ["silver", "Silver"],
    ])
    return {
      has_sizes: false,
      color_display: "strip",
      colors: buildColorOptions(product, palette),
    }
  }

  if (category === "sports" && /\b(yoga mat|mat|dumbbell|resistance band)\b/i.test(text)) {
    const palette = buildPalette(extractColorsFromText(text), [
      ["purple", "Purple"],
      ["black", "Black"],
      ["teal", "Teal"],
    ])
    return {
      has_sizes: false,
      color_display: "strip",
      colors: buildColorOptions(product, palette),
    }
  }

  return null
}

export function resolveProductVariants(product: Product | null): ProductVariantConfig | null {
  if (!product) return null
  const raw = product.variants?.colors?.length ? product.variants : inferVariantsFromProduct(product)
  if (!raw?.colors?.length) return raw
  return {
    ...raw,
    colors: raw.colors.map((c) => ({
      ...c,
      hex: c.hex || COLOR_HEX[c.id] || COLOR_HEX[c.id.split(/[-_/]/)[0]] || undefined,
    })),
  }
}
