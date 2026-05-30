import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Camera, Loader2, MessageSquare } from "lucide-react"
import { StarRating } from "./StarRating"
import { submitReview } from "@/services/reviewService"
import { toast } from "sonner"

const MAX_PHOTOS = 3
const MAX_FILE_BYTES = 5 * 1024 * 1024

interface ReviewFormModalProps {
  open: boolean
  onClose: () => void
  productId: string
  productTitle: string
  orderId: string
  onSubmitted: () => void
}

export function ReviewFormModal({
  open,
  onClose,
  productId,
  productTitle,
  orderId,
  onSubmitted,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
    if (rating < 1) {
      toast.error("Please select a star rating")
      return
    }
    setSubmitting(true)
    try {
      await submitReview({
        product_id: productId,
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
        photo_urls: photoPreviews.length ? photoPreviews : undefined,
        photo_url: photoPreviews[0] || undefined,
      })
      toast.success("Thank you! Your review was submitted.")
      setRating(5)
      setComment("")
      setPhotoPreviews([])
      onSubmitted()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md z-[101] rounded-3xl glass border border-surface-800/50 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-surface-800/40">
              <div>
                <h3 className="font-display font-semibold text-base text-surface-100">Write a Review</h3>
                <p className="text-[10px] text-surface-450 font-sans mt-0.5 line-clamp-1">{productTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full glass-light text-surface-400 hover:text-surface-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5 font-sans">
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold text-surface-450 uppercase tracking-wide">Your rating</p>
                <div className="flex justify-center">
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <p className="text-xs text-primary-400 font-semibold">{rating} / 5 stars</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-surface-450 uppercase tracking-wide flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Comment (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product…"
                  rows={4}
                  maxLength={2000}
                  className="w-full glass-light border border-surface-800/50 rounded-xl py-2.5 px-4 text-sm text-surface-200 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

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
                  <div className="grid grid-cols-2 gap-2">
                    {photoPreviews.map((src, index) => (
                      <div
                        key={`preview-${index}`}
                        className="relative rounded-xl overflow-hidden border border-surface-800/50 aspect-video"
                      >
                        <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-surface-950/80 text-surface-300 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photoPreviews.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-6 rounded-xl border border-dashed border-surface-700/60 glass-light text-xs text-surface-400 hover:border-primary-500/40 hover:text-primary-400 transition-colors cursor-pointer"
                  >
                    {photoPreviews.length ? "Add another photo" : "Tap to add photos"}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full gradient-primary text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading & submitting…
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
