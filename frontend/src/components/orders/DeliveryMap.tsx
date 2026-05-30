import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Clock, MapPin, Navigation, Route } from "lucide-react"
import { useDeliveryAnimation } from "@/hooks/useDeliveryAnimation"
import {
  buildDeliveryRouteData,
  getMapDeliveryStats,
  interpolateRoutePoint,
  routeBearing,
  sliceRouteByProgress,
  type DeliveryRouteData,
  type ShippingAddressLike,
} from "@/utils/deliveryMap"
import { formatEstimatedDelivery, normalizeOrderStatus } from "@/utils/orderTracking"

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
const TILE_FALLBACK = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'

interface DeliveryMapProps {
  orderId: string
  status: string
  shippingAddress?: ShippingAddressLike
  estimatedDelivery?: string | null
  compact?: boolean
}

function resetLeafletContainer(container: HTMLDivElement) {
  const leafletId = (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
  if (leafletId != null) {
    delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id
  }
  container.replaceChildren()
}

function createDestinationIcon() {
  return L.divIcon({
    className: "ub-map-marker-wrap",
    html: `<div class="ub-map-dest-pin"><span></span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
  })
}

function createHubIcon() {
  return L.divIcon({
    className: "ub-map-marker-wrap",
    html: `<div class="ub-map-hub-pin"><span></span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function createVehicleIcon(bearing: number, live: boolean) {
  return L.divIcon({
    className: "ub-map-marker-wrap",
    html: `<div class="ub-delivery-vehicle-wrap" style="transform: rotate(${bearing}deg)">
      <div class="ub-delivery-vehicle ${live ? "ub-delivery-vehicle-live" : ""}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18h2"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function addRouteLayers(map: L.Map, routeData: DeliveryRouteData, progress: number, isLive: boolean) {
  const routeLine = L.polyline(routeData.route, {
    color: "rgba(148, 163, 184, 0.35)",
    weight: 4,
    opacity: 0.9,
    dashArray: "8 10",
  }).addTo(map)

  const completedLine = L.polyline(sliceRouteByProgress(routeData.route, progress), {
    color: "#818cf8",
    weight: 5,
    opacity: 0.95,
  }).addTo(map)

  const hubMarker = L.marker(routeData.origin, { icon: createHubIcon() }).addTo(map)
  const destMarker = L.marker(routeData.destination, { icon: createDestinationIcon() }).addTo(map)

  const startPoint = interpolateRoutePoint(routeData.route, progress)
  const vehicleMarker = L.marker(startPoint, {
    icon: createVehicleIcon(routeBearing(routeData.route, progress), isLive),
    zIndexOffset: 1000,
  }).addTo(map)

  map.fitBounds(L.latLngBounds(routeData.route), { padding: [48, 48] })

  return { routeLine, completedLine, hubMarker, destMarker, vehicleMarker }
}

export function DeliveryMap({
  orderId,
  status,
  shippingAddress = {},
  estimatedDelivery,
  compact = false,
}: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<ReturnType<typeof addRouteLayers> | null>(null)
  const routeDataRef = useRef<DeliveryRouteData | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const addressKey = useMemo(() => JSON.stringify(shippingAddress), [shippingAddress])
  const routeData = useMemo(
    () => buildDeliveryRouteData(shippingAddress, orderId),
    [addressKey, orderId, shippingAddress]
  )

  routeDataRef.current = routeData

  const animatedProgress = useDeliveryAnimation(status)
  const normalized = normalizeOrderStatus(status)
  const stats = getMapDeliveryStats(
    status,
    routeData.totalDistanceKm,
    animatedProgress,
    estimatedDelivery
  )

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let map: L.Map | null = null
    let resizeObserver: ResizeObserver | null = null
    let cancelled = false

    const initMap = () => {
      try {
        if (compact && container.offsetHeight < 80) {
          window.requestAnimationFrame(initMap)
          return
        }

        resetLeafletContainer(container)

        map = L.map(container, {
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: !compact,
          dragging: true,
        })

        const tileLayer = L.tileLayer(TILE_URL, {
          attribution: TILE_ATTRIBUTION,
          maxZoom: 19,
        })

        tileLayer.addTo(map)
        tileLayer.on("tileerror", () => {
          if (!map || cancelled) return
          map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) map?.removeLayer(layer)
          })
          L.tileLayer(TILE_FALLBACK, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
        })

        L.control.zoom({ position: "bottomright" }).addTo(map)

        const currentRoute = routeDataRef.current
        if (currentRoute) {
          layersRef.current = addRouteLayers(
            map,
            currentRoute,
            animatedProgress,
            stats.isLive
          )
        }

        mapRef.current = map

        resizeObserver = new ResizeObserver(() => {
          map?.invalidateSize()
        })
        resizeObserver.observe(container)

        window.setTimeout(() => {
          if (cancelled || !map) return
          map.invalidateSize()
          if (currentRoute) {
            map.fitBounds(L.latLngBounds(currentRoute.route), { padding: [48, 48] })
          }
          setMapReady(true)
          setMapError(null)
        }, 200)
      } catch (err) {
        console.error("DeliveryMap init failed:", err)
        setMapError("Map could not load. Check your connection and refresh.")
        setMapReady(false)
      }
    }

    initMap()

    return () => {
      cancelled = true
      setMapReady(false)
      resizeObserver?.disconnect()
      layersRef.current = null
      map?.remove()
      mapRef.current = null
      if (container) resetLeafletContainer(container)
    }
  }, [orderId, compact])

  useEffect(() => {
    const map = mapRef.current
    const layers = layersRef.current
    if (!map || !layers || !mapReady) return

    const point = interpolateRoutePoint(routeData.route, animatedProgress)
    const bearing = routeBearing(routeData.route, animatedProgress)
    const completed = sliceRouteByProgress(routeData.route, animatedProgress)

    layers.completedLine.setLatLngs(completed)
    layers.vehicleMarker.setLatLng(point)
    layers.vehicleMarker.setIcon(createVehicleIcon(bearing, stats.isLive))

    if (stats.isLive) {
      map.panTo(point, { animate: true })
    }
  }, [animatedProgress, routeData.route, stats.isLive, mapReady])

  if (normalized === "cancelled") {
    return (
      <div className="rounded-2xl border border-surface-800/40 bg-surface-950/50 p-6 text-center">
        <p className="text-xs text-surface-400">Delivery map unavailable — order was cancelled.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-surface-500 flex items-center gap-1.5">
          <Navigation className="w-3.5 h-3.5 text-primary-400" />
          Live delivery map
        </h3>
        {stats.isLive && (
          <span className="text-[9px] font-bold uppercase text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            En route
          </span>
        )}
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border border-surface-800/45 bg-surface-950/60 ${
          compact ? "h-[240px]" : "h-[280px] sm:h-[340px] md:h-[380px]"
        }`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 z-[1] ub-delivery-map" />

        {!mapReady && !mapError && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center bg-surface-950/80">
            <p className="text-xs text-surface-400 animate-pulse">Loading delivery map…</p>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 z-[2] flex items-center justify-center bg-surface-950/90 px-6 text-center">
            <p className="text-xs text-surface-400">{mapError}</p>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 z-[500] pointer-events-none">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatChip
              icon={<Route className="w-3 h-3" />}
              label="Progress"
              value={`${stats.progressPercent}%`}
            />
            <StatChip
              icon={<MapPin className="w-3 h-3" />}
              label="Remaining"
              value={stats.isComplete ? "Arrived" : stats.remainingLabel}
            />
            <StatChip
              icon={<Clock className="w-3 h-3" />}
              label="ETA"
              value={
                stats.isComplete
                  ? "Delivered"
                  : stats.minutesRemaining != null
                    ? `~${stats.minutesRemaining} min`
                    : estimatedDelivery
                      ? formatEstimatedDelivery(estimatedDelivery)
                      : "Soon"
              }
            />
            <StatChip
              icon={<Navigation className="w-3 h-3" />}
              label="Status"
              value={normalized.replace(/_/g, " ")}
              className="capitalize col-span-2 sm:col-span-1"
            />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-14 z-[500] pointer-events-none">
          <div className="rounded-xl glass border border-surface-800/50 px-3 py-2">
            <div className="h-1.5 rounded-full bg-surface-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.max(stats.progressPercent, 4)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatChip({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="rounded-xl glass border border-surface-800/45 px-2.5 py-2 pointer-events-auto">
      <p className="text-[9px] uppercase tracking-wide text-surface-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`text-[11px] font-semibold text-surface-100 mt-0.5 truncate ${className}`}>
        {value}
      </p>
    </div>
  )
}
