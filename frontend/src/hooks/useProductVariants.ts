import { useEffect, useMemo, useState } from "react"
import type { Product, ProductColorOption, ProductVariantConfig } from "@/services/productService"
import { resolveProductVariants } from "@/utils/productVariantInference"

export interface SelectedVariant {
  color?: ProductColorOption
  size?: string
  price: number
  mrp?: number
  stock: number
  image_url: string
  label: string
  lineId: string
}

function buildVariantLabel(color?: ProductColorOption, size?: string) {
  const parts: string[] = []
  if (color?.name) parts.push(color.name)
  if (size) parts.push(size)
  return parts.join(" · ")
}

export function useProductVariants(product: Product | null) {
  const config: ProductVariantConfig | null = useMemo(
    () => resolveProductVariants(product),
    [product]
  )
  const hasColors = (config?.colors?.length ?? 0) > 0
  const hasSizes = Boolean(config?.has_sizes && (config?.sizes?.length ?? 0) > 0)

  const [selectedColorId, setSelectedColorId] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    setSelectedColorId(config?.colors?.[0]?.id ?? null)
    setSelectedSize(null)
  }, [product?.id, config?.colors?.[0]?.id])

  const selectedColor = useMemo(
    () => config?.colors?.find((c) => c.id === selectedColorId) ?? config?.colors?.[0],
    [config?.colors, selectedColorId]
  )

  const displayPrice = selectedColor?.price ?? product?.price ?? 0
  const displayMrp = selectedColor?.mrp
  const displayStock = selectedColor?.stock ?? product?.stock ?? 0
  const displayImage = selectedColor?.image_url ?? product?.image_url ?? ""

  const selectionComplete =
    displayStock > 0 &&
    (!hasColors || Boolean(selectedColor)) &&
    (!hasSizes || Boolean(selectedSize))

  const selected: SelectedVariant | null = product
    ? {
        color: selectedColor,
        size: selectedSize ?? undefined,
        price: displayPrice,
        mrp: displayMrp,
        stock: displayStock,
        image_url: displayImage,
        label: buildVariantLabel(selectedColor, selectedSize ?? undefined),
        lineId: `${product.id}::${selectedColor?.id || "default"}::${selectedSize || ""}`,
      }
    : null

  return {
    config,
    hasColors,
    hasSizes,
    colorDisplay: config?.color_display ?? "strip",
    sizes: config?.sizes ?? [],
    colors: config?.colors ?? [],
    selectedColorId: selectedColor?.id ?? null,
    selectedSize,
    setSelectedColorId,
    setSelectedSize,
    displayPrice,
    displayMrp,
    displayStock,
    displayImage,
    selectionComplete,
    selected,
    showSizeChart: Boolean(config?.size_chart),
  }
}
