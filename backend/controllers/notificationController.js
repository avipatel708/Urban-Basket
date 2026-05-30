import { supabaseAdmin } from "../config/supabase.js"
import { AUDIENCE, inferNotificationAudience } from "../services/notificationService.js"

function audienceForRole(role) {
  return role === "seller" ? AUDIENCE.SELLER : AUDIENCE.CUSTOMER
}

function filterByRole(notifications, role) {
  const target = audienceForRole(role)
  return (notifications || []).filter((n) => inferNotificationAudience(n) === target)
}

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role || "customer"

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(80)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const filtered = filterByRole(data, role).slice(0, 50)
    return res.status(200).json(filtered)
  } catch (err) {
    next(err)
  }
}

export const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role || "customer"
    const { id } = req.params

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: "Notification not found." })
    }

    if (inferNotificationAudience(existing) !== audienceForRole(role)) {
      return res.status(403).json({ error: "Notification not available for this account type." })
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id
    const role = req.user.role || "customer"
    const target = audienceForRole(role)

    const { data: all } = await supabaseAdmin
      .from("notifications")
      .select("id, title, audience")
      .eq("user_id", userId)
      .eq("is_read", false)

    const ids = filterByRole(all, role).map((n) => n.id)

    if (ids.length > 0) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids)

      if (error) {
        return res.status(400).json({ error: error.message })
      }
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
}
