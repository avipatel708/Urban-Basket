import { supabaseAdmin } from "./config/supabase.js";

const sellerId = "5c4ac6d4-de4e-42df-938e-4d6a838a8466"; // avipatel seller id

const gadgets = [
  {
    title: "Neo-Book Pro 16\" Laptop",
    description: "A high-performance computing powerhouse with 16-core neural processor, liquid retina display, and all-day battery life. Designed for professionals and creators.",
    price: 1499.99,
    image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80",
    stock: 15,
    seller_id: sellerId,
    category: "electronics",
    is_featured: true,
  },
  {
    title: "Aero-Book Gaming Laptop",
    description: "Unrivaled high-framerate gameplay with dedicated AI-powered ray tracing, liquid metal cooling, and 240Hz screen. Optimized for next-gen performance.",
    price: 1899.99,
    image_url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80",
    stock: 10,
    seller_id: sellerId,
    category: "electronics",
    is_featured: true,
  },
  {
    title: "Cyber-Phone Pro X",
    description: "The ultimate futuristic smartphone with flexible display, satellite connection, and advanced AI-enhanced multi-camera lens. Premium titanium housing.",
    price: 999.99,
    image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80",
    stock: 30,
    seller_id: sellerId,
    category: "electronics",
    is_featured: true,
  },
];

async function addGadgets() {
  console.log("Checking and seeding popular gadgets...");
  try {
    for (const g of gadgets) {
      const { data: existing, error: findErr } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("title", g.title)
        .limit(1);
        
      if (findErr) throw findErr;
      
      if (existing && existing.length > 0) {
        console.log(`Product "${g.title}" already exists. Skipping.`);
      } else {
        const { data, error } = await supabaseAdmin
          .from("products")
          .insert(g)
          .select("*");
          
        if (error) {
          console.error(`❌ Failed to insert ${g.title}:`, error.message);
        } else {
          console.log(`✅ Successfully inserted: ${g.title}`);
        }
      }
    }
  } catch (err) {
    console.error("❌ Exception during gadget seed:", err);
  }
  process.exit(0);
}

addGadgets();
