import { supabaseAdmin, supabaseClient } from "../config/supabase.js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "urban-basket-jwt-secret-key-2026-production"

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

async function ensureProfile(user, fallback = {}) {
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (existing) return existing

  const name = fallback.name || user.user_metadata?.name || "User"
  const role = fallback.role || user.user_metadata?.role || "customer"
  const email = fallback.email || user.email

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: user.id, name, email, role }, { onConflict: "id" })
    .select("*")
    .single()

  if (insertError) {
    throw new Error("Profile creation failed: " + insertError.message)
  }
  return inserted
}

export const signup = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "Missing required fields (email, password, name, role)" })
    }

    if (role !== "customer" && role !== "seller") {
      return res.status(400).json({ error: "Role must be either 'customer' or 'seller'" })
    }

    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const user = authData.user

    let profile = null
    for (let i = 0; i < 5; i++) {
      try {
        profile = await ensureProfile(user, { name, email, role })
        break
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    if (!profile) {
      return res.status(500).json({ error: "User registered but profile creation failed. Please try signing in." })
    }

    const token = generateToken({ id: profile.id, email: profile.email, role: profile.role })

    const { data: signInData } = await supabaseClient.auth.signInWithPassword({ email, password })

    return res.status(201).json({
      user: profile,
      token,
      supabase_session: signInData?.session
        ? {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
          }
        : null,
    })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" })
    }

    // Authenticate user via Supabase client
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(401).json({ error: authError.message })
    }

    const user = authData.user

    let profile
    try {
      profile = await ensureProfile(user)
    } catch (err) {
      return res.status(500).json({ error: err.message || "Profile not found for this user." })
    }

    const token = generateToken({ id: profile.id, email: profile.email, role: profile.role })

    return res.status(200).json({
      user: profile,
      token,
      supabase_session: authData.session
        ? {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
          }
        : null,
    })
  } catch (err) {
    next(err)
  }
}

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error || !profile) {
      return res.status(404).json({ error: "Profile not found." })
    }

    return res.status(200).json({ user: profile })
  } catch (err) {
    next(err)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { name, avatar_url } = req.body

    const updates = {}
    if (name !== undefined) updates.name = name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ user: profile })
  } catch (err) {
    next(err)
  }
}
