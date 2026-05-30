import { supabaseAdmin } from "./config/supabase.js";

async function check() {
  try {
    const { data, error } = await supabaseAdmin.from("orders").select("*").limit(1);
    if (error) {
      console.log("Error querying orders:", error.message);
    } else {
      console.log("Orders columns check:", data.length > 0 ? Object.keys(data[0]) : "No orders found to inspect keys.");
    }
  } catch (err) {
    console.log("Exception querying orders:", err.message);
  }
  process.exit(0);
}

check();
