const STORAGE_KEY = "ub-recently-viewed"
const MAX_ITEMS = 12

export function trackRecentlyViewed(productId: string) {
  if (!productId) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    const next = [productId, ...list.filter((id) => id !== productId)].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function getRecentlyViewed(excludeId?: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: string[] = raw ? JSON.parse(raw) : []
    return excludeId ? list.filter((id) => id !== excludeId) : list
  } catch {
    return []
  }
}
