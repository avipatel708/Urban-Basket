import dotenv from "dotenv"
import { formatCurrency } from "../utils/formatCurrency.js"

dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// ─── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are the **Urban-Basket AI Shopping Assistant** — a smart, friendly, and knowledgeable ecommerce helper.

## YOUR IDENTITY
- You work for Urban-Basket, a premium online shopping platform.
- You are warm, conversational, and helpful — NOT robotic.
- You speak naturally like a real shopping assistant, not a FAQ bot.
- Keep responses concise (2-4 sentences for simple questions, more for product listings).

## CRITICAL RULES — PRODUCT DATA
- You have been given the COMPLETE product catalog from the database in every message.
- **NEVER say a product is unavailable unless it truly does not appear in the catalog provided.**
- **ALWAYS search through the provided product list thoroughly before answering.**
- **ALWAYS display all product prices in Indian Rupees using the ₹ symbol and proper Indian number formatting (e.g. ₹999, ₹24,999, ₹1,49,999). NEVER show USD or $ currency symbols.**
- Use fuzzy matching: "headphone" matches "Headphones", "laptop" matches "Gaming Laptop", etc.
- If a user asks about a product category, show ALL matching products from the catalog.
- If no exact match, try partial matches on title, description, and category fields.

## CONVERSATION CONTEXT
- You receive the FULL conversation history with every request.
- **ALWAYS refer to previous messages to understand context.**
- If a user asks "what is the price?" or "how much?" — look at the most recently discussed product(s) in the conversation history and answer about THOSE products.
- If a user says "the first one" or "the second one" — refer to the products you just listed.
- Never ask "which product?" if only one product was recently discussed.

## RESPONSE FORMAT
- Use markdown: **bold** for product names and prices, bullet points for lists.
- Be natural and conversational — vary your language, don't repeat the same phrases.
- When showing products, include: name, price (formatted as Indian Rupees with ₹ symbol, e.g. ₹24,999), rating, stock status.
- For price questions about previously discussed products, answer directly.

## PRODUCT RECOMMENDATIONS
When you recommend specific products from the catalog, you MUST append a special JSON block at the very end of your response in this exact format:

[RECOMMENDED_PRODUCTS]
[{"id": "actual-product-uuid", "title": "Exact Product Title", "price": 99.99}]

Rules for RECOMMENDED_PRODUCTS:
- Only include products that actually exist in the provided catalog.
- Use the EXACT id, title, and price from the catalog data.
- Maximum 4 products per recommendation.
- Do NOT include this block for FAQ/policy/greeting responses.

## PLATFORM FAQS
- **Shipping**: Free on orders over ₹4,000, otherwise ₹399 (2-4 days). Express: ₹799 (1-2 days).
- **Returns**: 10-day returns after delivery from Order History. Refunds go to the Urban-Basket wallet.
- **Refunds**: Processed within 5-7 business days to original payment method.
- **Payment**: Credit/Debit Cards, UPI, NetBanking, PayPal, Apple Pay, Google Pay accepted.
- **Support**: support@urbanbasket.cyber | +1 (888) NEO-BASKET | 24/7

## ORDER TRACKING
- When user asks about orders, check the ORDER HISTORY data provided.
- If order data exists, show order ID, status, date, total, and items.
- If no order data, politely suggest the user sign in first.
`

// ─── Gemini API Call with Multi-Turn Conversation ────────────────────────────
async function callGemini(conversationContents, systemPrompt, jsonMode = false) {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY")
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

  const payload = {
    contents: conversationContents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1500,
    }
  }

  if (jsonMode) {
    payload.generationConfig.responseMimeType = "application/json"
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API Error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) {
    throw new Error("Empty response received from Gemini API")
  }

  return content
}

// ─── Smart Product Search (fuzzy + keyword + category matching) ──────────────
function searchProducts(query, products) {
  if (!products || products.length === 0) return []

  const q = query.toLowerCase().trim()
  const queryWords = q.split(/\s+/).filter(w => w.length > 1)

  // Normalize: strip trailing s/es for singular matching
  const normalize = (word) => {
    if (word.endsWith("ies")) return word.slice(0, -3) + "y"
    if (word.endsWith("es")) return word.slice(0, -2)
    if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1)
    return word
  }

  const normalizedQueryWords = queryWords.map(normalize)

  // Score each product
  const scored = products.map(product => {
    const title = (product.title || "").toLowerCase()
    const desc = (product.description || "").toLowerCase()
    const category = (product.category || "").toLowerCase()
    const allText = `${title} ${desc} ${category}`

    let score = 0

    // Exact full query in title (strongest signal)
    if (title.includes(q)) score += 50

    // Exact full query in description
    if (desc.includes(q)) score += 20

    // Category match
    if (category.includes(q) || q.includes(category)) score += 30

    // Per-word matching
    for (const word of normalizedQueryWords) {
      const normalizedTitle = normalize(title)
      const normalizedDesc = normalize(desc)

      if (normalizedTitle.includes(word)) score += 15
      if (normalizedDesc.includes(word)) score += 5
      if (allText.includes(word)) score += 3
    }

    // Boost for original words too
    for (const word of queryWords) {
      if (title.includes(word)) score += 10
      if (desc.includes(word)) score += 3
    }

    return { product, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.product)
}

// ─── Build Conversation Contents for Gemini Multi-Turn ───────────────────────
function buildConversationContents(messageHistory, currentQuery, products, orders) {
  const contents = []

  // Inject previous conversation turns
  if (messageHistory && messageHistory.length > 0) {
    // Take last 10 messages for context window management
    const recentHistory = messageHistory.slice(-10)
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      })
    }
  }

  // Build the current user message with full product catalog context
  const productCatalog = products.map(p => ({
    id: p.id,
    title: p.title,
    price: formatCurrency(p.price),
    category: p.category,
    rating: p.rating || 0,
    stock: p.stock || 0,
    description: (p.description || "").slice(0, 100),
    image_url: p.image_url || ""
  }))

  const orderSummary = orders.map(o => ({
    id: o.id,
    date: o.created_at,
    status: o.status,
    total: formatCurrency(o.total_amount),
    items: o.order_items?.map(i => ({
      name: i.products?.title || "Item",
      qty: i.quantity,
      price: formatCurrency(i.price)
    })) || []
  }))

  // Pre-search for relevant products to highlight
  const matchedProducts = searchProducts(currentQuery, products)
  const topMatches = matchedProducts.slice(0, 6)

  let contextBlock = `
USER'S CURRENT MESSAGE: "${currentQuery}"

=== COMPLETE PRODUCT CATALOG (${products.length} products) ===
${JSON.stringify(productCatalog, null, 1)}

=== TOP MATCHING PRODUCTS FOR THIS QUERY (pre-filtered) ===
${topMatches.length > 0
    ? JSON.stringify(topMatches.map(p => ({ id: p.id, title: p.title, price: formatCurrency(p.price), category: p.category, rating: p.rating, stock: p.stock, image_url: p.image_url })), null, 1)
    : "No direct matches found — use the full catalog above to find relevant items."}
`

  if (orders.length > 0) {
    contextBlock += `\n=== USER'S ORDER HISTORY ===\n${JSON.stringify(orderSummary, null, 1)}\n`
  } else {
    contextBlock += `\n=== USER'S ORDER HISTORY ===\nUser is not signed in or has no orders.\n`
  }

  contents.push({
    role: "user",
    parts: [{ text: contextBlock }]
  })

  return contents
}

// ─── Parse AI Response & Extract Product Recommendations ─────────────────────
function parseAIResponse(aiResponse, products) {
  let recommendedProducts = []
  let cleanText = aiResponse

  if (aiResponse.includes("[RECOMMENDED_PRODUCTS]")) {
    const parts = aiResponse.split("[RECOMMENDED_PRODUCTS]")
    cleanText = parts[0].trim()
    try {
      let jsonStr = parts[1].trim()
      // Handle potential markdown code fences around JSON
      jsonStr = jsonStr.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim()
      const parsed = JSON.parse(jsonStr)
      if (Array.isArray(parsed)) {
        // Resolve full product details from database
        recommendedProducts = parsed.map(item => {
          const match = products.find(p =>
            p.id === item.id ||
            p.title?.toLowerCase() === item.title?.toLowerCase() ||
            p.title?.toLowerCase().includes(item.title?.toLowerCase()) ||
            item.title?.toLowerCase().includes(p.title?.toLowerCase())
          )
          return match || item
        }).filter(Boolean)
      }
    } catch (e) {
      console.warn("Failed to parse recommended products JSON:", e.message)
    }
  }

  return { text: cleanText, recommendedProducts }
}

// ─── Local Fallback (when Gemini API is unavailable) ─────────────────────────
function getLocalFallbackResponse(query, products = [], orders = []) {
  const q = query.toLowerCase()
  let text = ""
  let recommendedProducts = []

  // FAQ detection
  if (q.includes("shipping") || q.includes("delivery") || q.includes("arrive")) {
    text = "🚚 **Shipping Info**\n\n- **Standard**: Free on orders over ₹4,000, otherwise ₹399 (2-4 business days)\n- **Express**: ₹799 (1-2 business days)\n- All orders dispatched within 24 hours."
  } else if (q.includes("return") || q.includes("refund") || q.includes("replace")) {
    text = "🔄 **Returns & Refunds**\n\n- Returns within **10 days** of delivery (Order History → Return Order).\n- Full refund credited to your **Urban-Basket wallet** instantly.\n- Use wallet balance at checkout on your next purchase."
  } else if (q.includes("payment") || q.includes("pay") || q.includes("card")) {
    text = "💳 **Payment Methods**\n\nWe accept UPI, NetBanking, Credit/Debit Cards, PayPal, Apple Pay, and Google Pay."
  } else if (q.includes("support") || q.includes("contact") || q.includes("help me")) {
    text = "📞 **Need Help?**\n\n- **Email**: support@urbanbasket.cyber\n- **Hotline**: +1 (888) NEO-BASKET\n- **Live Chat**: Right here, 24/7!"
  } else if (q.includes("order") || q.includes("track") || q.includes("package")) {
    if (orders.length > 0) {
      const o = orders[0]
      const items = o.order_items?.map(i => `- ${i.products?.title || "Item"} (×${i.quantity})`).join("\n") || ""
      text = `📦 **Your Recent Order**\n\n- **ID**: ${o.id.slice(0, 8)}\n- **Status**: **${o.status.toUpperCase()}**\n- **Date**: ${new Date(o.created_at).toLocaleDateString()}\n- **Total**: ${formatCurrency(o.total_amount)}\n\n**Items:**\n${items}`
    } else {
      text = "Please sign in to track your orders. I'll be able to look up your purchase history once you're logged in!"
    }
  } else {
    // Product search fallback
    const matched = searchProducts(query, products).slice(0, 4)
    if (matched.length > 0) {
      recommendedProducts = matched
      text = `Here's what I found for "${query}":\n\n${matched.map(p => `- **${p.title}** — **${formatCurrency(p.price)}** (${p.rating || 0}★, ${p.stock > 0 ? "In Stock" : "Out of Stock"})`).join("\n")}\n\nWant more details on any of these?`
    } else {
      text = "👋 Hey! I'm your Urban-Basket shopping assistant. I can help you:\n\n- **Find products** — \"Show me headphones\"\n- **Track orders** — \"Where's my package?\"\n- **Answer questions** — \"What's your return policy?\"\n\nWhat are you looking for today?"
    }
  }

  return { text, recommendedProducts }
}

// ─── Main Chat Handler ───────────────────────────────────────────────────────
export async function chatWithAI(query, products = [], orders = [], messageHistory = []) {
  try {
    if (!GEMINI_API_KEY) {
      return getLocalFallbackResponse(query, products, orders)
    }

    const contents = buildConversationContents(messageHistory, query, products, orders)
    const aiResponse = await callGemini(contents, SYSTEM_PROMPT, false)
    return parseAIResponse(aiResponse, products)
  } catch (err) {
    console.error("AI Service Error, falling back to local:", err.message)
    return getLocalFallbackResponse(query, products, orders)
  }
}

// ─── Seller Product Listing Generator (unchanged) ────────────────────────────
export async function generateProductListing(keywords) {
  const systemPrompt = `
You are the "Urban-Basket Seller AI Assistant".
Your job is to receive brief, raw keywords/features from a seller, and transform them into a premium, SEO-friendly, professional, futuristic product listing.
You must return your response STRICTLY as a valid JSON object matching this schema:
{
  "title": "SEO-friendly, professional product title",
  "description": "High-fidelity, descriptive, marketing-oriented product description paragraph",
  "highlights": ["Highlight/Spec bullet 1", "Highlight/Spec bullet 2", "Highlight/Spec bullet 3", "Highlight/Spec bullet 4"],
  "tags": ["seo-tag-1", "seo-tag-2", "seo-tag-3", "seo-tag-4"]
}
`
  const userPrompt = `SELLER INPUT KEYWORDS: "${keywords}"\n\nTransform this input into a highly persuasive product listing. Maintain a premium tone fitting futuristic technological lifestyles.`

  try {
    if (!GEMINI_API_KEY) {
      return buildFallbackListing(keywords)
    }
    const contents = [{ role: "user", parts: [{ text: userPrompt }] }]
    const aiResponse = await callGemini(contents, systemPrompt, true)
    return JSON.parse(aiResponse)
  } catch (err) {
    console.error("Gemini Seller Service Error:", err.message)
    return buildFallbackListing(keywords)
  }
}

function buildFallbackListing(keywords) {
  const cleanKeywords = keywords.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  return {
    title: `Premium ${cleanKeywords} Pro`,
    description: `Experience the next generation of technological superiority with our newly launched ${keywords}. Engineered for seamless integration, state-of-the-art performance, and ergonomic utility.`,
    highlights: [
      "State-of-the-art performance optimization",
      "Ultra-durable ergonomic design",
      "Energy-efficient sustainable technology",
      "Includes 2-year full premium warranty"
    ],
    tags: [keywords.toLowerCase().replace(/\s+/g, "-"), "premium-tech", "urban-basket", "next-gen"]
  }
}
