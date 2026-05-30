import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, SlidersHorizontal, X } from "lucide-react"
import {
  PRODUCT_FILTER_GROUPS,
  getProductFilterLabel,
  type ProductFilterGroup,
} from "@/utils/productFilterPresets"

type ProductFilterSheetProps = {
  value: string
  onChange: (value: string) => void
  resultCount?: number
}

function RadioIndicator({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-[1.35rem] h-[1.35rem] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
        checked ? "border-primary-500 shadow-[0_0_12px_rgba(168,85,247,0.35)]" : "border-surface-600"
      }`}
      aria-hidden
    >
      {checked && <span className="w-2 h-2 rounded-full bg-primary-500" />}
    </span>
  )
}

export function ProductFilterSheet({ value, onChange, resultCount }: ProductFilterSheetProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  const label = getProductFilterLabel(value)

  useEffect(() => {
    if (!open) setDraft(value)
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const handleApply = () => {
    onChange(draft)
    setOpen(false)
  }

  const handleClear = () => {
    setDraft("newest")
    onChange("newest")
    setOpen(false)
  }

  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex flex-col justify-end sm:justify-center sm:items-center sm:p-6"
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close filter panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px] cursor-default"
            onClick={() => setOpen(false)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-sheet-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md max-h-[min(88vh,42rem)] flex flex-col rounded-t-[1.75rem] sm:rounded-2xl glass-strong border border-surface-700/60 shadow-[0_-24px_80px_rgba(0,0,0,0.55)] sm:shadow-2xl overflow-hidden font-sans"
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <span className="w-10 h-1 rounded-full bg-surface-600/80" aria-hidden />
            </div>

            <header className="flex items-center justify-between gap-3 px-5 pt-2 pb-4 border-b border-surface-700/50">
              <div>
                <h2
                  id="filter-sheet-title"
                  className="font-display font-bold text-base tracking-wide text-surface-50 uppercase"
                >
                  Sort &amp; Filter
                </h2>
                {resultCount != null && (
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    {resultCount} product{resultCount !== 1 ? "s" : ""} match your filters
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full text-surface-400 hover:text-surface-100 hover:bg-surface-800/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {PRODUCT_FILTER_GROUPS.map((group: ProductFilterGroup, gi) => (
                <section key={group.title} className="mb-1">
                  {gi > 0 && <div className="mx-3 my-3 border-t border-surface-700/40" />}
                  <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-surface-500">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5" role="radiogroup" aria-label={group.title}>
                    {group.options.map((opt) => {
                      const selected = draft === opt.value
                      return (
                        <li key={opt.value}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setDraft(opt.value)}
                            className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-left transition-all cursor-pointer ${
                              selected
                                ? "bg-primary-500/10 text-primary-200"
                                : "text-surface-200 hover:bg-surface-800/40"
                            }`}
                          >
                            <span className="text-sm font-medium">{opt.label}</span>
                            <RadioIndicator checked={selected} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>

            <footer className="flex items-center gap-3 px-4 py-4 border-t border-surface-700/50 bg-surface-950/40">
              <button
                type="button"
                onClick={handleClear}
                disabled={draft === "newest" && value === "newest"}
                className="flex-1 py-3 rounded-xl border border-surface-700/60 text-sm font-semibold text-surface-300 hover:bg-surface-800/50 hover:text-surface-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-[1.4] py-3 rounded-xl gradient-primary text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:opacity-95 transition-opacity cursor-pointer"
              >
                Apply
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 glass-light border border-surface-700/60 rounded-full pl-4 pr-3.5 py-2 text-xs font-sans text-surface-200 cursor-pointer hover:border-primary-500/50 hover:bg-surface-800/30 transition-all min-w-[11rem] max-w-[14rem]"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-primary-400 shrink-0" />
        <span className="truncate flex-1 text-left font-medium">{label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
      </button>

      {typeof document !== "undefined" ? createPortal(sheet, document.body) : null}
    </>
  )
}
