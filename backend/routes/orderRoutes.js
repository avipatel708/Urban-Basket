import express from "express"
import {
  createOrder,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
  getPendingReviewItems,
} from "../controllers/orderController.js"
import {
  getOrderReturnEligibility,
  requestOrderReturn,
} from "../controllers/returnController.js"
import {
  getOrderTracking,
  getOrderTrackingHistory,
} from "../controllers/orderTrackingController.js"
import { authenticate, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/", authenticate, createOrder)
router.get("/", authenticate, getUserOrders)
router.get("/seller", authenticate, requireRole("seller"), getSellerOrders)
router.get("/pending-reviews", authenticate, getPendingReviewItems)
router.get("/:id/tracking", authenticate, getOrderTracking)
router.get("/:id/tracking/history", authenticate, getOrderTrackingHistory)
router.get("/:id/return-eligibility", authenticate, getOrderReturnEligibility)
router.post("/:id/return", authenticate, requestOrderReturn)
router.put("/:id/status", authenticate, requireRole("seller"), updateOrderStatus)

export default router

