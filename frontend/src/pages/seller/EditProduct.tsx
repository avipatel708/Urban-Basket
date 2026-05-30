import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import { Upload, ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react"
import { CATEGORIES } from "@/utils/constants"
import { useAuthStore } from "@/store/authStore"
import { getProduct, updateProduct } from "@/services/productService"
import { uploadProductImage } from "@/services/storageService"
import { toast } from "sonner"

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "electronics",
    isFeatured: false,
    imageUrl: ""
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      if (!id) return
      const found = await getProduct(id)
      if (found) {
        setForm({
          title: found.title,
          description: found.description || "",
          price: found.price.toString(),
          stock: found.stock.toString(),
          category: found.category,
          isFeatured: found.is_featured || false,
          imageUrl: found.image_url || ""
        })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load product details.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!profile?.id) {
      toast.error("You must be logged in to upload images.")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, or WebP).")
      return
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.")
      return
    }

    setIsUploading(true)
    const uploadToast = toast.loading("Uploading product image...")

    try {
      const url = await uploadProductImage(file, profile.id)
      setForm((prev) => ({ ...prev, imageUrl: url }))
      toast.success("Image uploaded successfully!", { id: uploadToast })
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.", { id: uploadToast })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.stock) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!id) return

    setSubmitting(true)
    try {
      await updateProduct(id, {
        title: form.title,
        description: form.description || null,
        price: parseFloat(form.price),
        image_url: form.imageUrl || null,
        stock: parseInt(form.stock),
        category: form.category,
        is_featured: form.isFeatured
      })
      toast.success("Changes saved successfully!")
      navigate("/seller/products")
    } catch (err: any) {
      toast.error(err.message || "Failed to update product.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 rounded-full text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6 pb-8 font-sans"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/seller/products"
          className="p-2 rounded-full glass-light text-surface-400 hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-surface-50">Edit Product</h1>
          <p className="text-xs text-surface-400 mt-0.5">Modify listings, prices, or inventory levels.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl glass p-6 sm:p-8 border border-surface-800/40 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Title */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Product Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Quantum VR Gaming Goggles"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Description
              </label>
              <textarea
                placeholder="Describe your product specs, materials, features..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
              />
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Price (₹ INR) *
              </label>
              <input
                type="number"
                placeholder="e.g. 999"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Stock Quantity *
              </label>
              <input
                type="number"
                placeholder="50"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-surface-950">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">
                Product Image URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://images.unsplash.com/photo..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-surface-200"
              />
            </div>

            {/* Featured toggle */}
            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-surface-950/20 border border-surface-800/30">
              <input
                type="checkbox"
                id="featured"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500/50 border-surface-800 rounded bg-surface-950 cursor-pointer"
              />
              <label htmlFor="featured" className="text-xs font-semibold text-surface-200 cursor-pointer select-none">
                Feature this product on the customer home page
              </label>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />

          {/* Drag & drop simulated container */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-all duration-200 bg-surface-950/10 ${
              isDragging
                ? "border-primary-500 bg-primary-500/5 glow-sm"
                : "border-surface-800 hover:border-primary-500/50"
            }`}
          >
            {isUploading ? (
              <div className="py-4 space-y-2">
                <Loader2 className="w-8 h-8 text-primary-500 mx-auto animate-spin" />
                <h4 className="font-semibold text-xs text-surface-250">Uploading your product image...</h4>
              </div>
            ) : form.imageUrl ? (
              <div className="space-y-4">
                <div className="relative w-28 h-28 mx-auto rounded-lg overflow-hidden border border-surface-800 shadow-xl group">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white font-bold uppercase tracking-wider">Change</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-green-400">Image successfully uploaded!</h4>
                  <p className="text-[10px] text-surface-450 mt-1">Click or drag another image to replace</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-surface-500 mx-auto" />
                <h4 className="font-semibold text-xs text-surface-200">Drag and drop product images</h4>
                <p className="text-[10px] text-surface-500">Supports PNG, JPG or WebP up to 5MB (Click to browse files)</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3.5 border-t border-surface-800/20 pt-6">
            <Link
              to="/seller/products"
              className="text-xs font-semibold text-surface-450 hover:text-surface-200 cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || isUploading}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl gradient-primary text-xs font-semibold text-white shadow-lg shadow-primary-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-55 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
