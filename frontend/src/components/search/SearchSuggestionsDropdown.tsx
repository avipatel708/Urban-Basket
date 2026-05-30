import { motion } from "motion/react"
import {
  Search,
  TrendingUp,
  Clock,
  Tag,
  Star,
  ArrowRight,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/services/productService"
import type { SearchSuggestionCategory } from "@/utils/searchSuggestionsEngine"

interface SearchSuggestionsDropdownProps {
  open: boolean
  query: string
  phrases: string[]
  products: Product[]
  categories: SearchSuggestionCategory[]
  trending: string[]
  recent: string[]
  activeIndex: number
  onSelectPhrase: (phrase: string) => void
  onSelectProduct: (product: Product) => void
  onSelectCategory: (categoryId: string) => void
  onSelectRecent: (phrase: string) => void
  onClearRecent?: () => void
}

export function SearchSuggestionsDropdown({
  open,
  query,
  phrases,
  products,
  categories,
  trending,
  recent,
  activeIndex,
  onSelectPhrase,
  onSelectProduct,
  onSelectCategory,
  onSelectRecent,
  onClearRecent,
}: SearchSuggestionsDropdownProps) {
  if (!open) return null

  const showRecent = !query.trim() && recent.length > 0
  const showTrending = !query.trim()
  const showPhrases = query.trim() && phrases.length > 0
  const showCategories = categories.length > 0
  const showProducts = products.length > 0

  let rowIndex = 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] rounded-2xl glass-strong border border-surface-800/60 shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden max-h-[min(70vh,420px)] overflow-y-auto custom-scrollbar"
      role="listbox"
    >
      {showRecent && (
        <Section
          title="Recent searches"
          icon={<Clock className="w-3.5 h-3.5" />}
          action={
            onClearRecent ? (
              <button
                type="button"
                onClick={onClearRecent}
                className="text-[10px] text-surface-500 hover:text-primary-400 cursor-pointer"
              >
                Clear
              </button>
            ) : null
          }
        >
          {recent.map((item) => {
            const idx = rowIndex++
            return (
              <SuggestionRow
                key={`recent-${item}`}
                active={activeIndex === idx}
                onClick={() => onSelectRecent(item)}
              >
                <Clock className="w-3.5 h-3.5 text-surface-500 shrink-0" />
                <span className="text-xs text-surface-200 truncate">{item}</span>
              </SuggestionRow>
            )
          })}
        </Section>
      )}

      {showTrending && (
        <Section title="Trending" icon={<TrendingUp className="w-3.5 h-3.5 text-amber-400" />}>
          {trending.slice(0, 6).map((item) => {
            const idx = rowIndex++
            return (
              <SuggestionRow
                key={`trend-${item}`}
                active={activeIndex === idx}
                onClick={() => onSelectPhrase(item)}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                <span className="text-xs text-surface-200 truncate">{item}</span>
              </SuggestionRow>
            )
          })}
        </Section>
      )}

      {showPhrases && (
        <Section title="Suggestions" icon={<Search className="w-3.5 h-3.5" />}>
          {phrases.map((phrase) => {
            const idx = rowIndex++
            return (
              <SuggestionRow
                key={phrase}
                active={activeIndex === idx}
                onClick={() => onSelectPhrase(phrase)}
              >
                <Search className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                <span className="text-xs text-surface-200 truncate">{phrase}</span>
                <ArrowRight className="w-3 h-3 text-surface-600 ml-auto shrink-0" />
              </SuggestionRow>
            )
          })}
        </Section>
      )}

      {showCategories && (
        <Section title="Categories" icon={<Tag className="w-3.5 h-3.5" />}>
          {categories.map((cat) => {
            const idx = rowIndex++
            return (
              <SuggestionRow
                key={cat.id}
                active={activeIndex === idx}
                onClick={() => onSelectCategory(cat.id)}
              >
                <span className="text-[10px] font-bold uppercase text-primary-400">{cat.name}</span>
              </SuggestionRow>
            )
          })}
        </Section>
      )}

      {showProducts && (
        <Section title="Products" icon={null}>
          {products.map((product) => {
            const idx = rowIndex++
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  activeIndex === idx
                    ? "bg-primary-500/15 border-l-2 border-primary-500"
                    : "hover:bg-surface-800/40 border-l-2 border-transparent"
                }`}
              >
                <img
                  src={product.image_url || ""}
                  alt=""
                  className="w-11 h-11 rounded-lg object-cover border border-surface-800/50 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-surface-100 line-clamp-1">
                    {product.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-bold text-primary-400">
                      {formatCurrency(product.price)}
                    </span>
                    {(product.rating || 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        {product.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </Section>
      )}

      {!showRecent && !showTrending && !showPhrases && !showProducts && query.trim() && (
        <p className="px-4 py-6 text-xs text-surface-500 text-center">No matches yet — try another word</p>
      )}
    </motion.div>
  )
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string
  icon: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-surface-800/40 last:border-0">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-950/30">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
          {title}
        </span>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function SuggestionRow({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer ${
        active ? "bg-primary-500/15" : "hover:bg-surface-800/35"
      }`}
    >
      {children}
    </button>
  )
}
