import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/authRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import cartRoutes from "./routes/cartRoutes.js"
import wishlistRoutes from "./routes/wishlistRoutes.js"
import statsRoutes from "./routes/statsRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import couponRoutes from "./routes/couponRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import mysteryBoxRoutes from "./routes/mysteryBoxRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { couponStore } from "./utils/couponStore.js"
import { detectWalletStorageMode } from "./services/walletService.js"
import { ensureReviewImagesBucket } from "./services/reviewStorageService.js"
import { detectOrderReturnSchema } from "./services/orderReturnService.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Configure CORS - allow frontend origin
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://urban-basket-six.vercel.app"],
    credentials: true,
  })
)

// Request Parsers
app.use(express.json({ limit: "12mb" }))
app.use(express.urlencoded({ extended: true, limit: "12mb" }))

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() })
})

// Mount API Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/stats", statsRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/mystery-boxes", mysteryBoxRoutes)

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Global Error Handler Middleware
app.use(errorHandler)

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Urban-Basket Backend Server running on port ${PORT}`)
  console.log(`🔗 API URL: http://localhost:${PORT}/api`)
  try {
    await couponStore.detectCouponStorageMode()
  } catch (err) {
    console.error("Failed to initialize coupon storage:", err.message)
  }
  try {
    await detectWalletStorageMode()
  } catch (err) {
    console.error("Failed to initialize wallet storage:", err.message)
  }
  try {
    await ensureReviewImagesBucket()
  } catch (err) {
    console.error("Failed to initialize review-images bucket:", err.message)
  }
  try {
    await detectOrderReturnSchema()
  } catch (err) {
    console.error("Failed to check order-return schema:", err.message)
  }
})

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use. Stop the other process or change PORT in .env`)
    process.exit(1)
  }
  console.error("Server error:", err.message)
  process.exit(1)
})
