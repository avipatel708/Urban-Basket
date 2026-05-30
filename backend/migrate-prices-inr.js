/**
 * One-time: convert legacy USD seed prices to INR in Supabase.
 * Run: node migrate-prices-inr.js
 */
import { supabaseAdmin } from "./config/supabase.js"

const USD_TO_INR = {
  349.99: 2999,
  599.99: 4999,
  189.99: 1899,
  129.99: 1299,
  249.99: 2499,
  89.99: 899,
  199.99: 1999,
  159.99: 1599,
  179.99: 1799,
  79.99: 799,
  219.99: 2199,
  299.99: 2999,
  1899.99: 189999,
}

async function migrate() {
  const { data: products, error } = await supabaseAdmin.from("products").select("id, price, title")
  if (error) {
    console.error("Failed to fetch products:", error.message)
    process.exit(1)
  }

  let updated = 0
  for (const p of products || []) {
    const inr = USD_TO_INR[p.price]
    if (inr == null) continue

    const { error: upErr } = await supabaseAdmin.from("products").update({ price: inr }).eq("id", p.id)
    if (upErr) {
      console.error(`Failed ${p.title}:`, upErr.message)
      continue
    }
    console.log(`✓ ${p.title}: ${p.price} → ₹${inr}`)
    updated++
  }

  console.log(`\nDone. Updated ${updated} product(s).`)
  process.exit(0)
}

migrate()
