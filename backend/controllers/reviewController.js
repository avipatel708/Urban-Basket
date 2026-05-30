import { supabaseAdmin } from "../config/supabase.js"
import { createNotification, AUDIENCE } from "../services/notificationService.js"
import {
  isPublicImageUrl,
  resolveReviewImageUrls,
} from "../services/reviewStorageService.js"

const EMBED_PHOTO_PREFIX = "[[UB_PHOTO::"
const EMBED_PHOTO_SUFFIX = "::]]"

function embedPhotoInComment(comment, photoUrl) {
  if (!photoUrl) return comment || null
  const base = (comment || "").trim()
  return `${base}${base ? "\n\n" : ""}${EMBED_PHOTO_PREFIX}${photoUrl}${EMBED_PHOTO_SUFFIX}`
}

function extractEmbeddedPhoto(comment) {
  const text = String(comment || "")
  const start = text.indexOf(EMBED_PHOTO_PREFIX)
  const end = text.indexOf(EMBED_PHOTO_SUFFIX, start + EMBED_PHOTO_PREFIX.length)
  if (start === -1 || end === -1) {
    return { comment: comment || null, photo_url: null }
  }

  const photo = text.slice(start + EMBED_PHOTO_PREFIX.length, end).trim() || null
  const cleaned = `${text.slice(0, start)}${text.slice(end + EMBED_PHOTO_SUFFIX.length)}`.trim()
  return { comment: cleaned || null, photo_url: photo }
}

function normalizeImageList(photoUrl, reviewImages, comment) {
  const urls = []

  if (Array.isArray(reviewImages)) {
    reviewImages.forEach((u) => {
      if (typeof u === "string" && u.trim() && !urls.includes(u)) urls.push(u.trim())
    })
  }

  if (photoUrl && typeof photoUrl === "string" && photoUrl.trim() && !urls.includes(photoUrl.trim())) {
    urls.unshift(photoUrl.trim())
  }

  if (!urls.length) {
    const legacy = extractEmbeddedPhoto(comment)
    if (legacy.photo_url) urls.push(legacy.photo_url)
    return { comment: legacy.comment, photo_url: legacy.photo_url, review_images: [] }
  }

  const primary = urls.find((u) => isPublicImageUrl(u) || u.startsWith("data:image/")) || urls[0]
  return {
    comment: extractEmbeddedPhoto(comment).comment,
    photo_url: primary,
    review_images: urls,
  }
}

async function insertReview(row) {
  let result = await supabaseAdmin.from("reviews").insert(row).select("*").single()

  if (result.error?.message?.includes("review_images")) {
    const { review_images: _ri, ...withoutImages } = row
    result = await supabaseAdmin.from("reviews").insert(withoutImages).select("*").single()
  }

  if (result.error?.message?.includes("photo_url") || result.error?.message?.includes("order_id")) {
    const { photo_url, order_id: _o, review_images: _ri, ...legacy } = row
    legacy.comment = embedPhotoInComment(legacy.comment, photo_url)
    result = await supabaseAdmin.from("reviews").insert(legacy).select("*").single()
  }

  return result
}

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params

    let { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("id, product_id, user_id, rating, comment, photo_url, review_images, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error?.message?.includes("review_images") || error?.message?.includes("photo_url")) {
      const fallback = await supabaseAdmin
        .from("reviews")
        .select("id, product_id, user_id, rating, comment, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
      reviews = (fallback.data || []).map((r) => ({ ...r, photo_url: null, review_images: [] }))
      error = fallback.error
    }

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const userIds = [...new Set((reviews || []).map((r) => r.user_id).filter(Boolean))]
    const profileMap = new Map()

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds)

      ;(profiles || []).forEach((p) => profileMap.set(p.id, p))
    }

    const enriched = (reviews || []).map((r) => {
      const images = normalizeImageList(r.photo_url, r.review_images, r.comment)
      return {
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        comment: images.comment,
        photo_url: images.photo_url,
        review_images: images.review_images,
        created_at: r.created_at,
        author: profileMap.get(r.user_id)?.name || "Customer",
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
      }
    })

    return res.status(200).json(enriched)
  } catch (err) {
    next(err)
  }
}

export const getMyReviewedProductIds = async (req, res, next) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("product_id")
      .eq("user_id", userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    const productIds = (data || []).map((r) => r.product_id)
    return res.status(200).json({ product_ids: productIds })
  } catch (err) {
    next(err)
  }
}

export const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { product_id, order_id, rating, comment, photo_url, photo_urls } = req.body

    if (!product_id || !order_id) {
      return res.status(400).json({ error: "Product ID and order ID are required." })
    }

    const stars = parseInt(rating, 10)
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5 stars." })
    }

    const trimmedComment = (comment || "").trim()
    if (trimmedComment.length > 2000) {
      return res.status(400).json({ error: "Review comment is too long (max 2000 characters)." })
    }

    const rawInputs = [
      ...(Array.isArray(photo_urls) ? photo_urls : []),
      ...(photo_url ? [photo_url] : []),
    ]

    let uploadedUrls = []
    if (rawInputs.length > 0) {
      try {
        uploadedUrls = await resolveReviewImageUrls(rawInputs, userId, product_id)
      } catch (uploadErr) {
        return res.status(400).json({ error: uploadErr.message || "Failed to upload review images." })
      }
    }

    const primaryPhotoUrl = uploadedUrls[0] || null

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", order_id)
      .eq("user_id", userId)
      .single()

    if (orderError || !order) {
      return res.status(403).json({ error: "Order not found or access denied." })
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        error: "You can review products only after your order is delivered.",
      })
    }

    const { data: orderItem, error: itemError } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .limit(1)

    if (itemError || !orderItem?.length) {
      return res.status(400).json({ error: "This product was not part of the selected order." })
    }

    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("product_id", product_id)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      return res.status(400).json({ error: "You have already reviewed this product." })
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, title, seller_id")
      .eq("id", product_id)
      .single()

    if (productError || !product) {
      return res.status(404).json({ error: "Product not found." })
    }

    const reviewRow = {
      product_id,
      user_id: userId,
      rating: stars,
      comment: trimmedComment || null,
      photo_url: primaryPhotoUrl,
      review_images: uploadedUrls,
      order_id,
    }

    const { data: review, error: reviewError } = await insertReview(reviewRow)

    if (reviewError) {
      if (reviewError.code === "23505") {
        return res.status(400).json({ error: "You have already reviewed this product." })
      }
      return res.status(400).json({ error: reviewError.message })
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle()

    const customerName = profile?.name || "A customer"
    const starsLabel = "★".repeat(stars) + "☆".repeat(5 - stars)

    if (product.seller_id) {
      await createNotification(product.seller_id, {
        title: "New product review",
        message: `${customerName} rated "${product.title}" ${stars}/5 (${starsLabel}).${trimmedComment ? ` "${trimmedComment.slice(0, 80)}${trimmedComment.length > 80 ? "…" : ""}"` : ""}${primaryPhotoUrl ? " Includes a photo." : ""}`,
        type: "info",
        audience: AUDIENCE.SELLER,
      }).catch((err) => console.error("seller review notification failed:", err.message))
    }

    const normalized = normalizeImageList(review.photo_url, review.review_images, review.comment)

    return res.status(201).json({
      ...review,
      comment: normalized.comment,
      photo_url: normalized.photo_url,
      review_images: normalized.review_images,
      author: customerName,
    })
  } catch (err) {
    next(err)
  }
}
