import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"
import { supabaseAdmin } from "../config/supabase.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "..", "data")
const COUPONS_FILE = path.join(DATA_DIR, "coupons.json")
const USAGE_FILE = path.join(DATA_DIR, "coupon-usage.json")

let storageMode = null // "database" | "file"

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8")
}

export async function detectCouponStorageMode() {
  if (storageMode) return storageMode

  const { error } = await supabaseAdmin.from("coupons").select("id").limit(1)
  storageMode = error ? "file" : "database"

  if (storageMode === "file") {
    console.warn("⚠️  Coupon tables not found in Supabase — using local file storage.")
    console.warn("   Run backend/migrations/coupon-tables.sql in Supabase SQL Editor to use the database.")
    await ensureFileStorage()
  } else {
    console.log("✅ Coupon database tables detected.")
  }

  return storageMode
}

export function getCouponStorageMode() {
  return storageMode || "file"
}

async function ensureFileStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  const coupons = await readJsonFile(COUPONS_FILE, null)
  if (!coupons) {
    await writeJsonFile(COUPONS_FILE, [])
  }

  const usage = await readJsonFile(USAGE_FILE, null)
  if (!usage) {
    await writeJsonFile(USAGE_FILE, [])
  }

  await seedDefaultCoupons()
}

const DEFAULT_SELLER_ID = "5c4ac6d4-de4e-42df-938e-4d6a838a8466"

const DEFAULT_COUPONS = [
  {
    coupon_code: "WELCOME50",
    discount_type: "percentage",
    discount_value: 50,
    minimum_order_amount: 0,
    maximum_discount: 500,
    expiry_date: null,
    usage_limit: 0,
    is_active: true,
    created_by: DEFAULT_SELLER_ID,
    first_order_only: true,
    user_specific_expiry: 0,
    random_discount_enabled: false,
    random_discount_min: 0,
    random_discount_max: 0,
  },
]

async function seedDefaultCoupons() {
  const coupons = await readJsonFile(COUPONS_FILE, [])
  let changed = false

  for (const defaultCoupon of DEFAULT_COUPONS) {
    const existingIndex = coupons.findIndex(
      (coupon) => coupon.coupon_code.toUpperCase() === defaultCoupon.coupon_code.toUpperCase()
    )

    if (existingIndex === -1) {
      coupons.unshift(
        normalizeCoupon({
          id: randomUUID(),
          used_count: 0,
          created_at: new Date().toISOString(),
          ...defaultCoupon,
        })
      )
      changed = true
      continue
    }

    const existing = coupons[existingIndex]
    if (defaultCoupon.coupon_code === "WELCOME50" && !existing.first_order_only) {
      coupons[existingIndex] = normalizeCoupon({
        ...existing,
        first_order_only: true,
        user_specific_expiry: 0,
        is_active: true,
      })
      changed = true
    }
  }

  if (changed) {
    await writeJsonFile(COUPONS_FILE, coupons)
  }
}

function normalizeCoupon(record) {
  return {
    ...record,
    discount_value: parseFloat(record.discount_value),
    minimum_order_amount: parseFloat(record.minimum_order_amount || 0),
    maximum_discount: record.maximum_discount != null ? parseFloat(record.maximum_discount) : null,
    usage_limit: parseInt(record.usage_limit || 0, 10),
    used_count: parseInt(record.used_count || 0, 10),
    user_specific_expiry: parseInt(record.user_specific_expiry || 0, 10),
    random_discount_min: parseFloat(record.random_discount_min || 0),
    random_discount_max: parseFloat(record.random_discount_max || 0),
    is_active: record.is_active !== false,
    first_order_only: !!record.first_order_only,
    random_discount_enabled: !!record.random_discount_enabled,
  }
}

async function findCouponByCode(couponCode) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .ilike("coupon_code", couponCode.trim())
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch coupon: ${error.message}`)
    }

    return data
  }

  const coupons = await readJsonFile(COUPONS_FILE, [])
  return coupons.find(
    (coupon) => coupon.coupon_code.toUpperCase() === couponCode.trim().toUpperCase()
  ) || null
}

async function getUserCouponUsage(userId, couponId) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("user_coupon_usage")
      .select("id")
      .eq("user_id", userId)
      .eq("coupon_id", couponId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check coupon usage: ${error.message}`)
    }

    return data
  }

  const usage = await readJsonFile(USAGE_FILE, [])
  return usage.find((entry) => entry.user_id === userId && entry.coupon_id === couponId) || null
}

async function getUserOrderCount(userId) {
  const { count, error } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  if (error) {
    const usage = await readJsonFile(USAGE_FILE, [])
    const hasCompletedCouponOrder = usage.some((entry) => entry.user_id === userId)
    return hasCompletedCouponOrder ? 1 : 0
  }

  return count || 0
}

async function getUserProfileCreatedAt(userId) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .single()

    if (error || !data) {
      throw new Error("Could not verify user registration details for this coupon.")
    }

    return data.created_at
  }

  return new Date().toISOString()
}

async function listCouponsBySeller(sellerId) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("created_by", sellerId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  const coupons = await readJsonFile(COUPONS_FILE, [])
  return coupons
    .filter((coupon) => coupon.created_by === sellerId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

async function insertCoupon(couponData) {
  const mode = await detectCouponStorageMode()
  const record = normalizeCoupon({
    id: randomUUID(),
    used_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    ...couponData,
  })

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .insert(record)
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        throw new Error("A coupon with this code already exists.")
      }
      if (error.code === "23503") {
        throw new Error("Seller profile not found. Please log out and log in again.")
      }
      throw new Error(error.message)
    }

    return data
  }

  const coupons = await readJsonFile(COUPONS_FILE, [])
  const duplicate = coupons.find(
    (coupon) => coupon.coupon_code.toUpperCase() === record.coupon_code.toUpperCase()
  )

  if (duplicate) {
    throw new Error("A coupon with this code already exists.")
  }

  coupons.unshift(record)
  await writeJsonFile(COUPONS_FILE, coupons)
  return record
}

async function updateCouponRecord(couponId, updates, sellerId) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .update(updates)
      .eq("id", couponId)
      .eq("created_by", sellerId)
      .select("*")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  const coupons = await readJsonFile(COUPONS_FILE, [])
  const index = coupons.findIndex(
    (coupon) => coupon.id === couponId && coupon.created_by === sellerId
  )

  if (index === -1) {
    throw new Error("Coupon not found.")
  }

  coupons[index] = normalizeCoupon({ ...coupons[index], ...updates })
  await writeJsonFile(COUPONS_FILE, coupons)
  return coupons[index]
}

async function deleteCouponRecord(couponId, sellerId) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { error } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("id", couponId)
      .eq("created_by", sellerId)

    if (error) {
      throw new Error(error.message)
    }

    return { message: "Coupon deleted successfully." }
  }

  const coupons = await readJsonFile(COUPONS_FILE, [])
  const nextCoupons = coupons.filter(
    (coupon) => !(coupon.id === couponId && coupon.created_by === sellerId)
  )

  if (nextCoupons.length === coupons.length) {
    throw new Error("Coupon not found.")
  }

  await writeJsonFile(COUPONS_FILE, nextCoupons)

  const usage = await readJsonFile(USAGE_FILE, [])
  await writeJsonFile(
    USAGE_FILE,
    usage.filter((entry) => entry.coupon_id !== couponId)
  )

  return { message: "Coupon deleted successfully." }
}

async function recordUsage(userId, couponId, discountReceived) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    const { data, error } = await supabaseAdmin
      .from("user_coupon_usage")
      .insert({
        user_id: userId,
        coupon_id: couponId,
        discount_received: parseFloat(discountReceived),
      })
      .select("*")
      .single()

    if (error) {
      throw new Error(`Failed to record coupon usage: ${error.message}`)
    }

    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("used_count")
      .eq("id", couponId)
      .single()

    if (coupon) {
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: (coupon.used_count || 0) + 1 })
        .eq("id", couponId)
    }

    return data
  }

  const usage = await readJsonFile(USAGE_FILE, [])
  const duplicate = usage.find(
    (entry) => entry.user_id === userId && entry.coupon_id === couponId
  )

  if (duplicate) {
    throw new Error("You have already used this coupon code.")
  }

  const usageRecord = {
    id: randomUUID(),
    user_id: userId,
    coupon_id: couponId,
    discount_received: parseFloat(discountReceived),
    used_at: new Date().toISOString(),
  }

  usage.push(usageRecord)
  await writeJsonFile(USAGE_FILE, usage)

  const coupons = await readJsonFile(COUPONS_FILE, [])
  const couponIndex = coupons.findIndex((coupon) => coupon.id === couponId)
  if (couponIndex !== -1) {
    coupons[couponIndex].used_count = (coupons[couponIndex].used_count || 0) + 1
    await writeJsonFile(COUPONS_FILE, coupons)
  }

  return usageRecord
}

async function getUsageForCoupons(couponIds) {
  const mode = await detectCouponStorageMode()

  if (mode === "database") {
    if (couponIds.length === 0) return []

    const { data, error } = await supabaseAdmin
      .from("user_coupon_usage")
      .select("discount_received")
      .in("coupon_id", couponIds)

    if (error) {
      return []
    }

    return data || []
  }

  const usage = await readJsonFile(USAGE_FILE, [])
  return usage.filter((entry) => couponIds.includes(entry.coupon_id))
}

export const couponStore = {
  detectCouponStorageMode,
  findCouponByCode,
  getUserCouponUsage,
  getUserOrderCount,
  getUserProfileCreatedAt,
  listCouponsBySeller,
  insertCoupon,
  updateCouponRecord,
  deleteCouponRecord,
  recordUsage,
  getUsageForCoupons,
}
