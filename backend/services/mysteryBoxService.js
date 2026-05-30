import { readFileSync } from "fs"
import fs from "fs/promises"
import { randomUUID } from "crypto"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { supabaseAdmin } from "../config/supabase.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEED_PATH = join(__dirname, "../data/mystery-boxes-seed.json")
const REWARDS_FILE = join(__dirname, "../data/mystery-box-rewards.json")

let schemaReady = null
let rewardsStorageMode = null
let seedCache = null

function isMissingTableError(message = "") {
  return message.includes("does not exist") || message.includes("schema cache")
}

export async function detectMysteryBoxSchema() {
  if (schemaReady !== null) return schemaReady
  const { error } = await supabaseAdmin.from("mystery_boxes").select("id").limit(1)
  schemaReady = !error || !isMissingTableError(error.message)
  return schemaReady
}

export async function detectMysteryRewardsSchema() {
  if (rewardsStorageMode === "database") return true
  if (rewardsStorageMode === "file") return false

  const { error } = await supabaseAdmin.from("mystery_box_rewards").select("id").limit(1)
  if (!error || !isMissingTableError(error.message)) {
    rewardsStorageMode = "database"
    return true
  }

  rewardsStorageMode = "file"
  console.warn("⚠️  Mystery box rewards table not found — using local file storage.")
  console.warn("   Run backend/migrations/mystery-boxes.sql in Supabase SQL Editor.")
  await ensureRewardsFile()
  return false
}

async function ensureRewardsFile() {
  try {
    await fs.access(REWARDS_FILE)
  } catch {
    await fs.mkdir(join(__dirname, "../data"), { recursive: true })
    await fs.writeFile(REWARDS_FILE, "[]", "utf8")
  }
}

async function readRewardsFile() {
  await ensureRewardsFile()
  try {
    const raw = await fs.readFile(REWARDS_FILE, "utf8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeRewardsFile(rewards) {
  await fs.mkdir(join(__dirname, "../data"), { recursive: true })
  await fs.writeFile(REWARDS_FILE, JSON.stringify(rewards, null, 2), "utf8")
}

async function attachBoxMeta(reward, includePrice = false) {
  const box = await getMysteryBoxById(reward.mystery_box_id)
  if (!box) return reward

  const mystery_boxes = {
    title: box.title,
    slug: box.slug,
    image_url: box.image_url,
    tier: box.tier,
  }
  if (includePrice && box.price !== undefined) {
    mystery_boxes.price = box.price
  }

  return { ...reward, mystery_boxes }
}

async function saveMysteryRewardToFile(payload) {
  const rewards = await readRewardsFile()
  const reward = {
    id: randomUUID(),
    ...payload,
    created_at: new Date().toISOString(),
  }
  rewards.unshift(reward)
  await writeRewardsFile(rewards.slice(0, 1000))
  return reward
}

async function getFileRewardsForUser(userId, includePrice = false) {
  const rewards = await readRewardsFile()
  const userRewards = rewards.filter((r) => r.user_id === userId)
  return Promise.all(userRewards.map((r) => attachBoxMeta(r, includePrice)))
}

function loadSeedBoxes() {
  if (!seedCache) {
    seedCache = JSON.parse(readFileSync(SEED_PATH, "utf8"))
  }
  return seedCache
}

export async function listMysteryBoxes() {
  const hasTable = await detectMysteryBoxSchema()
  if (!hasTable) {
    return loadSeedBoxes().filter((b) => b.is_active !== false)
  }

  const { data, error } = await supabaseAdmin
    .from("mystery_boxes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("listMysteryBoxes:", error.message)
    return loadSeedBoxes()
  }
  if (!data?.length) {
    return loadSeedBoxes()
  }
  return data
}

export async function getMysteryBoxById(id) {
  const hasTable = await detectMysteryBoxSchema()
  if (!hasTable) {
    return loadSeedBoxes().find((b) => b.id === id || b.slug === id) || null
  }

  const { data, error } = await supabaseAdmin
    .from("mystery_boxes")
    .select("*")
    .or(`id.eq.${id},slug.eq.${id}`)
    .eq("is_active", true)
    .maybeSingle()

  if (error || !data) {
    return loadSeedBoxes().find((b) => b.id === id || b.slug === id) || null
  }
  return data
}

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Build eligible product pool for a mystery box.
 * @param {{ relaxed?: boolean }} options - When relaxed, skip tier-specific price filters.
 */
async function fetchEligibleProducts(box, { relaxed = false } = {}) {
  const boxPrice = parseFloat(box.price)
  const tier = box.tier

  let query = supabaseAdmin
    .from("products")
    .select("id, title, price, image_url, stock, category, seller_id")
    .gt("stock", 0)
    .gt("price", 0)

  if (box.category_filter) {
    query = query.eq("category", box.category_filter)
  }

  const { data, error } = await query.limit(200)
  if (error) throw new Error(error.message)

  let pool = (data || []).map((p) => ({
    ...p,
    price: parseFloat(p.price),
  }))

  if (!relaxed) {
    if (tier === "budget") {
      pool.sort((a, b) => a.price - b.price)
    } else if (tier === "premium") {
      pool = pool.filter((p) => p.price >= boxPrice * 0.25)
    } else if (tier === "gaming") {
      pool = pool.filter(
        (p) =>
          p.category === "toys" ||
          p.category === "electronics" ||
          (p.title || "").toLowerCase().match(/game|gaming|console|headset|keyboard|mouse/)
      )
      if (pool.length < box.min_items) {
        const { data: extra } = await supabaseAdmin
          .from("products")
          .select("id, title, price, image_url, stock, category, seller_id")
          .gt("stock", 0)
          .in("category", ["toys", "electronics"])
          .limit(100)
        pool = (extra || []).map((p) => ({ ...p, price: parseFloat(p.price) }))
      }
    }
  }

  return pool
}

async function buildProductPool(box) {
  let pool = await fetchEligibleProducts(box)
  const minItems = box.min_items || 1

  if (pool.length >= minItems) return pool

  pool = await fetchEligibleProducts(box, { relaxed: true })
  if (pool.length >= minItems) return pool

  if (box.category_filter) {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, title, price, image_url, stock, category, seller_id")
      .gt("stock", 0)
      .gt("price", 0)
      .limit(200)

    if (error) throw new Error(error.message)
    pool = (data || []).map((p) => ({ ...p, price: parseFloat(p.price) }))
  }

  return pool
}

/**
 * Fair random selection: retail sum >= box price * multiplier, no duplicate products.
 */
export async function selectRandomProducts(box) {
  const boxPrice = parseFloat(box.price)
  const minRetail = boxPrice * (parseFloat(box.min_retail_multiplier) || 1.0)
  const minItems = box.min_items || 1
  const maxItems = box.max_items || 3

  const pool = await buildProductPool(box)
  if (pool.length < minItems) {
    throw new Error(
      "Not enough products in stock for this mystery box. Please try again later."
    )
  }

  const shuffled = shuffle(pool)
  const selected = []
  const usedIds = new Set()
  let retailTotal = 0

  for (const product of shuffled) {
    if (selected.length >= maxItems) break
    if (usedIds.has(product.id)) continue
    if (product.stock < 1) continue

    selected.push({
      product_id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
      category: product.category,
    })
    usedIds.add(product.id)
    retailTotal += product.price
  }

  if (selected.length < minItems) {
    throw new Error("Could not build a valid mystery reward. Try again shortly.")
  }

  if (retailTotal < minRetail) {
    for (const product of shuffled) {
      if (selected.length >= maxItems) break
      if (usedIds.has(product.id)) continue
      if (retailTotal >= minRetail) break

      selected.push({
        product_id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        image_url: product.image_url,
        category: product.category,
      })
      usedIds.add(product.id)
      retailTotal += product.price
    }
  }

  if (retailTotal < minRetail) {
    throw new Error(
      `Unable to meet minimum value (₹${minRetail.toFixed(0)}) for this box. Pool may be low — check back soon.`
    )
  }

  return {
    products: selected,
    total_retail_value: parseFloat(retailTotal.toFixed(2)),
  }
}

export async function decrementMysteryBoxStock(boxId) {
  const hasTable = await detectMysteryBoxSchema()
  if (!hasTable) return

  const { data: box } = await supabaseAdmin
    .from("mystery_boxes")
    .select("stock")
    .eq("id", boxId)
    .single()

  if (box && box.stock > 0) {
    await supabaseAdmin
      .from("mystery_boxes")
      .update({ stock: Math.max(0, box.stock - 1) })
      .eq("id", boxId)
  }
}

export async function decrementProductStock(items) {
  for (const item of items) {
    const { error } = await supabaseAdmin.rpc("decrease_stock", {
      p_id: item.product_id,
      qty: item.quantity,
    })

    if (error) {
      const { data: prod } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity)
        await supabaseAdmin.from("products").update({ stock: newStock }).eq("id", item.product_id)
      }
    }
  }
}

export async function saveMysteryReward({
  userId,
  mysteryBoxId,
  orderId,
  products,
  totalRetailValue,
  boxPrice,
}) {
  const payload = {
    user_id: userId,
    mystery_box_id: mysteryBoxId,
    order_id: orderId,
    products,
    total_retail_value: totalRetailValue,
    box_price: boxPrice,
  }

  const useDb = await detectMysteryRewardsSchema()
  if (useDb) {
    const { data, error } = await supabaseAdmin
      .from("mystery_box_rewards")
      .insert(payload)
      .select("*")
      .single()

    if (!error) return data
    if (!isMissingTableError(error.message)) {
      throw new Error(error.message)
    }
    rewardsStorageMode = "file"
    await ensureRewardsFile()
  }

  return saveMysteryRewardToFile(payload)
}

export async function getUserMysteryRewards(userId) {
  const useDb = await detectMysteryRewardsSchema()
  if (useDb) {
    const { data, error } = await supabaseAdmin
      .from("mystery_box_rewards")
      .select(
        `
      *,
      mystery_boxes ( title, slug, image_url, tier )
    `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (!error) return data || []
    if (!isMissingTableError(error.message)) {
      console.error("getUserMysteryRewards:", error.message)
    } else {
      rewardsStorageMode = "file"
    }
  }

  return getFileRewardsForUser(userId)
}

export async function getMysteryRewardById(rewardId, userId) {
  const useDb = await detectMysteryRewardsSchema()
  if (useDb) {
    const { data, error } = await supabaseAdmin
      .from("mystery_box_rewards")
      .select(
        `
      *,
      mystery_boxes ( title, slug, image_url, tier, price )
    `
      )
      .eq("id", rewardId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!error) return data
    if (!isMissingTableError(error.message)) {
      throw new Error(error.message)
    }
    rewardsStorageMode = "file"
  }

  const rewards = await readRewardsFile()
  const reward = rewards.find((r) => r.id === rewardId && r.user_id === userId)
  if (!reward) return null
  return attachBoxMeta(reward, true)
}
