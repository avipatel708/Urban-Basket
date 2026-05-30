import { Router } from "express"
import { handleChat, handleProductDescription, handleVoiceSearch } from "../controllers/aiController.js"
import { authenticate, requireRole } from "../middleware/authMiddleware.js"

const router = Router()

// General chat & AI shopping assistance (optional authentication inside controller)
router.post("/chat", handleChat)

// AI voice search (natural language → product filters)
router.post("/voice-search", handleVoiceSearch)

// Seller description generator (strictly protected)
router.post("/product-description", authenticate, requireRole("seller"), handleProductDescription)

export default router
