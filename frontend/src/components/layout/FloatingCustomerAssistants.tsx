import { AIChatbot } from "@/components/ai/AIChatbot"
import { FloatingOrderTracker } from "@/components/orders/FloatingOrderTracker"
import { FloatingMysteryBoxButton } from "@/components/mystery/FloatingMysteryBoxButton"
import { useAuthStore } from "@/store/authStore"

/** Bottom-right stack: order tracker above AI chat (customers only). */
export function FloatingCustomerAssistants() {
  const { user, profile } = useAuthStore()
  const showOrderTracker = Boolean(user && profile?.role !== "seller")

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3 font-sans">
      <AIChatbot />
      {showOrderTracker && <FloatingOrderTracker />}
      <FloatingMysteryBoxButton />
    </div>
  )
}
