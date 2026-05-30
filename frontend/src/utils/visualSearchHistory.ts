import type { VisualSearchResponse } from "@/services/visualSearchService"

const STORAGE_KEY = "ub-visual-search-history"
const MAX = 8

export interface VisualSearchHistoryEntry {
  id: string
  previewUrl: string
  topLabel: string
  resultCount: number
  at: string
}

export interface VisualSearchSession {
  previewUrl: string
  analysis: VisualSearchResponse["analysis"]
  results: VisualSearchResponse["results"]
  fallback: boolean
}

export const VISUAL_SEARCH_SESSION_KEY = "ub-visual-search-session"

export function addVisualSearchHistory(entry: VisualSearchHistoryEntry) {
  try {
    const list = getVisualSearchHistory().filter((e) => e.id !== entry.id)
    list.unshift(stripBlobForStorage(entry))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* ignore */
  }
}

function stripBlobForStorage(entry: VisualSearchHistoryEntry): VisualSearchHistoryEntry {
  return { ...entry, previewUrl: entry.previewUrl.startsWith("blob:") ? "" : entry.previewUrl }
}

export function getVisualSearchHistory(): VisualSearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearVisualSearchHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

export function saveVisualSearchSession(session: VisualSearchSession) {
  sessionStorage.setItem(VISUAL_SEARCH_SESSION_KEY, JSON.stringify(session))
}

export function loadVisualSearchSession(): VisualSearchSession | null {
  try {
    const raw = sessionStorage.getItem(VISUAL_SEARCH_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearVisualSearchSession() {
  sessionStorage.removeItem(VISUAL_SEARCH_SESSION_KEY)
}
