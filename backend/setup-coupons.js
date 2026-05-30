import { supabaseAdmin } from "./config/supabase.js";
import fs from "fs";
import path from "path";

const sellerId = "5c4ac6d4-de4e-42df-938e-4d6a838a8466"; // avipatel seller id

const couponsToSeed = [
  {
    coupon_code: "WELCOME50",
    discount_type: "percentage",
    discount_value: 50,
    minimum_order_amount: 0,
    maximum_discount: 500,
    expiry_date: null, // never expires
    usage_limit: 0, // unlimited overall uses
    is_active: true,
    created_by: sellerId,
    first_order_only: true,
    random_discount_enabled: false,
  },
  {
    coupon_code: "SUMMER20",
    discount_type: "percentage",
    discount_value: 20,
    minimum_order_amount: 1500,
    maximum_discount: 500,
    expiry_date: null,
    usage_limit: 0,
    is_active: true,
    created_by: sellerId,
    first_order_only: false,
    user_specific_expiry: 30, // expires 30 days after user registration
    random_discount_enabled: false,
  },
  {
    coupon_code: "FESTIVE25",
    discount_type: "percentage",
    discount_value: 25,
    minimum_order_amount: 500,
    maximum_discount: 1000,
    expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    usage_limit: 500,
    is_active: true,
    created_by: sellerId,
    first_order_only: false,
    random_discount_enabled: true,
    random_discount_min: 10,
    random_discount_max: 25,
  },
  {
    coupon_code: "FREESHIP",
    discount_type: "fixed",
    discount_value: 399,
    minimum_order_amount: 2000,
    maximum_discount: 399,
    expiry_date: null,
    usage_limit: 0,
    is_active: true,
    created_by: sellerId,
    first_order_only: false,
    random_discount_enabled: false,
  },
];

async function setup() {
  console.log("Checking database for coupons and user_coupon_usage tables...");
  
  let couponsTableExists = false;
  let usageTableExists = false;

  try {
    const { error } = await supabaseAdmin.from("coupons").select("id").limit(1);
    if (error) {
      couponsTableExists = false;
    } else {
      couponsTableExists = true;
    }
  } catch (err) {
    couponsTableExists = false;
  }

  try {
    const { error } = await supabaseAdmin.from("user_coupon_usage").select("id").limit(1);
    if (error) {
      usageTableExists = false;
    } else {
      usageTableExists = true;
    }
  } catch (err) {
    usageTableExists = false;
  }

  if (!couponsTableExists || !usageTableExists) {
    console.log("\n⚠️  DATABASE TABLES MISSING!");
    console.log("Please run the following SQL inside the Supabase SQL Editor to create the necessary tables:\n");
    
    try {
      const sqlContent = fs.readFileSync(path.join("migrations", "coupon-tables.sql"), "utf8");
      console.log("------------------ SQL MIGRATION START ------------------");
      console.log(sqlContent);
      console.log("------------------ SQL MIGRATION END --------------------");
    } catch (e) {
      console.log("Could not load SQL file. Please open `backend/migrations/coupon-tables.sql` and run its contents.");
    }
    
    console.log("\nAfter running the SQL in the editor, please run this script again to seed the coupons.");
    process.exit(1);
  }

  console.log("✅ Tables exist! Seeding coupons...");

  for (const coupon of couponsToSeed) {
    try {
      // Check if coupon already exists
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from("coupons")
        .select("id")
        .eq("coupon_code", coupon.coupon_code)
        .maybeSingle();

      if (fetchError) {
        console.error(`Error checking coupon ${coupon.coupon_code}:`, fetchError.message);
        continue;
      }

      if (existing) {
        console.log(`ℹ️  Coupon ${coupon.coupon_code} already exists. Skipping.`);
        continue;
      }

      const { data, error: insertError } = await supabaseAdmin
        .from("coupons")
        .insert(coupon)
        .select("coupon_code");

      if (insertError) {
        console.error(`❌ Failed to insert coupon ${coupon.coupon_code}:`, insertError.message);
      } else {
        console.log(`✅ Seeded coupon: ${coupon.coupon_code}`);
      }
    } catch (err) {
      console.error(`❌ Exception seeding coupon ${coupon.coupon_code}:`, err.message);
    }
  }

  console.log("\nDone setup!");
  process.exit(0);
}

setup();
