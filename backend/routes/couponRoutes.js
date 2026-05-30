import { Router } from "express";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";
import {
  handleValidateCoupon,
  handleApplyCoupon,
  handleCreateCoupon,
  handleGetCoupons,
  handleUpdateCoupon,
  handleDeleteCoupon,
  handleGetCouponStats,
} from "../controllers/couponController.js";

const router = Router();

// Customer routes (requires authentication)
router.post("/validate", authenticate, handleValidateCoupon);
router.post("/apply", authenticate, handleApplyCoupon);

// Seller routes (requires seller role)
router.get("/", authenticate, requireRole("seller"), handleGetCoupons);
router.get("/stats", authenticate, requireRole("seller"), handleGetCouponStats);
router.post("/create", authenticate, requireRole("seller"), handleCreateCoupon);
router.patch("/:id", authenticate, requireRole("seller"), handleUpdateCoupon);
router.delete("/:id", authenticate, requireRole("seller"), handleDeleteCoupon);

export default router;
