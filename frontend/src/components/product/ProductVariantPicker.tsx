import { ChevronDown, Info, Ruler } from "lucide-react"
import { toast } from "sonner"
import { formatCurrencyPrecise } from "@/lib/utils"
import type { ProductColorOption } from "@/services/productService"
import {
  ColorSwatchButton,
  ColorTintedImage,
  colorsShareSameImage,
  resolveColorHex,
} from "@/utils/colorSwatches"

interface ProductVariantPickerProps {
  hasColors: boolean
  hasSizes: boolean
  colorDisplay: "grid" | "strip"
  colors: ProductColorOption[]
  sizes: string[]
  selectedColorId: string | null
  selectedSize: string | null
  onColorChange: (colorId: string) => void
  onSizeChange: (size: string) => void
  showSizeChart?: boolean
}

export function ProductVariantPicker({
  hasColors,
  hasSizes,
  colorDisplay,
  colors,
  sizes,
  selectedColorId,
  selectedSize,
  onColorChange,
  onSizeChange,
  showSizeChart,
}: ProductVariantPickerProps) {
  const selectedColor = colors.find((c) => c.id === selectedColorId) ?? colors[0]
  const sameImage = colorsShareSameImage(colors)
  const useSwatches = colorDisplay === "strip" || sameImage

  const handleSizeChart = () => {
    const isShoe = sizes.some((s) => /uk|us|eu/i.test(s))
    const isWatch = sizes.length === 3 && sizes.includes("M") && !sizes.some((s) => /uk/i.test(s))
    const description = isShoe
      ? "UK shoe sizes: 6 = 39 EU · 7 = 41 · 8 = 42 · 9 = 43 · 10 = 44. Measure foot length in cm for best fit."
      : isWatch
        ? "Band sizes: S fits 130–160 mm wrist · M fits 150–180 mm · L fits 170–200 mm."
        : "S: 36–38 · M: 38–40 · L: 40–42 · XL: 42–44 · XXL: 44–46 (body measurements in inches)."
    toast.info("Size chart", { description })
  }

  if (!hasColors && !hasSizes) return null

  return (
    <div className="space-y-5">
      {hasColors && (
        <div className="space-y-3">
          <p className="text-sm text-surface-300 font-sans">
            {colorDisplay === "grid" ? "Colour" : "Color"}:{" "}
            <span className="font-semibold text-surface-50">{selectedColor?.name || "Select"}</span>
          </p>

          {colorDisplay === "grid" && !useSwatches ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {colors.map((color) => {
                const active = color.id === selectedColor?.id
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onColorChange(color.id)}
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      active
                        ? "border-primary-500 bg-primary-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.35)]"
                        : "border-surface-800/50 glass-light hover:border-surface-600/60"
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-900/40 mb-2">
                      <img src={color.image_url} alt={color.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm font-bold text-surface-50 font-sans">
                      {formatCurrencyPrecise(color.price)}
                    </p>
                    {color.mrp && color.mrp > color.price && (
                      <p className="text-[11px] text-surface-500 line-through font-sans">
                        {formatCurrencyPrecise(color.mrp)}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          ) : useSwatches ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {colors.map((color) => (
                <ColorSwatchButton
                  key={color.id}
                  color={color}
                  active={color.id === selectedColor?.id}
                  onClick={() => onColorChange(color.id)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {colors.map((color) => {
                const active = color.id === selectedColor?.id
                const hex = resolveColorHex(color)
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onColorChange(color.id)}
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                      active
                        ? "border-primary-500 bg-primary-500/10 shadow-[0_0_0_1px_rgba(139,92,246,0.35)]"
                        : "border-surface-800/50 glass-light hover:border-surface-600/60"
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-surface-900/40 mb-2">
                      <ColorTintedImage
                        src={color.image_url}
                        alt={color.name}
                        colorHex={hex}
                        className="w-full h-full"
                        tintOpacity={0.5}
                      />
                    </div>
                    <p className="text-sm font-bold text-surface-50 font-sans">
                      {formatCurrencyPrecise(color.price)}
                    </p>
                    {color.mrp && color.mrp > color.price && (
                      <p className="text-[11px] text-surface-500 line-through font-sans">
                        {formatCurrencyPrecise(color.mrp)}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {hasSizes && (
        <div className="space-y-3">
          <p className="text-sm text-surface-300 font-sans">
            Size:{" "}
            <span className="font-semibold text-surface-50">{selectedSize || "Select size"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selectedSize === size
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSizeChange(size)}
                  className={`min-w-[52px] px-3.5 py-2 rounded-xl border text-xs font-semibold font-sans transition-all cursor-pointer ${
                    active
                      ? "border-primary-500 bg-primary-500/15 text-primary-200"
                      : "border-surface-700/50 glass-light text-surface-300 hover:border-surface-500/60"
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>

          {showSizeChart && (
            <button
              type="button"
              onClick={handleSizeChart}
              className="inline-flex items-center gap-1.5 text-[11px] text-surface-400 hover:text-primary-400 transition-colors cursor-pointer font-sans"
            >
              <Ruler className="w-3.5 h-3.5" />
              Not sure about your size?
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-surface-700/50 text-surface-300">
                Size Chart
                <ChevronDown className="w-3 h-3" />
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface ProductPriceDisplayProps {
  price: number
  mrp?: number
  stock: number
}

export function ProductPriceDisplay({ price, mrp, stock }: ProductPriceDisplayProps) {
  const discount = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  return (
    <div className="p-5 rounded-2xl glass border border-surface-800/40 space-y-2">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-surface-50 font-sans tracking-tight">
              {formatCurrencyPrecise(price)}
            </p>
            {mrp && mrp > price && (
              <>
                <p className="text-sm text-surface-500 line-through font-sans">{formatCurrencyPrecise(mrp)}</p>
                {discount > 0 && (
                  <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-[11px] text-surface-400 font-sans mt-1 inline-flex items-center gap-1">
            (Incl. of all taxes)
            <Info className="w-3 h-3 text-primary-400/70" />
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            stock > 0
              ? "text-green-400 bg-green-400/10 border border-green-500/20"
              : "text-red-400 bg-red-400/10 border border-red-500/20"
          }`}
        >
          {stock > 0 ? "In Stock & Ready" : "Out of Stock"}
        </span>
      </div>
    </div>
  )
}
