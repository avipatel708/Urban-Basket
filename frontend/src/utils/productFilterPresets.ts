export type ProductFilterPreset = {
  value: string
  label: string
  sort?: string
  maxPrice?: number
  minPrice?: number
  minRating?: number
  deals?: boolean
}

export type ProductFilterGroup = {
  title: string
  options: ProductFilterPreset[]
}

export const PRODUCT_FILTER_GROUPS: ProductFilterGroup[] = [
  {
    title: "Sort by",
    options: [
      { value: "newest", label: "Newest First", sort: "newest" },
      { value: "price_asc", label: "Price: Low to High", sort: "price_asc" },
      { value: "price_desc", label: "Price: High to Low", sort: "price_desc" },
      { value: "rating", label: "Top Rated", sort: "rating" },
      { value: "popular", label: "Most Popular", sort: "popular" },
    ],
  },
  {
    title: "Price",
    options: [
      { value: "under_500", label: "Under ₹500", maxPrice: 500, sort: "price_asc" },
      { value: "under_1000", label: "Under ₹1,000", maxPrice: 1000, sort: "price_asc" },
      { value: "under_2000", label: "Under ₹2,000", maxPrice: 2000, sort: "price_asc" },
      { value: "under_5000", label: "Under ₹5,000", maxPrice: 5000, sort: "price_asc" },
      { value: "range_1000_5000", label: "₹1,000 – ₹5,000", minPrice: 1000, maxPrice: 5000, sort: "price_asc" },
      { value: "above_5000", label: "Above ₹5,000", minPrice: 5000, sort: "price_desc" },
    ],
  },
  {
    title: "Offers & quality",
    options: [
      { value: "rating_4", label: "4★ & above", minRating: 4, sort: "rating" },
      { value: "deals", label: "Discount", deals: true, sort: "popular" },
    ],
  },
]

const ALL_PRESETS = PRODUCT_FILTER_GROUPS.flatMap((g) => g.options)

export function getProductFilterLabel(value: string): string {
  return ALL_PRESETS.find((p) => p.value === value)?.label ?? "Newest First"
}

export function getActiveProductFilterKey(searchParams: URLSearchParams): string {
  if (searchParams.get("deals") === "true") return "deals"

  const minRating = searchParams.get("minRating")
  if (minRating === "4") return "rating_4"

  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")

  if (minPrice === "1000" && maxPrice === "5000") return "range_1000_5000"
  if (minPrice === "5000" && !maxPrice) return "above_5000"
  if (maxPrice === "500" && !minPrice) return "under_500"
  if (maxPrice === "1000" && !minPrice) return "under_1000"
  if (maxPrice === "2000" && !minPrice) return "under_2000"
  if (maxPrice === "5000" && !minPrice) return "under_5000"

  const sort = searchParams.get("sort") || "newest"
  const known = ALL_PRESETS.some((p) => p.value === sort)
  if (known && !minPrice && !maxPrice && !minRating) {
    return sort === "newest" ? "newest" : sort
  }

  return "newest"
}

export function applyProductFilterPreset(
  prev: URLSearchParams,
  preset: ProductFilterPreset
): URLSearchParams {
  prev.delete("sort")
  prev.delete("minPrice")
  prev.delete("maxPrice")
  prev.delete("minRating")
  prev.delete("deals")

  const sort = preset.sort ?? "newest"
  if (sort !== "newest") prev.set("sort", sort)

  if (preset.maxPrice != null) prev.set("maxPrice", String(preset.maxPrice))
  if (preset.minPrice != null) prev.set("minPrice", String(preset.minPrice))
  if (preset.minRating != null) prev.set("minRating", String(preset.minRating))
  if (preset.deals) prev.set("deals", "true")

  return prev
}

export function findProductFilterPreset(value: string): ProductFilterPreset | undefined {
  return ALL_PRESETS.find((p) => p.value === value)
}
