import { supabaseAdmin } from "./config/supabase.js";

const sellerId = "5c4ac6d4-de4e-42df-938e-4d6a838a8466"; // avipatel seller id

const demoProducts = [
  {
    title: "Quantum Pro Wireless Headphones",
    description: "Experience immersive 3D spatial audio with our flagship noise-cancelling headphones. Features 40-hour battery life, premium titanium drivers, and adaptive transparency mode.",
    price: 2999,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    stock: 45,
    seller_id: sellerId,
    category: "electronics",
    is_featured: true,
  },
  {
    title: "Nebula Smart Watch Ultra",
    description: "The most advanced smartwatch with holographic display, health monitoring suite, and 7-day battery life. Water resistant to 100m.",
    price: 4999,
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    stock: 28,
    seller_id: sellerId,
    category: "electronics",
    is_featured: true,
  },
  {
    title: "Aurora Designer Backpack",
    description: "Handcrafted from premium Italian leather with anti-theft compartments, USB charging port, and ergonomic design for urban professionals.",
    price: 1899,
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80",
    stock: 67,
    seller_id: sellerId,
    category: "fashion",
    is_featured: true,
  },
  {
    title: "Prism LED Smart Desk Lamp",
    description: "Ambient lighting reimagined. 16 million colors, app-controlled, circadian rhythm modes, and wireless charging base.",
    price: 1299,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=500&q=80",
    stock: 92,
    seller_id: sellerId,
    category: "home",
    is_featured: true,
  },
  {
    title: "Velocity Running Shoes X1",
    description: "Carbon fiber plate technology with responsive foam cushioning. Designed for elite runners seeking maximum speed and comfort.",
    price: 2499,
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    stock: 34,
    seller_id: sellerId,
    category: "sports",
    is_featured: false,
  },
  {
    title: "Obsidian Ceramic Pour-Over Set",
    description: "Japanese-inspired minimalist coffee set. Hand-glazed ceramic with precision drip system for the perfect brew every time.",
    price: 899,
    image_url: "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=500&q=80",
    stock: 120,
    seller_id: sellerId,
    category: "home",
    is_featured: false,
  },
  {
    title: "Aether Noise-Cancelling Earbuds",
    description: "True wireless earbuds with crystal-clear ANC, 32-hour battery with case, and IPX7 waterproofing for any environment.",
    price: 1999,
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500&q=80",
    stock: 55,
    seller_id: sellerId,
    category: "electronics",
    is_featured: true,
  },
  {
    title: "Luxe Botanical Skincare Set",
    description: "Premium organic skincare collection: cleanser, toner, serum, and moisturizer. Dermatologist tested, cruelty-free, glass packaging.",
    price: 1599,
    image_url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&q=80",
    stock: 78,
    seller_id: sellerId,
    category: "beauty",
    is_featured: true,
  },
  {
    title: "Titan Mechanical Keyboard",
    description: "Custom hot-swappable mechanical keyboard with RGB per-key lighting, PBT keycaps, gasket mount, and aluminum frame.",
    price: 1799,
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
    stock: 42,
    seller_id: sellerId,
    category: "electronics",
    is_featured: false,
  },
  {
    title: "Zenith Yoga Mat Premium",
    description: "Natural rubber yoga mat with alignment guides, antimicrobial surface, and carrying strap. 6mm extra-cushion thickness.",
    price: 799,
    image_url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80",
    stock: 150,
    seller_id: sellerId,
    category: "sports",
    is_featured: false,
  },
  {
    title: "Horizon Polarized Sunglasses",
    description: "Titanium frame polarized sunglasses with UV400 protection. Lightweight, scratch-resistant lenses in a modern aviator design.",
    price: 2199,
    image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
    stock: 63,
    seller_id: sellerId,
    category: "fashion",
    is_featured: false,
  },
  {
    title: "Echo Smart Speaker Hub",
    description: "Premium multi-room smart speaker with 360° spatial audio, built-in home automation hub, and voice AI assistant.",
    price: 2999,
    image_url: "https://images.unsplash.com/photo-1558089687-f282d8b1b1b1?w=500&q=80",
    stock: 38,
    seller_id: sellerId,
    category: "electronics",
    is_featured: false,
  },
];

async function seed() {
  console.log("Starting product database seed...");
  try {
    // Check if products count is already positive
    const { count, error: countErr } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true });
      
    if (countErr) {
      throw countErr;
    }
    
    if (count > 0) {
      console.log(`Products table already contains ${count} rows. Skipping seed.`);
      process.exit(0);
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(demoProducts)
      .select("*");
      
    if (error) {
      console.error("❌ Seed failed:", error.message);
    } else {
      console.log(`✅ Seed successful! Inserted ${data.length} products into Supabase.`);
    }
  } catch (err) {
    console.error("❌ Seed exception:", err);
  }
  process.exit(0);
}

seed();
