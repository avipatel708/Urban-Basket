import { useEffect, useRef, useState } from "react"
import { statusToRouteProgress } from "@/utils/deliveryMap"

const LERP_SPEED = 0.035

/**
 * Smoothly animates route progress when order status updates in realtime.
 */
export function useDeliveryAnimation(status: string) {
  const target = statusToRouteProgress(status)
  const [progress, setProgress] = useState(target)
  const progressRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    const animate = () => {
      const current = progressRef.current
      const next = current + (target - current) * LERP_SPEED

      if (Math.abs(target - current) < 0.001) {
        progressRef.current = target
        setProgress(target)
        rafRef.current = null
        return
      }

      progressRef.current = next
      setProgress(next)
      rafRef.current = requestAnimationFrame(animate)
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target])

  return progress
}
