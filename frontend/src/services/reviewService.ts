import { apiGet, apiPost } from "./api"

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  photo_url: string | null
  review_images?: string[]
  created_at: string
  author?: string
  avatar_url?: string | null
}

export function getReviewImageUrls(review: Review): string[] {
  const urls: string[] = []
  if (review.review_images?.length) {
    review.review_images.forEach((u) => {
      if (u && !urls.includes(u)) urls.push(u)
    })
  }
  if (review.photo_url && !urls.includes(review.photo_url)) {
    urls.unshift(review.photo_url)
  }
  return urls.filter((u) => typeof u === "string" && u.length > 0)
}

export async function getProductReviews(productId: string) {
  return apiGet<Review[]>(`/reviews/product/${productId}`)
}

export async function getMyReviewedProductIds() {
  return apiGet<{ product_ids: string[] }>("/reviews/me/reviewed")
}

export async function submitReview(payload: {
  product_id: string
  order_id: string
  rating: number
  comment?: string
  photo_url?: string | null
  photo_urls?: string[]
}) {
  return apiPost<Review>("/reviews", payload)
}
