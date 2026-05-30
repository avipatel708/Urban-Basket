import { Navigate, useLocation, Outlet } from "react-router"
import { useAuthStore } from "@/store/authStore"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"

interface ProtectedRouteProps {
  children?: React.ReactNode
  allowedRoles?: Array<"customer" | "seller">
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, initialized, loading } = useAuthStore()
  const location = useLocation()

  // For demo/development if Supabase session is not fully set up yet
  // but let's be strict if initialized is true
  if (!initialized || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="glass rounded-2xl p-8 w-80">
          <LoadingSkeleton lines={3} />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    const redirect = profile.role === "seller" ? "/seller/dashboard" : "/"
    return <Navigate to={redirect} replace />
  }

  return children ? <>{children}</> : <Outlet />
}

interface RoleGuardProps {
  children: React.ReactNode
  role: "customer" | "seller"
}

export function RoleGuard({ children, role }: RoleGuardProps) {
  const { profile, initialized, loading } = useAuthStore()
  const location = useLocation()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="glass rounded-2xl p-8 w-80">
          <LoadingSkeleton lines={3} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (profile.role !== role) {
    const redirect = profile.role === "seller" ? "/seller/dashboard" : "/"
    return <Navigate to={redirect} replace />
  }

  return <>{children}</>
}

