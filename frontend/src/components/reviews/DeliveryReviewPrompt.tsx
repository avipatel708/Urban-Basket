import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Star, Camera, X, Loader2, MessageSquare, Package, Sparkles, Clock } from "lucide-react"
import { StarRating } from "./StarRating"
import { submitReview } from "@/services/reviewService"
import { getPendingReviewItems, type PendingReviewItem } from "@/services/orderService"
import { useAuthStore } from "@/store/authStore"
import { getToken } from "@/services/api"
import { toast } from "sonner"

const SESSION_KEY = "ub-review-prompt-dismissed"
const MAX_PHOTOS = 3
const MAX_FILE_BYTES = 5 * 1024 * 1024

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"

const CONFETTI_COLORS = [
  "oklch(0.68 0.17 285)",   // purple
  "oklch(0.68 0.16 250)",   // blue
  "oklch(0.80 0.16 80)",    // amber
  "oklch(0.72 0.19 155)",   // green
  "oklch(0.78 0.12 285)",   // light purple
  "oklch(0.63 0.22 25)",    // coral
]

function ConfettiParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        width: `${4 + Math.random() * 8}px`,
        height: `${4 + Math.random() * 8}px`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: `${Math.random() * 6}s`,
        duration: `${6 + Math.random() * 8}s`,
        startY: `${80 + Math.random() * 30}vh`,
      })),
    []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ub-review-confetti"
          style={{
            left: p.left,
            top: p.startY,
            width: p.width,
            height: p.height,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

export function DeliveryReviewPrompt() {
  const { user, initialized } = useAuthStore()
  const [items, setItems] = useState<PendingReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  // Review form state
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchPending = useCallback(async () => {
    const token = getToken()
    if (!token || !user || user.role !== "customer") {
      setLoading(false)
      return
    }

    // Check if dismissed this session
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setLoading(false)
      return
    }

    try {
      const data = await getPendingReviewItems()
      if (data && data.length > 0) {
        setItems(data)
        setCurrentIndex(0)
        setVisible(true)
      }
    } catch (err) {
      console.error("Failed to fetch pending review items:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (initialized) {
      fetchPending()
    }
  }, [initialized, fetchPending])

  const currentItem = items[currentIndex] || null

  const resetForm = () => {
    setRating(5)
    setComment("")
    setPhotoPreviews([])
  }

  const advanceOrClose = () => {
    resetForm()
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setVisible(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "true")
    setVisible(false)
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read image"))
      reader.readAsDataURL(file)
    })

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remaining = MAX_PHOTOS - photoPreviews.length
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    const next: string[] = []
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select image files only")
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} must be under 5MB`)
        continue
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        next.push(dataUrl)
      } catch {
        toast.error("Failed to load one of the images")
      }
    }

    if (next.length) {
      setPhotoPreviews((prev) => [...prev, ...next].slice(0, MAX_PHOTOS))
    }

    if (fileRef.current) fileRef.current.value = ""
  }

  const removePhoto = (index: number) => {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentItem) return
    if (rating < 1) {
      toast.error("Please select a star rating")
      return
    }

    setSubmitting(true)
    try {
      await submitReview({
        product_id: currentItem.product_id,
        order_id: currentItem.order_id,
        rating,
        comment: comment.trim() || undefined,
        photo_urls: photoPreviews.length ? photoPreviews : undefined,
        photo_url: photoPreviews[0] || undefined,
      })
      toast.success("Thank you! Your review was submitted 🎉")

      // Notify order views to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ub-orders-updated"))
      }

      advanceOrClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !visible || !currentItem) return null

  const remainingCount = items.length - currentIndex
  const productImage = currentItem.product_image || PLACEHOLDER_IMAGE

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Full-screen backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[200]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, oklch(0.18 0.06 285 / 0.97) 0%, oklch(0.10 0.03 285 / 0.98) 100%)",
              backdropFilter: "blur(30px) saturate(1.5)",
            }}
          >
            <ConfettiParticles />
          </motion.div>

          {/* Main overlay card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.5, type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl glass-strong border border-surface-800/50 shadow-2xl relative">
              {/* Counter badge */}
              {items.length > 1 && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-[10px] font-bold text-primary-300">
                  <Package className="w-3 h-3" />
                  {currentIndex + 1} of {items.length} products
                </div>
              )}

              {/* Close / Remind me later button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-4 right-4 z-10 p-2 rounded-full glass-light text-surface-400 hover:text-surface-200 hover:bg-surface-800/40 transition-all cursor-pointer"
                aria-label="Remind me later"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Hero section with product image */}
              <div className="relative pt-14 pb-4 px-6 flex flex-col items-center text-center">
                {/* Sparkle decorations */}
                <div className="absolute top-8 left-8 ub-review-sparkle" style={{ animationDelay: "0s" }}>
                  <Sparkles className="w-5 h-5 text-yellow-400/60" />
                </div>
                <div className="absolute top-12 right-12 ub-review-sparkle" style={{ animationDelay: "0.7s" }}>
                  <Sparkles className="w-4 h-4 text-primary-400/50" />
                </div>
                <div className="absolute bottom-6 left-12 ub-review-sparkle" style={{ animationDelay: "1.4s" }}>
                  <Sparkles className="w-3 h-3 text-accent-400/50" />
                </div>

                {/* Product image with glow ring */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  className="relative mb-5"
                >
                  <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-primary-500/30 ub-review-glow-ring">
                    <img
                      src={productImage}
                      alt={currentItem.product_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                      }}
                    />
                  </div>
                  {/* Delivered badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                    className="absolute -bottom-3 -right-3 flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-[10px] font-bold uppercase tracking-wider"
                    style={{ animation: "ub-review-badge-pulse 2s ease-in-out infinite" }}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Delivered
                  </motion.div>
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-surface-50 mb-1">
                    Your order has arrived! 🎉
                  </h2>
                  <p className="text-sm text-surface-300 font-sans max-w-sm mx-auto leading-relaxed">
                    How was{" "}
                    <span className="font-semibold text-primary-300">
                      {currentItem.product_title}
                    </span>
                    ? Please share your experience!
                  </p>
                </motion.div>
              </div>

              {/* Review form */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-6 pb-6 space-y-5 font-sans"
              >
                {/* Star rating — large & centered */}
                <div className="space-y-2 text-center py-2">
                  <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Star className="w-3 h-3" />
                    Your rating
                  </p>
                  <div className="flex justify-center">
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <p className="text-xs text-primary-400 font-semibold">{rating} / 5 stars</p>
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Comment (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product…"
                    rows={3}
                    maxLength={2000}
                    className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm text-surface-200 focus:outline-none focus:border-primary-500 resize-none placeholder:text-surface-600"
                  />
                </div>

                {/* Photo upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Photo review (optional, up to {MAX_PHOTOS})
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoChange}
                  />

                  {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {photoPreviews.map((src, index) => (
                        <div
                          key={`preview-${index}`}
                          className="relative rounded-xl overflow-hidden border border-surface-800/50 aspect-square"
                        >
                          <img
                            src={src}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-surface-950/80 text-surface-300 hover:text-white cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {photoPreviews.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-4 rounded-xl border border-dashed border-surface-700/60 glass-light text-xs text-surface-400 hover:border-primary-500/40 hover:text-primary-400 transition-colors cursor-pointer"
                    >
                      {photoPreviews.length ? "Add another photo" : "Tap to add photos"}
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-full gradient-primary text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-primary-500/20 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        Submit Review
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full py-2.5 text-xs font-medium text-surface-500 hover:text-surface-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Remind Me Later
                  </button>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
