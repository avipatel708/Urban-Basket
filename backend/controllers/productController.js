import { supabaseAdmin } from "../config/supabase.js"
import { notifyDealLive, notifyMajorDiscount } from "../services/notificationService.js"
import {
  parseSearchFilters,
  applyDatabaseFilters,
  filterAndRankProducts,
} from "../services/productSearchService.js"
import { buildSearchSuggestions } from "../services/searchSuggestionsService.js"
import { getProductRecommendations as buildRecommendations } from "../services/productRecommendationService.js"
import { attachVariantsToProduct } from "../services/productVariantService.js"

export const getProducts = async (req, res, next) => {
  try {
    const { featured, sellerId, limit = 10, offset = 0 } = req.query
    const filters = parseSearchFilters(req.query)
    const useSmartSearch = filters.smart

    let query = supabaseAdmin.from("products").select("*", { count: "exact" })

    if (featured === "true") {
      query = query.eq("is_featured", true)
    }
    if (sellerId) {
      query = query.eq("seller_id", sellerId)
    }

    query = applyDatabaseFilters(query, filters)

    if (!useSmartSearch) {
      if (filters.sort === "price_asc") {
        query = query.order("price", { ascending: true })
      } else if (filters.sort === "price_desc") {
        query = query.order("price", { ascending: false })
      } else if (filters.sort === "rating") {
        query = query.order("rating", { ascending: false })
      } else if (filters.sort === "popular") {
        query = query.order("review_count", { ascending: false })
      } else {
        query = query.order("created_at", { ascending: false })
      }
    } else if (filters.sort === "price_asc") {
      query = query.order("price", { ascending: true })
    } else if (filters.sort === "price_desc") {
      query = query.order("price", { ascending: false })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    const fetchLimit = useSmartSearch ? Math.max(parseInt(limit, 10) || 100, 100) : parseInt(limit, 10) || 10
    const from = parseInt(offset, 10) || 0
    const to = useSmartSearch ? from + fetchLimit - 1 : from + (parseInt(limit, 10) || 10) - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    let results = data || []
    if (useSmartSearch) {
      results = filterAndRankProducts(results, filters)
      if (parseInt(limit, 10) && results.length > parseInt(limit, 10)) {
        results = results.slice(0, parseInt(limit, 10))
      }
    }

    return res.status(200).json({ data: results, count: useSmartSearch ? results.length : count })
  } catch (err) {
    next(err)
  }
}

export const getSearchSuggestions = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.query || ""
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 12)
    const result = await buildSearchSuggestions(q, limit)
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export const getProductRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params
    const recentIds = String(req.query.recent || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const result = await buildRecommendations(id, { recentIds })

    if (!result) {
      return res.status(404).json({ error: "Product not found." })
    }

    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, profiles:seller_id(*)")
      .eq("id", id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: "Product not found." })
    }

    return res.status(200).json(attachVariantsToProduct(data))
  } catch (err) {
    next(err)
  }
}

export const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, image_url, stock, category, is_featured } = req.body
    const sellerId = req.user.id

    if (!title || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ error: "Missing required product fields (title, price, stock, category)" })
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        title,
        description,
        price: parseFloat(price),
        image_url,
        stock: parseInt(stock),
        seller_id: sellerId,
        category,
        is_featured: !!is_featured,
      })
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (data?.is_featured) {
      notifyDealLive(data).catch((err) => console.error("notifyDealLive failed:", err.message))
    }

    return res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const sellerId = req.user.id
    const updates = req.body

    // Ensure seller owns the product first
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("products")
      .select("seller_id, title, price, is_featured")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return res.status(404).json({ error: "Product not found." })
    }

    if (existing.seller_id !== sellerId) {
      return res.status(403).json({ error: "Unauthorized to update this product." })
    }

    const cleanUpdates = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.description !== undefined) cleanUpdates.description = updates.description
    if (updates.price !== undefined) cleanUpdates.price = parseFloat(updates.price)
    if (updates.image_url !== undefined) cleanUpdates.image_url = updates.image_url
    if (updates.stock !== undefined) cleanUpdates.stock = parseInt(updates.stock)
    if (updates.category !== undefined) cleanUpdates.category = updates.category
    if (updates.is_featured !== undefined) cleanUpdates.is_featured = !!updates.is_featured

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(cleanUpdates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const oldPrice = parseFloat(existing.price) || 0
    const newPrice = parseFloat(data.price) || 0
    const wasFeatured = !!existing.is_featured
    const isFeatured = !!data.is_featured

    if (!wasFeatured && isFeatured) {
      notifyDealLive(data).catch((err) => console.error("notifyDealLive failed:", err.message))
    }

    if (oldPrice > 0 && newPrice > 0 && newPrice <= oldPrice * 0.5) {
      notifyMajorDiscount(data, oldPrice, newPrice).catch((err) =>
        console.error("notifyMajorDiscount failed:", err.message)
      )
    }

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const sellerId = req.user.id

    // Ensure seller owns the product
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("products")
      .select("seller_id")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return res.status(404).json({ error: "Product not found." })
    }

    if (existing.seller_id !== sellerId) {
      return res.status(403).json({ error: "Unauthorized to delete this product." })
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: "Product deleted successfully." })
  } catch (err) {
    next(err)
  }
}

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." })
    }

    const file = req.file
    const fileExt = file.originalname.split(".").pop()
    const fileName = `${req.user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabaseAdmin.storage
      .from("product-images")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: true,
      })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(fileName)

    return res.status(200).json({ url: publicUrlData.publicUrl })
  } catch (err) {
    next(err)
  }
}
