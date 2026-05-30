import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { Star, ImageIcon } from "lucide-react"
import { StarRating } from "./StarRating"
import { getProductReviews, getReviewImageUrls, type Review } from "@/services/reviewService"
import { formatDate } from "@/lib/utils"

interface ProductReviewsProps {
  productId: string
}

function ReviewPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="rounded-xl border border-surface-800/50 bg-surface-900/40 aspect-video max-h-48 flex items-center justify-center gap-2 text-surface-500">
        <ImageIcon className="w-4 h-4" />
        <span className="text-[10px] font-sans">Image unavailable</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-surface-800/50 max-w-md">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full max-h-56 object-cover aspect-video bg-surface-900/30"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProductReviews(productId)
      .then((data) => {
        if (!cancelled) setReviews(data || [])
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  if (loading) {
    return <p className="text-xs text-surface-500 font-sans py-4">Loading reviews…</p>
  }

  if (reviews.length === 0) {
    return (
      <p className="text-xs text-surface-500 font-sans py-4">
        No reviews yet. Be the first to review after delivery!
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, idx) => {
        const imageUrls = getReviewImageUrls(review)
        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl glass-light border border-surface-800/40 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-surface-150">{review.author || "Customer"}</p>
                <p className="text-[10px] text-surface-500 mt-0.5">{formatDate(review.created_at)}</p>
              </div>
              <StarRating value={review.rating} readonly size="sm" />
            </div>

            {review.comment && (
              <p className="text-sm text-surface-350 leading-relaxed font-sans">{review.comment}</p>
            )}

            {imageUrls.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] text-surface-500 flex items-center gap-1 font-sans uppercase tracking-wide">
                  <ImageIcon className="w-3 h-3" />
                  {imageUrls.length > 1 ? `${imageUrls.length} photos` : "Photo review"}
                </p>
                <div
                  className={`grid gap-2 ${imageUrls.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"}`}
                >
                  {imageUrls.map((url, i) => (
                    <ReviewPhoto key={`${review.id}-img-${i}`} src={url} alt={`Review by ${review.author || "customer"}`} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

export function ReviewSummary({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-yellow-500">
        <Star className="w-4 h-4 fill-current" />
      </div>
      <span className="text-sm font-semibold text-surface-200">{rating?.toFixed(1) || "0.0"}</span>
      <span className="text-xs text-surface-500">({count} reviews)</span>
    </div>
  )
}
