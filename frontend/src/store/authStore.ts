import { create } from "zustand"
import { apiGet, apiPost, apiPut, setToken, removeToken, getToken } from "@/services/api"
import { syncSupabaseSession, clearSupabaseSession } from "@/services/supabaseAuthSync"

export interface Profile {
  id: string
  name: string
  email: string
  role: "customer" | "seller"
  avatar_url: string | null
  created_at: string
}

interface AuthState {
  user: { id: string; email: string; role: "customer" | "seller" } | null
  session: { access_token: string } | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: any | null) => void
  setSession: (session: any | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  fetchProfile: (userId?: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role: "customer" | "seller") => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  fetchProfile: async () => {
    try {
      const data = await apiGet<{ user: Profile }>("/auth/profile")
      if (data && data.user) {
        set({
          profile: data.user,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
          },
        })
      }
    } catch (err) {
      console.error("Error fetching profile from backend:", err)
      // Clear token if token is invalid/expired
      removeToken()
      set({ user: null, session: null, profile: null })
    }
  },

  signUp: async (email, password, name, role) => {
    set({ loading: true })
    try {
      const data = await apiPost<{
        user: Profile
        token: string
        supabase_session?: { access_token: string; refresh_token: string } | null
      }>("/auth/signup", {
        email,
        password,
        name,
        role,
      })

      if (data && data.token) {
        setToken(data.token)
        await syncSupabaseSession(data.supabase_session ?? null)
        set({
          profile: data.user,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
          },
          session: { access_token: data.token },
        })
        return { error: null }
      }
      return { error: "Signup succeeded but no token was returned" }
    } catch (err: any) {
      return { error: err.message || "An error occurred during signup" }
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const data = await apiPost<{
        user: Profile
        token: string
        supabase_session?: { access_token: string; refresh_token: string } | null
      }>("/auth/login", {
        email,
        password,
      })

      if (data && data.token) {
        setToken(data.token)
        await syncSupabaseSession(data.supabase_session ?? null)
        set({
          profile: data.user,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
          },
          session: { access_token: data.token },
        })
        return { error: null }
      }
      return { error: "Login succeeded but no token was returned" }
    } catch (err: any) {
      return { error: err.message || "Invalid credentials or login error" }
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    removeToken()
    await clearSupabaseSession()
    set({ user: null, session: null, profile: null })
  },
}))
