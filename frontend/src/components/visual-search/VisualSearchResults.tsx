import { motion } from "motion/react"
import { Sparkles } from "lucide-react"
import { ProductCard } from "@/components/product/ProductCard"
import type { Product } from "@/services/productService"
import type { VisualSearchResponse } from "@/services/visualSearchService"

interface VisualSearchResultsProps {
  previewUrl: string
  analysis: VisualSearchResponse["analysis"]
  results: Array<
    Product & {
      _visualMatch?: { score: number; matchReasons: string[]; fallback?: boolean }
    }
  >
  fallback?: boolean
}

function stripMeta(
  product: Product & { _visualMatch?: unknown }
): Product {
  const { _visualMatch, ...rest } = product as Product & { _visualMatch?: unknown }
  return rest
}

export function VisualSearchResults({
  previewUrl,
  analysis,
  results,
  fallback,
}: VisualSearchResultsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-primary-500/30 flex-shrink-0">
          <img src={previewUrl} alt="Your upload" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950/50 to-transparent pointer-events-none" />
        </div>
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">
            AI detected
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.topLabels.slice(0, 3).map((l) => (
              <span
                key={l.label}
                className="text-[10px] px-2 py-0.5 rounded-full glass border border-surface-800/50 text-surface-300 capitalize"
              >
                {l.label}
                {l.confidence != null ? ` · ${Math.round(l.confidence * 100)}%` : ""}
              </span>
            ))}
            {analysis.detectedColors.map((c) => (
              <span
                key={c}
                className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 capitalize"
              >
                {c}
              </span>
            ))}
            {analysis.detectedCategories.map((c) => (
              <span
                key={c}
                className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/10 border border-accent-500/25 text-accent-300 capitalize"
              >
                {c}
              </span>
            ))}
          </div>
          {fallback && results.length === 0 && (
            <p className="text-[11px] text-amber-400/90 font-sans">
              We couldn&apos;t identify a clear match from your photo — try a clearer image or a different angle.
            </p>
          )}
          {!fallback && results.length > 0 && analysis.detectedIntents.length > 0 && (
            <p className="text-[11px] text-surface-500 font-sans">
              Showing products similar to{" "}
              <span className="text-surface-300 capitalize">{analysis.detectedIntents.join(", ")}</span>
            </p>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-surface-400 text-center py-8">No matching products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((p, idx) => (
            <div key={p.id} className="relative">
              {p._visualMatch?.matchReasons?.[0] && (
                <div className="absolute top-3 left-3 z-20">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full glass border border-primary-500/30 text-primary-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    {p._visualMatch.matchReasons[0]}
                  </span>
                </div>
              )}
              <ProductCard product={stripMeta(p)} index={idx} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function VisualSearchScanningOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface-950/85 backdrop-blur-sm rounded-2xl overflow-hidden"
    >
      <div className="relative w-40 h-40 mb-6">
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary-500/40"
          animate={{ boxShadow: ["0 0 20px rgba(139,92,246,0.2)", "0 0 40px rgba(139,92,246,0.5)", "0 0 20px rgba(139,92,246,0.2)"] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="text-sm font-semibold text-surface-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary-400 animate-pulse" />
        AI scanning your image…
      </p>
      <p className="text-[11px] text-surface-400 mt-1 font-sans">
        Detecting category, colors &amp; style
      </p>
    </motion.div>
  )
}
