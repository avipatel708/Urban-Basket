import { Link } from "react-router"
import { Star, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface Product {
  id: string
  title: string
  price: number | string
  image_url?: string
  rating?: number
}

interface ProductRecommendationCardProps {
  product: Product
  onClick?: () => void
}

export function ProductRecommendationCard({ product, onClick }: ProductRecommendationCardProps) {
  const numericPrice = typeof product.price === "string" ? parseFloat(product.price) : product.price

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl glass border border-surface-800/40 hover:border-primary-500/40 hover:bg-surface-800/20 transition-all duration-300 group shadow-md w-full"
    >
      {/* Product Image Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-900/40 flex-shrink-0 border border-surface-850">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-500/10 text-primary-400 text-xs font-bold font-sans">
            UB
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-sans font-semibold text-xs text-surface-200 group-hover:text-primary-300 transition-colors truncate">
          {product.title}
        </h4>
        
        {/* Rating and Price */}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-sans font-bold text-xs text-surface-50">
            {formatCurrency(numericPrice || 0)}
          </span>
          {product.rating !== undefined && (
            <div className="flex items-center gap-0.5 text-yellow-500">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] font-semibold text-surface-400 mt-0.5">
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Arrow */}
      <div className="p-1.5 rounded-lg glass-light text-surface-450 group-hover:text-primary-400 group-hover:bg-primary-500/5 transition-all flex-shrink-0">
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  )
}
