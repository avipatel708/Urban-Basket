import express from "express"
import { authenticate } from "../middleware/authMiddleware.js"
import {
  createReview,
  getProductReviews,
  getMyReviewedProductIds,
} from "../controllers/reviewController.js"

const router = express.Router()

router.get("/product/:productId", getProductReviews)
router.get("/me/reviewed", authenticate, getMyReviewedProductIds)
router.post("/", authenticate, createReview)

export default router
