export type DominantColor =
  | "black"
  | "white"
  | "red"
  | "blue"
  | "green"
  | "silver"
  | "gold"

export interface ColorSample {
  colors: DominantColor[]
  brightness: number
}

const COLOR_RANGES: Record<DominantColor, { r: [number, number]; g: [number, number]; b: [number, number] }> = {
  black: { r: [0, 55], g: [0, 55], b: [0, 55] },
  white: { r: [200, 255], g: [200, 255], b: [200, 255] },
  red: { r: [140, 255], g: [0, 90], b: [0, 90] },
  blue: { r: [0, 90], g: [0, 140], b: [140, 255] },
  green: { r: [0, 100], g: [100, 200], b: [0, 100] },
  silver: { r: [150, 210], g: [150, 210], b: [150, 210] },
  gold: { r: [180, 255], g: [140, 220], b: [0, 100] },
}

function bucket(r: number, g: number, b: number): DominantColor | null {
  for (const [name, range] of Object.entries(COLOR_RANGES) as [DominantColor, typeof COLOR_RANGES[DominantColor]][]) {
    if (
      r >= range.r[0] &&
      r <= range.r[1] &&
      g >= range.g[0] &&
      g <= range.g[1] &&
      b >= range.b[0] &&
      b <= range.b[1]
    ) {
      return name
    }
  }
  return null
}

export async function extractDominantColors(file: Blob): Promise<ColorSample> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  const size = 96
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return { colors: [], brightness: 0.5 }

  ctx.drawImage(bitmap, 0, 0, size, size)
  bitmap.close()

  const { data } = ctx.getImageData(0, 0, size, size)
  const counts: Partial<Record<DominantColor, number>> = {}
  let brightnessSum = 0
  const pixels = size * size

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    brightnessSum += (r + g + b) / (255 * 3)
    const name = bucket(r, g, b)
    if (name) counts[name] = (counts[name] || 0) + 1
  }

  const colors = (Object.entries(counts) as [DominantColor, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c)

  return { colors, brightness: brightnessSum / pixels }
}

export async function compressImageFile(
  file: File,
  maxSize = 960,
  quality = 0.85
): Promise<File> {
  if (!file.type.startsWith("image/")) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return file
  }

  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  )

  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })
}

export function readFileAsPreviewUrl(file: Blob): string {
  return URL.createObjectURL(file)
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("Could not read image preview"))
    reader.readAsDataURL(file)
  })
}

export function revokePreviewUrl(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url)
}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"])

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) return "Please upload JPG, PNG, or WEBP."
  if (file.size > 8 * 1024 * 1024) return "Image must be under 8 MB."
  return null
}

export function colorSimilarity(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0
  const setB = new Set(b)
  return a.filter((c) => setB.has(c)).length * 20
}
