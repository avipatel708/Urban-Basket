import jwt from "jsonwebtoken"
import { supabaseAdmin } from "../config/supabase.js"
import { chatWithAI, generateProductListing } from "../services/aiService.js"
import { executeVoiceSearch } from "../services/voiceSearchService.js"

/**
 * Handle conversational AI chat for customers (with optional Order tracking if authorized)
 */
export const handleChat = async (req, res, next) => {
  try {
    const { query, history } = req.body
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter in request body." })
    }

    // 1. Resolve optional user ID from authorization header
    let userId = null
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "urban-basket-jwt-secret-key-2026-production")
        userId = decoded.id
      } catch (err) {
        // Log verification error but let the user chat as guest
        console.warn("Guest session verified: Invalid or expired token.")
      }
    }

    // 2. Fetch all products from database for recommendation matching
    const { data: products, error: productsErr } = await supabaseAdmin
      .from("products")
      .select("*")
      .limit(100)

    if (productsErr) {
      throw productsErr
    }

    // 3. Fetch user orders if logged in
    let orders = []
    if (userId) {
      const { data: fetchedOrders, error: ordersErr } = await supabaseAdmin
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          created_at,
          order_items (
            id,
            quantity,
            price,
            product_id,
            products (
              title
            )
          )
        `)
        .eq("customer_id", userId)
        .order("created_at", { ascending: false })
        .limit(3)

      if (!ordersErr && fetchedOrders) {
        orders = fetchedOrders
      }
    }

    // 4. Invoke AI chat service (with history passed as 4th parameter)
    const chatResult = await chatWithAI(query, products || [], orders, history || [])
    return res.status(200).json(chatResult)
  } catch (err) {
    next(err)
  }
}

/**
 * AI-powered voice search: natural language → structured filters → ranked products.
 */
export const handleVoiceSearch = async (req, res, next) => {
  try {
    const { query } = req.body
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: "Query is required in request body." })
    }

    const result = await executeVoiceSearch(String(query).trim())
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

/**
 * Handle listing generation (Title, Desc, SEO Tags) for sellers
 */
export const handleProductDescription = async (req, res, next) => {
  try {
    const { keywords } = req.body
    if (!keywords) {
      return res.status(400).json({ error: "Missing keywords parameter in request body." })
    }

    const listingResult = await generateProductListing(keywords)
    return res.status(200).json(listingResult)
  } catch (err) {
    next(err)
  }
}
