import { useEffect } from "react"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import { getToken } from "@/services/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchProfile, setInitialized, setLoading } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true)
      try {
        const token = getToken()
        if (token) {
          await fetchProfile()
        }
      } catch (err) {
        console.error("Auth init failed:", err)
      } finally {
        setInitialized(true)
        setLoading(false)
      }
    }

    initAuth()
  }, [fetchProfile, setInitialized, setLoading])

  return <>{children}</>
}
