import { Star } from "lucide-react"

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  size?: "sm" | "md"
  readonly?: boolean
}

export function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const starClass = size === "sm" ? "w-4 h-4" : "w-6 h-6"

  return (
    <div className="flex items-center gap-0.5" role={readonly ? "img" : "group"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            className={`transition-transform ${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } ${filled ? "text-yellow-400" : "text-surface-600"}`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star className={`${starClass} ${filled ? "fill-current" : ""}`} />
          </button>
        )
      })}
    </div>
  )
}
