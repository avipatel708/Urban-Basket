import { randomUUID } from "crypto"
import { supabaseAdmin } from "../config/supabase.js"

export const REVIEW_IMAGES_BUCKET = "review-images"
const MAX_BYTES = 5 * 1024 * 1024

let bucketReady = false

/**
 * Create the public review-images bucket if it does not exist (service role).
 */
export async function ensureReviewImagesBucket() {
  if (bucketReady) return true

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) {
    console.warn("review-images: could not list buckets:", listError.message)
  } else if (buckets?.some((b) => b.name === REVIEW_IMAGES_BUCKET || b.id === REVIEW_IMAGES_BUCKET)) {
    bucketReady = true
    return true
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(REVIEW_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  })

  if (createError) {
    const msg = createError.message || ""
    if (msg.toLowerCase().includes("already exists")) {
      bucketReady = true
      return true
    }
    console.error("review-images bucket create failed:", msg)
    return false
  }

  console.log(`✅ Storage bucket "${REVIEW_IMAGES_BUCKET}" created.`)
  bucketReady = true
  return true
}

function extensionFromMime(mimeType) {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  }
  return map[mimeType] || "jpg"
}

export function parseDataUrlImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(dataUrl.trim())
  if (!match) return null

  const mimeType = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], "base64")
  if (!buffer.length) return null
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be under 5MB.")
  }
  return { mimeType, buffer }
}

export function isPublicImageUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url.trim())
}

/**
 * Upload one review image buffer to Supabase Storage and return public URL.
 */
export async function uploadReviewImageBuffer(buffer, mimeType, userId, productId) {
  if (!buffer?.length) {
    throw new Error("Empty image file.")
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be under 5MB.")
  }

  const ready = await ensureReviewImagesBucket()
  if (!ready) {
    throw new Error(
      'Review image storage is not set up. Run backend/migrations/review-images-storage.sql in Supabase SQL Editor, or create a public bucket named "review-images".'
    )
  }

  const ext = extensionFromMime(mimeType || "image/jpeg")
  const path = `${userId}/${productId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

  let { error } = await supabaseAdmin.storage.from(REVIEW_IMAGES_BUCKET).upload(path, buffer, {
    contentType: mimeType || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  })

  if (error?.message?.toLowerCase().includes("bucket not found")) {
    bucketReady = false
    await ensureReviewImagesBucket()
    const retry = await supabaseAdmin.storage.from(REVIEW_IMAGES_BUCKET).upload(path, buffer, {
      contentType: mimeType || "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    })
    error = retry.error
  }

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`)
  }

  const { data } = supabaseAdmin.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(path)
  const publicUrl = data?.publicUrl
  if (!publicUrl) {
    throw new Error("Failed to generate public image URL.")
  }
  return publicUrl
}

/**
 * Accept data URL or existing public URL; upload data URLs to storage.
 */
export async function resolveReviewImageUrl(input, userId, productId) {
  if (!input) return null
  if (isPublicImageUrl(input)) return input.trim()

  const parsed = parseDataUrlImage(input)
  if (!parsed) return null

  return uploadReviewImageBuffer(parsed.buffer, parsed.mimeType, userId, productId)
}

export async function resolveReviewImageUrls(inputs, userId, productId) {
  const list = Array.isArray(inputs) ? inputs : inputs ? [inputs] : []
  const urls = []

  for (const item of list.slice(0, 5)) {
    const url = await resolveReviewImageUrl(item, userId, productId)
    if (url && !urls.includes(url)) urls.push(url)
  }

  return urls
}
