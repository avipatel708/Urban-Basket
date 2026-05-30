import express from "express"
import {
  getMysteryBoxes,
  getMysteryBox,
  purchaseMysteryBox,
  getMyMysteryRewards,
  getMyMysteryReward,
} from "../controllers/mysteryBoxController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", getMysteryBoxes)
router.get("/rewards/me", authenticate, getMyMysteryRewards)
router.get("/rewards/:rewardId", authenticate, getMyMysteryReward)
router.get("/:id", getMysteryBox)
router.post("/:id/purchase", authenticate, purchaseMysteryBox)

export default router
