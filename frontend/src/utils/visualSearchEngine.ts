import * as tf from "@tensorflow/tfjs-core"
import "@tensorflow/tfjs-backend-webgl"
import "@tensorflow/tfjs-backend-cpu"
import * as mobilenet from "@tensorflow-models/mobilenet"
import type { Product } from "@/services/productService"
import {
  colorSimilarity,
  compressImageFile,
  extractDominantColors,
  type DominantColor,
} from "./imageSimilarity"
import { visualSearchApi, type VisualSearchResponse } from "@/services/visualSearchService"
import { addVisualSearchHistory } from "@/utils/visualSearchHistory"

export interface VisualAnalysisHints {
  labels: Array<{ className: string; probability: number }>
  colors: DominantColor[]
  intents: string[]
  categories: string[]
  brightness: number
}

let backendPromise: Promise<void> | null = null
let modelPromise: ReturnType<typeof mobilenet.load> | null = null

async function ensureTfBackend() {
  if (!backendPromise) {
    backendPromise = (async () => {
      try {
        await tf.setBackend("webgl")
        await tf.ready()
      } catch {
        await tf.setBackend("cpu")
        await tf.ready()
      }
    })()
  }
  await backendPromise
}

async function getModel() {
  await ensureTfBackend()
  if (!modelPromise) {
    modelPromise = mobilenet.load({ version: 2, alpha: 0.5 })
  }
  return modelPromise
}

const LABEL_TO_INTENTS: Array<{ re: RegExp; intents: string[]; category: string }> = [
  { re: /\b(shoe|sneaker|boot|sandal|slipper|trainer|footwear)\b/i, intents: ["shoes"], category: "fashion" },
  { re: /\b(headphone|earphone|headset|earbud|earbuds)\b/i, intents: ["headphones"], category: "electronics" },
  { re: /\b(laptop|notebook|macbook)\b/i, intents: ["laptop"], category: "electronics" },
  { re: /\b(keyboard|mechanical keyboard|gaming keyboard)\b/i, intents: ["keyboard"], category: "electronics" },
  { re: /\b(mouse|gaming mouse)\b/i, intents: ["mouse"], category: "electronics" },
  { re: /\b(smartphone|iphone|mobile phone|cellular phone)\b/i, intents: ["phone"], category: "electronics" },
  { re: /\b(smartwatch|wristwatch|digital watch)\b/i, intents: ["watch"], category: "electronics" },
  { re: /\b(backpack|handbag|purse|suitcase|rucksack)\b/i, intents: ["bag"], category: "fashion" },
  { re: /\b(shirt|jersey|tee|blouse|dress|coat|jacket|sweater|hoodie)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(bra|brassiere|bandeau|bikini|camisole|crop top|crop|tank top|bodysuit|leotard|tunic|vest)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(maillot|tank suit|swimsuit|swimwear|bathing suit|one piece|two piece)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(miniskirt|minidress|garment|apparel|clothing|wardrobe)\b/i, intents: ["shirt"], category: "fashion" },
  { re: /\b(sunglass|eyewear|goggles|shades)\b/i, intents: ["sunglasses"], category: "fashion" },
  { re: /\b(lamp|desk lamp|lighting)\b/i, intents: ["lamp"], category: "home" },
  { re: /\b(coffee mug|coffee cup|pour over)\b/i, intents: ["coffee"], category: "home" },
  { re: /\b(yoga mat|exercise mat|dumbbell)\b/i, intents: ["yoga"], category: "sports" },
  { re: /\b(lipstick|cosmetic|perfume|skincare|lotion)\b/i, intents: ["shirt"], category: "beauty" },
  { re: /\b(speaker|soundbar|microphone)\b/i, intents: ["speaker", "headphones"], category: "electronics" },
]

const APPAREL_LABEL_RE =
  /\b(bra|brassiere|bandeau|bikini|camisole|crop|tank|maillot|swimsuit|swimwear|leotard|bodysuit|blouse|minidress|garment|apparel|clothing|top|tee|jersey|vest|tunic)\b/i

function mapLabelsToHints(labels: Array<{ className: string; probability: number }>) {
  const categories = new Set<string>()
  const intentScores = new Map<string, number>()

  for (const label of labels) {
    const parts = label.className.split(/[,;]/).map((s) => s.trim())
    for (const part of parts) {
      if (!part || part.length < 3) continue
      for (const rule of LABEL_TO_INTENTS) {
        if (rule.re.test(part)) {
          for (const intent of rule.intents) {
            intentScores.set(intent, Math.max(intentScores.get(intent) || 0, label.probability))
          }
          categories.add(rule.category)
        }
      }
    }
  }

  if (intentScores.size === 0 && labels.some((l) => APPAREL_LABEL_RE.test(l.className))) {
    const topProb = labels[0]?.probability ?? 0.18
    intentScores.set("shirt", topProb)
    categories.add("fashion")
  }

  const intents = [...intentScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score >= 0.12)
    .slice(0, 2)
    .map(([intent]) => intent)

  return {
    intents,
    categories: [...categories],
  }
}

function fallbackHints(colorSample: Awaited<ReturnType<typeof extractDominantColors>>): VisualAnalysisHints {
  return {
    labels: [],
    colors: colorSample.colors,
    intents: [],
    categories: [],
    brightness: colorSample.brightness,
  }
}

export async function analyzeImageWithAI(file: File): Promise<VisualAnalysisHints> {
  const compressed = await compressImageFile(file)
  const colorSample = await extractDominantColors(compressed)

  try {
    const model = await getModel()

    const img = document.createElement("img")
    img.src = URL.createObjectURL(compressed)
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Failed to load image for AI analysis"))
    })

    const predictions = await model.classify(img)
    URL.revokeObjectURL(img.src)

    const labels = predictions.map((p) => ({
      className: p.className,
      probability: p.probability,
    }))

    const mapped = mapLabelsToHints(labels)

    return {
      labels,
      colors: colorSample.colors,
      intents: mapped.intents,
      categories: mapped.categories,
      brightness: colorSample.brightness,
    }
  } catch (err) {
    console.warn("MobileNet unavailable, using server-side visual matching:", err)
    return fallbackHints(colorSample)
  }
}

export interface VisualSearchRunResult extends VisualSearchResponse {
  previewUrl: string
  hints: VisualAnalysisHints
}

export async function runVisualSearch(file: File): Promise<VisualSearchRunResult> {
  const compressed = await compressImageFile(file)
  const hints = await analyzeImageWithAI(compressed)
  const previewUrl = URL.createObjectURL(compressed)

  const response = await visualSearchApi(compressed, {
    labels: hints.labels,
    colors: hints.colors,
    intents: hints.intents,
    categories: hints.categories,
  })

  addVisualSearchHistory({
    id: `${Date.now()}`,
    previewUrl,
    topLabel: hints.labels[0]?.className || "Visual search",
    resultCount: response.results.length,
    at: new Date().toISOString(),
  })

  return { ...response, previewUrl, hints }
}

export function refineVisualResults(
  products: Array<Product & { _visualMatch?: { score: number } }>,
  queryColors: string[]
) {
  return [...products]
    .map((p) => ({
      ...p,
      _visualMatch: {
        ...p._visualMatch,
        score: (p._visualMatch?.score || 0) + colorSimilarity(queryColors, []),
      },
    }))
    .sort((a, b) => (b._visualMatch?.score || 0) - (a._visualMatch?.score || 0))
}
