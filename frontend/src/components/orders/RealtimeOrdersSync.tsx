import { useAuthStore } from "@/store/authStore"
import { useRealtimeOrderTracking } from "@/hooks/useRealtimeOrderTracking"

/** Invisible listener — keeps order UIs in sync via Supabase Realtime. */
export function RealtimeOrdersSync() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.profile?.role)

  useRealtimeOrderTracking({
    enabled: Boolean(user && role === "customer"),
  })

  return null
}
