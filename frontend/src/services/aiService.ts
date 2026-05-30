import { apiPost } from "./api"

export interface AIChatResponse {
  text: string
  recommendedProducts?: any[]
}

export interface AISellerResponse {
  title: string
  description: string
  highlights: string[]
  tags: string[]
}

export interface AIChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function chatWithAI(query: string, history: AIChatMessage[]): Promise<AIChatResponse> {
  return apiPost<AIChatResponse>("/ai/chat", { query, history })
}

export async function generateProductListing(keywords: string): Promise<AISellerResponse> {
  return apiPost<AISellerResponse>("/ai/product-description", { keywords })
}

export interface VoiceSearchParsed {
  search: string
  intent?: string | null
  category?: string | null
  keywords?: string[]
  features?: string[]
  color?: string | null
  brand?: string | null
  maxPrice?: number | null
  minPrice?: number | null
  minRating?: number | null
  sort?: string
  dealsOnly?: boolean
}

export interface VoiceSearchResponse {
  query: string
  interpretation: string
  suggestions: string[]
  parsed: VoiceSearchParsed
  searchParams: string
  path: string
  aiPowered: boolean
  fallback: boolean
  fastPath?: boolean
}

export async function voiceSearchWithAI(
  query: string,
  signal?: AbortSignal
): Promise<VoiceSearchResponse> {
  return apiPost<VoiceSearchResponse>("/ai/voice-search", { query }, { signal })
}
