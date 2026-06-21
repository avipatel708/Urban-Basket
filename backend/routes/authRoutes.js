import express from "express"
import { signup, login, getProfile, updateProfile } from "../controllers/authController.js"
import { logout } from "../controllers/logoutController.js"
import { authenticate } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.post("/logout", logout)
router.get("/profile", authenticate, getProfile)
router.put("/profile", authenticate, updateProfile)

export default router
