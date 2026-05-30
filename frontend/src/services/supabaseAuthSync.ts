import { supabase } from "@/supabase/client"

export async function syncSupabaseSession(session: {
  access_token: string
  refresh_token: string
} | null) {
  if (!session?.access_token || !session?.refresh_token) return
  try {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
  } catch (err) {
    console.warn("Supabase session sync failed:", err)
  }
}

export async function clearSupabaseSession() {
  try {
    await supabase.auth.signOut()
  } catch {
    /* ignore */
  }
}
