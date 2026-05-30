import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { inferVariantsFromProduct } from "./productVariantInference.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VARIANTS_PATH = path.join(__dirname, "../data/product-variants.json")

let variantCache = null

function loadVariants() {
  if (variantCache) return variantCache
  try {
    const raw = fs.readFileSync(VARIANTS_PATH, "utf8")
    variantCache = JSON.parse(raw)
  } catch {
    variantCache = {}
  }
  return variantCache
}

export function titleToVariantKey(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function getVariantsForProduct(product) {
  if (!product?.title) return null

  const key = titleToVariantKey(product.title)
  const explicit = loadVariants()[key]
  if (explicit) return explicit

  return inferVariantsFromProduct(product)
}

export function attachVariantsToProduct(product) {
  if (!product) return product
  const variants = getVariantsForProduct(product)
  if (!variants) return product
  return { ...product, variants }
}

export function attachVariantsToProducts(products) {
  return (products || []).map(attachVariantsToProduct)
}

export { inferVariantsFromProduct }
