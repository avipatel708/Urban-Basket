import { supabaseAdmin } from "./config/supabase.js";

async function check() {
  try {
    const { data, error } = await supabaseAdmin.from("coupons").select("*").limit(1);
    if (error) {
      console.log("❌ Table coupons check error:", error.message);
    } else {
      console.log("✅ Table coupons exists! Row count:", data.length);
    }
  } catch (err) {
    console.log("❌ Table coupons exception:", err.message);
  }
  
  try {
    const { data, error } = await supabaseAdmin.from("user_coupon_usage").select("*").limit(1);
    if (error) {
      console.log("❌ Table user_coupon_usage check error:", error.message);
    } else {
      console.log("✅ Table user_coupon_usage exists! Row count:", data.length);
    }
  } catch (err) {
    console.log("❌ Table user_coupon_usage exception:", err.message);
  }
  process.exit(0);
}

check();
