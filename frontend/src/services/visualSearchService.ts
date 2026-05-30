import { getToken } from "./api"
import type { Product } from "./productService"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export interface VisualSearchHintsPayload {
  labels?: Array<{ className: string; probability: number }>
  colors?: string[]
  intents?: string[]
  categories?: string[]
  category?: string
}

export interface VisualSearchResponse {
  analysis: {
    detectedColors: string[]
    detectedIntents: string[]
    detectedCategories: string[]
    topLabels: Array<{ label: string; confidence: number | null }>
    brightness: number
  }
  results: Array<
    Product & {
      _visualMatch?: { score: number; matchReasons: string[]; fallback?: boolean }
    }
  >
  total: number
  fallback: boolean
}

export async function visualSearchApi(file: File | Blob, hints: VisualSearchHintsPayload) {
  const form = new FormData()
  form.append("image", file, "visual-search.jpg")
  form.append("hints", JSON.stringify(hints))

  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}/products/visual-search`, {
    method: "POST",
    headers,
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || "Visual search failed")
  }

  return res.json() as Promise<VisualSearchResponse>
}
