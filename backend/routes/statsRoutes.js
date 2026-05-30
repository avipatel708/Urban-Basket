import express from "express"
import { getSellerStats } from "../controllers/statsController.js"
import { authenticate, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/seller", authenticate, requireRole("seller"), getSellerStats)

export default router
