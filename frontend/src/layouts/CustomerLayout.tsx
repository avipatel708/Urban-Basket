import { Outlet } from "react-router"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { CartDrawer } from "@/components/cart/CartDrawer"
import { FloatingCustomerAssistants } from "@/components/layout/FloatingCustomerAssistants"
import { RealtimeOrdersSync } from "@/components/orders/RealtimeOrdersSync"
import { DeliveryReviewPrompt } from "@/components/reviews/DeliveryReviewPrompt"
import { Toaster } from "sonner"

export default function CustomerLayout() {
  return (
    <div className="gradient-bg min-h-screen flex flex-col relative overflow-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Page Area */}
      <main className="flex-1 pt-24 pb-16">
        <Outlet />
      </main>

      {/* Slide-out Cart Panel */}
      <CartDrawer />

      <RealtimeOrdersSync />

      {/* Order tracker + AI chat (bottom-right) */}
      <FloatingCustomerAssistants />

      {/* Full-screen review prompt for delivered orders */}
      <DeliveryReviewPrompt />

      {/* Sticky Footer */}
      <Footer />

      {/* Toast popup notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 25, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "#F3F4F6",
            backdropFilter: "blur(12px)",
          },
          className: "glass"
        }}
      />
    </div>
  )
}

