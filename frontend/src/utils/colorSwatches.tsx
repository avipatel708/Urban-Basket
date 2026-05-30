import type { ProductColorOption } from "@/services/productService"
import { isLightSwatch, resolveColorHex } from "@/utils/colorTokens"

interface ColorTintedImageProps {
  src: string
  alt: string
  colorHex?: string
  className?: string
  tintOpacity?: number
}

/** Product photo with a color wash so each variant looks visually distinct */
export function ColorTintedImage({
  src,
  alt,
  colorHex,
  className = "",
  tintOpacity = 0.42,
}: ColorTintedImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      {colorHex && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: colorHex,
            mixBlendMode: "color",
            opacity: tintOpacity,
          }}
        />
      )}
      {colorHex && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: colorHex,
            mixBlendMode: "soft-light",
            opacity: tintOpacity * 0.55,
          }}
        />
      )}
    </div>
  )
}

interface ColorSwatchProps {
  color: ProductColorOption
  active: boolean
  size?: "sm" | "md"
  showLabel?: boolean
  onClick: () => void
}

export function ColorSwatchButton({
  color,
  active,
  size = "md",
  showLabel = true,
  onClick,
}: ColorSwatchProps) {
  const hex = color.hex || resolveColorHex(color)
  const light = isLightSwatch(hex)
  const dim = size === "sm" ? "w-10 h-10" : "w-[72px] h-[72px]"

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 text-center cursor-pointer group"
    >
      <div
        className={`${dim} rounded-xl border-2 transition-all mx-auto flex items-center justify-center overflow-hidden ${
          active
            ? "border-surface-50 shadow-lg ring-2 ring-primary-500/40"
            : light
              ? "border-surface-500/60 group-hover:border-surface-300/80"
              : "border-surface-700/50 group-hover:border-surface-500/70"
        }`}
        style={{ backgroundColor: hex }}
        title={color.name}
      >
        {light && (
          <span className="w-full h-full rounded-[10px] border border-surface-600/30" />
        )}
      </div>
      {showLabel && (
        <p className="text-[10px] text-surface-400 mt-1.5 font-sans capitalize truncate max-w-[72px]">
          {color.name}
        </p>
      )}
    </button>
  )
}

export { resolveColorHex, colorsShareSameImage, COLOR_HEX } from "@/utils/colorTokens"
