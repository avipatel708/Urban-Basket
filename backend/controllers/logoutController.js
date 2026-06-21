import { supabaseClient } from "../config/supabase.js";
import jwt from "jsonwebtoken";

// Logout handler
export const logout = async (req, res, next) => {
  try {
    // Invalidate Supabase session (client-side sign out)
    await supabaseClient.auth.signOut();
    // Clear JWT cookie if set (assuming cookie-based auth)
    res.clearCookie('token');
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Logout failed" });
  }
};
