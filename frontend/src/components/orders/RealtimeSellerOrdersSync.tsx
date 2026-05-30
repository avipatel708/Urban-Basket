import { useAuthStore } from "@/store/authStore"
import { useRealtimeOrderTracking } from "@/hooks/useRealtimeOrderTracking"

export function RealtimeSellerOrdersSync() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.profile?.role)

  useRealtimeOrderTracking({
    enabled: Boolean(user && role === "seller"),
  })

  return null
}
