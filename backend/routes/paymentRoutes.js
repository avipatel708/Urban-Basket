import express from "express"
import { authenticate } from "../middleware/authMiddleware.js"
import { getWallet, topUpWallet, simulatePayment } from "../controllers/paymentController.js"

const router = express.Router()

router.get("/wallet", authenticate, getWallet)
router.post("/wallet/add", authenticate, topUpWallet)
router.post("/simulate", authenticate, simulatePayment)

export default router
