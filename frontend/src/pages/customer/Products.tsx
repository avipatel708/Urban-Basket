import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router"
import { motion } from "motion/react"
import { Search, SlidersHorizontal } from "lucide-react"
import { ProductCard } from "@/components/product/ProductCard"
import { VoiceSearchButton } from "@/components/VoiceSearchButton"
import { ProductGridSkeleton } from "@/components/common/LoadingSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import { ProductFilterSheet } from "@/components/product/ProductFilterSheet"
import { useProductCacheStore } from "@/store/productCacheStore"
import type { Product } from "@/services/productService"
import { CATEGORIES } from "@/utils/constants"
import {
  findProductFilterPreset,
  getActiveProductFilterKey,
  applyProductFilterPreset,
} from "@/utils/productFilterPresets"
import { buildProductQueryFromUrl, executeVoiceSearch } from "@/utils/applyVoiceSearch"
import {
  filterAndRankProducts,
  filtersFromSearchParams,
  isSmartSearchParams,
} from "@/utils/smartProductFilter"
import { toast } from "sonner"

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlSearch = searchParams.get("search") || ""
  const urlCategory = searchParams.get("category") || "all"

  const [search, setSearch] = useState(urlSearch)
  const [category, setCategory] = useState(urlCategory)
  const [filterKey, setFilterKey] = useState(() => getActiveProductFilterKey(searchParams))

  const { products: cachedProducts, fetchProducts, loading: cacheLoading } = useProductCacheStore()

  useEffect(() => {
    fetchProducts().catch(() => {
      toast.error("Failed to load products from database.")
    })
  }, [fetchProducts])

  useEffect(() => {
    const { category: cat, search: q } = buildProductQueryFromUrl(searchParams)
    setSearch(q)
    setCategory(cat)
    setFilterKey(getActiveProductFilterKey(searchParams))
  }, [searchParams])

  const filters = useMemo(() => {
    const f = filtersFromSearchParams(searchParams)
    if (!f.category || f.category === "all") f.category = null
    f.smart = isSmartSearchParams(searchParams)
    return f
  }, [searchParams])

  const filteredProducts = useMemo(() => {
    if (!cachedProducts.length) return []
    return filterAndRankProducts(cachedProducts, filters)
  }, [cachedProducts, filters])

  const loading = cacheLoading && cachedProducts.length === 0

  const handleCategorySelect = useCallback(
    (catId: string) => {
      setCategory(catId)
      setSearchParams((prev) => {
        if (catId === "all") prev.delete("category")
        else prev.set("category", catId)
        return prev
      })
    },
    [setSearchParams]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setSearch(val)
      setSearchParams((prev) => {
        if (!val.trim()) {
          prev.delete("search")
          prev.delete("smart")
          prev.delete("intent")
          prev.delete("terms")
          prev.delete("keywords")
        } else {
          prev.set("search", val.trim())
          prev.delete("smart")
        }
        return prev
      })
    },
    [setSearchParams]
  )

  const handleVoiceSearch = useCallback(
    async (transcript: string) => {
      const text = transcript.trim()
      if (!text) return
      try {
        const { parsed, params, label } = await executeVoiceSearch(text)
        setSearch(parsed.searchText || text)
        if (parsed.category) setCategory(parsed.category)
        else setCategory("all")
        setFilterKey(getActiveProductFilterKey(params))
        setSearchParams(params)
        toast.success(label, { duration: 2500 })
      } catch {
        setSearch(text)
        setSearchParams(new URLSearchParams({ search: text, smart: "true" }))
        toast.success(`Searching for "${text}"`, { duration: 2200 })
      }
    },
    [setSearchParams]
  )

  const resetFilters = useCallback(() => {
    setSearch("")
    setCategory("all")
    setFilterKey("newest")
    setSearchParams({})
  }, [setSearchParams])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-surface-50">
            Curated <span className="gradient-text">Catalogue</span>
          </h1>
          <p className="text-xs text-surface-400 font-sans mt-1 leading-relaxed">
            Find the finest gadgets and apparel, integrated with future aesthetics.
          </p>
        </div>

        {/* Search controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search catalogue..."
              value={search}
              onChange={handleSearchChange}
              className="w-full h-10 glass-light border border-surface-800/50 rounded-xl py-2 pl-11 pr-11 text-sm font-sans focus:outline-none focus:border-primary-500 text-surface-200"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
              <VoiceSearchButton
                onTranscript={handleVoiceSearch}
                className="h-8 w-8"
                silent
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills (horizontal scrollable) */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        <div className="flex items-center gap-2.5 min-w-max">
          <button
            onClick={() => handleCategorySelect("all")}
            className={`px-5 py-2 rounded-full text-xs font-semibold font-sans border transition-all cursor-pointer ${
              category === "all"
                ? "gradient-primary text-white border-transparent shadow-lg shadow-primary-500/20"
                : "glass border-surface-800/60 text-surface-300 hover:border-surface-700 hover:text-surface-100"
            }`}
          >
            All Products
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-5 py-2 rounded-full text-xs font-semibold font-sans border transition-all cursor-pointer ${
                category === cat.id
                  ? "gradient-primary text-white border-transparent shadow-lg shadow-primary-500/20"
                  : "glass border-surface-800/60 text-surface-300 hover:border-surface-700 hover:text-surface-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {(searchParams.get("voiceHint") || searchParams.get("suggestions")) && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 px-4 py-3 space-y-2">
          {searchParams.get("voiceHint") && (
            <p className="text-sm text-primary-300 font-sans">
              {searchParams.get("voiceHint")}
            </p>
          )}
          {searchParams.get("suggestions") && (
            <div className="flex flex-wrap gap-2">
              {searchParams
                .get("suggestions")!
                .split(",")
                .filter(Boolean)
                .map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-800/80 text-surface-300 font-sans border border-surface-700/50"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Filter and Sort summary row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass border border-surface-800/35 overflow-visible">
        <div className="flex items-center gap-2.5 text-xs text-surface-400 font-medium font-sans">
          <SlidersHorizontal className="w-4 h-4 text-primary-400" />
          <span>Showing {filteredProducts.length} results</span>
        </div>

        <div className="flex items-center gap-3">
          <ProductFilterSheet
            value={filterKey}
            resultCount={filteredProducts.length}
            onChange={(val) => {
              const preset = findProductFilterPreset(val)
              if (!preset) return
              setFilterKey(val)
              setSearchParams((prev) => applyProductFilterPreset(prev, preset))
            }}
          />
        </div>
      </div>

      {/* Product Grid Area */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="search"
          title="No products found"
          description="We couldn't find any products matching your current filters or query. Try resetting your search terms or choosing another category."
          action={
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-primary text-xs font-semibold text-white cursor-pointer"
            >
              Reset All Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product: Product, idx: number) => (
            <ProductCard key={product.id} product={product} index={idx} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
