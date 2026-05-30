import express from "express"
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", authenticate, getCart)
router.post("/", authenticate, addToCart)
router.put("/:id", authenticate, updateCartItem)
router.delete("/:id", authenticate, removeFromCart)
router.delete("/", authenticate, clearCart)

export default router
