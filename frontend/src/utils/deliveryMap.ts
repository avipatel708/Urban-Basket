import { getDeliveryProgressPercent, normalizeOrderStatus } from "./orderTracking"

export type LatLng = [number, number]

export interface ShippingAddressLike {
  line1?: string
  city?: string
  state?: string
  pincode?: string
}

export interface DeliveryRouteData {
  origin: LatLng
  destination: LatLng
  route: LatLng[]
  totalDistanceKm: number
}

const CITY_COORDS: Record<string, LatLng> = {
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  "new delhi": [28.6139, 77.209],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
}

function hashUnit(input: string, salt = 0): number {
  let h = salt
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return (h % 10000) / 10000
}

function findCityBase(address: ShippingAddressLike): LatLng {
  const city = (address.city || "").trim().toLowerCase()
  if (city && CITY_COORDS[city]) return CITY_COORDS[city]

  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(name) || name.includes(city)) return coords
  }

  const pin = String(address.pincode || "").replace(/\D/g, "")
  if (pin.length >= 3) {
    const pinNum = parseInt(pin.slice(0, 3), 10)
    const lat = 8 + (pinNum % 20) + hashUnit(pin, 1) * 0.5
    const lng = 68 + (pinNum % 25) + hashUnit(pin, 2) * 0.5
    return [lat, lng]
  }

  return [19.076, 72.8777]
}

export function resolveDestinationCoords(
  address: ShippingAddressLike,
  orderId: string
): LatLng {
  const base = findCityBase(address)
  const pin = address.pincode || orderId
  const j1 = hashUnit(orderId + pin, 3) - 0.5
  const j2 = hashUnit(orderId + pin, 7) - 0.5
  return [base[0] + j1 * 0.06, base[1] + j2 * 0.06]
}

export function resolveWarehouseCoords(
  destination: LatLng,
  orderId: string
): LatLng {
  const angle = hashUnit(orderId, 11) * Math.PI * 2
  const km = 6 + hashUnit(orderId, 13) * 10
  const latOffset = (km / 111) * Math.cos(angle)
  const lngOffset = (km / (111 * Math.cos((destination[0] * Math.PI) / 180))) * Math.sin(angle)
  return [destination[0] + latOffset, destination[1] + lngOffset]
}

function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/** Curved route with intermediate waypoints for a natural delivery path. */
export function buildDeliveryRoute(origin: LatLng, destination: LatLng, orderId: string): LatLng[] {
  const mid: LatLng = [
    (origin[0] + destination[0]) / 2 + (hashUnit(orderId, 17) - 0.5) * 0.03,
    (origin[1] + destination[1]) / 2 + (hashUnit(orderId, 19) - 0.5) * 0.03,
  ]

  const points: LatLng[] = []
  const segments = 48

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    const lat = u * u * origin[0] + 2 * u * t * mid[0] + t * t * destination[0]
    const lng = u * u * origin[1] + 2 * u * t * mid[1] + t * t * destination[1]
    points.push([lat, lng])
  }

  return points
}

export function buildDeliveryRouteData(
  address: ShippingAddressLike,
  orderId: string
): DeliveryRouteData {
  const destination = resolveDestinationCoords(address, orderId)
  const origin = resolveWarehouseCoords(destination, orderId)
  const route = buildDeliveryRoute(origin, destination, orderId)

  let totalDistanceKm = 0
  for (let i = 1; i < route.length; i++) {
    totalDistanceKm += haversineKm(route[i - 1], route[i])
  }

  return { origin, destination, route, totalDistanceKm: Math.max(totalDistanceKm, 0.5) }
}

/** Target position along route from order status (0 = hub, 1 = delivered). */
export function statusToRouteProgress(status: string): number {
  const s = normalizeOrderStatus(status)
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 0.06,
    packed: 0.14,
    shipped: 0.48,
    out_for_delivery: 0.84,
    delivered: 1,
    cancelled: 0,
    returned: 1,
  }
  return map[s] ?? 0
}

export function interpolateRoutePoint(route: LatLng[], progress: number): LatLng {
  if (route.length === 0) return [0, 0]
  if (progress <= 0) return route[0]
  if (progress >= 1) return route[route.length - 1]

  const idx = progress * (route.length - 1)
  const i = Math.floor(idx)
  const frac = idx - i
  const a = route[i]
  const b = route[Math.min(i + 1, route.length - 1)]
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]
}

export function routeBearing(route: LatLng[], progress: number): number {
  const eps = 0.01
  const from = interpolateRoutePoint(route, Math.max(0, progress - eps))
  const to = interpolateRoutePoint(route, Math.min(1, progress + eps))
  const y = Math.sin(((to[1] - from[1]) * Math.PI) / 180) * Math.cos((to[0] * Math.PI) / 180)
  const x =
    Math.cos((from[0] * Math.PI) / 180) * Math.sin((to[0] * Math.PI) / 180) -
    Math.sin((from[0] * Math.PI) / 180) *
      Math.cos((to[0] * Math.PI) / 180) *
      Math.cos(((to[1] - from[1]) * Math.PI) / 180)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function sliceRouteByProgress(route: LatLng[], progress: number): LatLng[] {
  if (progress <= 0) return [route[0]]
  const point = interpolateRoutePoint(route, progress)
  const idx = Math.floor(progress * (route.length - 1))
  return [...route.slice(0, idx + 1), point]
}

export function getRemainingDistanceKm(totalKm: number, progress: number): number {
  return Math.max(0, totalKm * (1 - progress))
}

export function estimateMinutesRemaining(
  remainingKm: number,
  status: string
): number | null {
  const s = normalizeOrderStatus(status)
  if (s === "delivered" || s === "cancelled" || s === "returned") return 0
  if (s === "pending" || s === "confirmed" || s === "packed") return null

  const speedKmh = s === "out_for_delivery" ? 22 : 35
  return Math.max(5, Math.round((remainingKm / speedKmh) * 60))
}

export function formatRemainingDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function getMapDeliveryStats(
  status: string,
  totalDistanceKm: number,
  progress: number,
  estimatedDelivery?: string | null
) {
  const remainingKm = getRemainingDistanceKm(totalDistanceKm, progress)
  const minutesRemaining = estimateMinutesRemaining(remainingKm, status)
  const progressPercent = getDeliveryProgressPercent(status)

  return {
    remainingKm,
    remainingLabel: formatRemainingDistance(remainingKm),
    minutesRemaining,
    progressPercent,
    estimatedDelivery,
    isLive:
      normalizeOrderStatus(status) === "shipped" ||
      normalizeOrderStatus(status) === "out_for_delivery",
    isComplete: normalizeOrderStatus(status) === "delivered",
  }
}
