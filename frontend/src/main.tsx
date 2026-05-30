import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { AuthProvider } from "@/context/AuthProvider"
import { AppRouter } from "@/routes/AppRouter"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
