import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import { useNavigate } from "react-router"
import { AnimatePresence } from "motion/react"
import { Search } from "lucide-react"
import { VoiceSearchButton } from "@/components/VoiceSearchButton"
import { VisualSearchButton } from "@/components/visual-search/VisualSearchButton"
import { SearchSuggestionsDropdown } from "./SearchSuggestionsDropdown"
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions"
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "@/utils/searchHistory"
import { executeVoiceSearch } from "@/utils/applyVoiceSearch"
import { toast } from "sonner"
import type { Product } from "@/services/productService"

const ImageUploadModal = lazy(() =>
  import("@/components/visual-search/ImageUploadModal").then((m) => ({
    default: m.ImageUploadModal,
  }))
)

interface SmartSearchBarProps {
  className?: string
  inputClassName?: string
  /** lg = desktop navbar, md = mobile menu */
  variant?: "desktop" | "mobile"
  onVoiceTranscript?: (text: string) => void
  onSearchExecuted?: () => void
}

export function SmartSearchBar({
  className = "",
  inputClassName = "",
  variant = "desktop",
  onVoiceTranscript,
  onSearchExecuted,
}: SmartSearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentVersion, setRecentVersion] = useState(0)
  const [visualOpen, setVisualOpen] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const enabled = open
  const suggestions = useSearchSuggestions(query, enabled)
  const recent = useMemo(() => {
    void recentVersion
    return getRecentSearches()
  }, [recentVersion, open])

  const flatItems = useMemo(() => {
    const items: Array<
      | { type: "recent"; value: string }
      | { type: "trending"; value: string }
      | { type: "phrase"; value: string }
      | { type: "category"; value: string }
      | { type: "product"; value: Product }
    > = []

    if (!query.trim()) {
      recent.forEach((r) => items.push({ type: "recent", value: r }))
      suggestions.trending.slice(0, 6).forEach((t) => items.push({ type: "trending", value: t }))
    } else {
      suggestions.phrases.forEach((p) => items.push({ type: "phrase", value: p }))
      suggestions.categories.forEach((c) => items.push({ type: "category", value: c.id }))
      suggestions.products.forEach((p) => items.push({ type: "product", value: p }))
    }

    return items
  }, [query, recent, suggestions])

  useEffect(() => {
    if (!open) return

    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener("mousedown", onPointer)
    document.addEventListener("touchstart", onPointer)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("touchstart", onPointer)
    }
  }, [open])

  const runSearch = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      addRecentSearch(trimmed)
      setRecentVersion((v) => v + 1)
      setOpen(false)
      setQuery("")
      setActiveIndex(-1)
      navigate(`/products?search=${encodeURIComponent(trimmed)}&smart=true`)
      onSearchExecuted?.()
    },
    [navigate, onSearchExecuted]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIndex >= 0 && flatItems[activeIndex]) {
      activateItem(flatItems[activeIndex])
      return
    }
    runSearch(query)
  }

  const activateItem = (item: (typeof flatItems)[number]) => {
    if (item.type === "product") {
      addRecentSearch(item.value.title)
      setOpen(false)
      setQuery("")
      navigate(`/product/${item.value.id}`)
      onSearchExecuted?.()
      return
    }
    if (item.type === "category") {
      setOpen(false)
      setQuery("")
      navigate(`/products?category=${encodeURIComponent(item.value)}`)
      onSearchExecuted?.()
      return
    }
    runSearch(item.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true)
      return
    }
    if (e.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1))
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    }
  }

  const handleVoice = useCallback(
    async (transcript: string) => {
      const text = transcript.trim()
      if (!text) return

      setQuery(text)
      setOpen(false)
      setActiveIndex(-1)
      inputRef.current?.focus()

      try {
        const { params, label, parsed } = await executeVoiceSearch(text)
        addRecentSearch(parsed.searchText || text)
        setRecentVersion((v) => v + 1)
        navigate(`/products?${params.toString()}`)
        onVoiceTranscript?.(text)
        onSearchExecuted?.()
        toast.success(label, { duration: 2500 })
      } catch {
        addRecentSearch(text)
        setRecentVersion((v) => v + 1)
        navigate(`/products?search=${encodeURIComponent(text)}&smart=true`)
        onVoiceTranscript?.(text)
        onSearchExecuted?.()
        toast.success(`Searching for "${text}"`, { duration: 2200 })
      }
    },
    [navigate, onVoiceTranscript, onSearchExecuted]
  )

  const isMobile = variant === "mobile"

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-autocomplete="list"
          className={inputClassName}
        />
        <div
          className={`absolute right-1 inset-y-0 flex items-center gap-0.5 pr-0.5 ${
            isMobile ? "right-1.5 gap-1" : ""
          }`}
        >
          <VisualSearchButton
            onClick={() => {
              setOpen(false)
              setVisualOpen(true)
            }}
            className={isMobile ? "h-8 w-8" : "h-7 w-7"}
            silent
          />
          <VoiceSearchButton
            onTranscript={handleVoice}
            className={isMobile ? "h-8 w-8" : "h-7 w-7"}
            silent
          />
          <button
            type="submit"
            className={`flex shrink-0 items-center justify-center rounded-full text-surface-400 hover:text-primary-400 transition-colors cursor-pointer ${
              isMobile ? "h-8 w-8" : "h-7 w-7"
            }`}
            aria-label="Search"
          >
            <Search className={isMobile ? "w-4.5 h-4.5" : "w-4 h-4"} />
          </button>
        </div>
      </form>

      <AnimatePresence>
        {open && (
          <SearchSuggestionsDropdown
            open={open}
            query={query}
            phrases={suggestions.phrases}
            products={suggestions.products}
            categories={suggestions.categories}
            trending={suggestions.trending}
            recent={recent}
            activeIndex={activeIndex}
            onSelectPhrase={runSearch}
            onSelectRecent={runSearch}
            onSelectCategory={(id) => {
              setOpen(false)
              setQuery("")
              navigate(`/products?category=${encodeURIComponent(id)}`)
              onSearchExecuted?.()
            }}
            onSelectProduct={(p) => {
              addRecentSearch(p.title)
              setOpen(false)
              setQuery("")
              navigate(`/product/${p.id}`)
              onSearchExecuted?.()
            }}
            onClearRecent={() => {
              clearRecentSearches()
              setRecentVersion((v) => v + 1)
            }}
          />
        )}
      </AnimatePresence>

      {visualOpen && (
        <Suspense fallback={null}>
          <ImageUploadModal open={visualOpen} onClose={() => setVisualOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
