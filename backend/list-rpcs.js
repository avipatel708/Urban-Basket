import { supabaseAdmin } from "./config/supabase.js";

async function listRpcs() {
  const { data, error } = await supabaseAdmin.rpc("get_rpcs");
  if (error) {
    console.log("Error querying get_rpcs rpc:", error.message);
  } else {
    console.log("RPCS:", data);
  }
}

listRpcs();
