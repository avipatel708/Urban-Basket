import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ChevronDown, Check } from "lucide-react"

export type PopupSelectOption = {
  value: string
  label: string
}

export type PopupSelectGroup = {
  title: string
  options: readonly PopupSelectOption[]
}

type PopupSelectProps = {
  value: string
  onChange: (value: string) => void
  options?: readonly PopupSelectOption[]
  groups?: readonly PopupSelectGroup[]
  align?: "left" | "right"
  minWidth?: string
  "aria-label"?: string
}

function flattenOptions(
  options?: readonly PopupSelectOption[],
  groups?: readonly PopupSelectGroup[]
): PopupSelectOption[] {
  if (groups?.length) return groups.flatMap((g) => [...g.options])
  return options ? [...options] : []
}

export function PopupSelect({
  value,
  onChange,
  options,
  groups,
  align = "right",
  minWidth = "14rem",
  "aria-label": ariaLabel,
}: PopupSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const flat = flattenOptions(options, groups)
  const selected = flat.find((o) => o.value === value) ?? flat[0]

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const renderOption = (opt: PopupSelectOption) => {
    const isSelected = opt.value === value
    return (
      <button
        key={opt.value}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          onChange(opt.value)
          setOpen(false)
        }}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs font-sans text-left transition-all ${
          isSelected
            ? "text-primary-300 bg-primary-500/10"
            : "text-surface-200 hover:bg-surface-800/50 hover:text-primary-400"
        }`}
      >
        <span>{opt.label}</span>
        {isSelected && <Check className="w-3.5 h-3.5 text-primary-400 shrink-0" />}
      </button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={ariaLabel ?? "Select option"}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 glass-light border border-surface-700/60 rounded-xl px-4 py-1.5 text-xs font-sans text-surface-200 cursor-pointer hover:border-primary-500/50 hover:bg-surface-800/30 transition-all min-w-[11rem]"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-surface-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 z-[60] glass rounded-xl overflow-hidden shadow-2xl border border-surface-700/50`}
            style={{ minWidth }}
          >
            <div className="max-h-[min(20rem,70vh)] overflow-y-auto overscroll-contain py-1.5 scrollbar-thin">
              {groups?.length
                ? groups.map((group, gi) => (
                    <div key={group.title}>
                      {gi > 0 && <div className="my-1.5 mx-3 border-t border-surface-700/40" />}
                      <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-surface-500 font-sans">
                        {group.title}
                      </p>
                      {group.options.map(renderOption)}
                    </div>
                  ))
                : flat.map(renderOption)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
