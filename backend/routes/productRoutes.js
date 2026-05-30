import express from "express"
import multer from "multer"
import {
  getProducts,
  getProduct,
  getSearchSuggestions,
  getProductRecommendations,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../controllers/productController.js"
import { visualSearch } from "../controllers/visualSearchController.js"
import { authenticate, requireRole } from "../middleware/authMiddleware.js"

const router = express.Router()

// Configure multer to store file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
})

router.get("/", getProducts)
router.get("/search/suggestions", getSearchSuggestions)
router.post("/visual-search", upload.single("image"), visualSearch)
router.get("/:id/recommendations", getProductRecommendations)
router.get("/:id", getProduct)

// Protected routes (Sellers only)
router.post("/", authenticate, requireRole("seller"), createProduct)
router.put("/:id", authenticate, requireRole("seller"), updateProduct)
router.delete("/:id", authenticate, requireRole("seller"), deleteProduct)

// Image upload (Multipart - supports either 'file' or 'image' field)
router.post("/upload", authenticate, upload.single("file"), uploadProductImage)

export default router
