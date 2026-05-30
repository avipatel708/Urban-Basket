const STORAGE_KEY = "ub-search-recent"
const MAX_ITEMS = 8

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : []
  } catch {
    return []
  }
}

export function addRecentSearch(query: string) {
  const q = query.trim()
  if (!q || typeof window === "undefined") return
  const prev = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase())
  const next = [q, ...prev].slice(0, MAX_ITEMS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function clearRecentSearches() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
