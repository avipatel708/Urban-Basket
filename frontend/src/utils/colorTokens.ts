import type { ProductColorOption } from "@/services/productService"

/** Hex values for variant swatches and image tinting */
export const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  blue: "#2563eb",
  navy: "#1e3a5f",
  red: "#dc2626",
  green: "#16a34a",
  pink: "#ec4899",
  purple: "#9333ea",
  grey: "#6b7280",
  gray: "#6b7280",
  yellow: "#eab308",
  orange: "#ea580c",
  brown: "#92400e",
  beige: "#d4b896",
  olive: "#556b2f",
  maroon: "#7f1d1d",
  cream: "#fef3c7",
  teal: "#0d9488",
  lime: "#84cc16",
  gold: "#ca8a04",
  silver: "#94a3b8",
  charcoal: "#374151",
  mint: "#6ee7b7",
  rose: "#fb7185",
  sand: "#d6c6a8",
  tortoise: "#8b4513",
  "red-white": "#ef4444",
  "blue-navy": "#1d4ed8",
  "black-grey": "#374151",
  "green-lime": "#22c55e",
  "white-orange": "#f97316",
  "rose-gold": "#b76e79",
  midnight: "#0f172a",
}

export function resolveColorHex(color: Pick<ProductColorOption, "id" | "name">): string {
  const id = color.id.toLowerCase()
  if (COLOR_HEX[id]) return COLOR_HEX[id]

  const idPart = id.split(/[-_/]/)[0]
  if (COLOR_HEX[idPart]) return COLOR_HEX[idPart]

  const namePart = color.name.toLowerCase().split(/[\s/]+/)[0]
  if (COLOR_HEX[namePart]) return COLOR_HEX[namePart]

  return "#64748b"
}

export function colorsShareSameImage(colors: ProductColorOption[]): boolean {
  if (colors.length <= 1) return true
  const first = colors[0]?.image_url
  if (!first) return true
  return colors.every((c) => c.image_url === first)
}

export function isLightSwatch(hex: string): boolean {
  const h = hex.replace("#", "")
  if (h.length !== 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 180
}
