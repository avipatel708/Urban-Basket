import { apiGet, apiPost } from "./api"
import { MYSTERY_BOXES_FALLBACK } from "@/utils/mysteryBoxFallback"
import type { PaymentMethod } from "./orderService"

export interface MysteryBox {
  id: string
  slug: string
  title: string
  description: string
  price: number
  image_url: string | null
  tier: "budget" | "electronics" | "fashion" | "premium" | "gaming"
  category_filter: string | null
  min_items: number
  max_items: number
  min_retail_multiplier?: number
  stock: number
  is_active?: boolean
  sort_order?: number
}

export interface MysteryRevealProduct {
  product_id: string
  title: string
  price: number
  quantity: number
  image_url: string | null
  category?: string
}

export interface MysteryBoxReward {
  id: string
  user_id: string
  mystery_box_id: string
  order_id: string | null
  products: MysteryRevealProduct[]
  total_retail_value: number
  box_price: number
  created_at: string
  mystery_boxes?: {
    title: string
    slug: string
    image_url: string | null
    tier: string
    price?: number
  }
}

export interface PurchaseMysteryBoxResponse {
  reward: MysteryBoxReward
  order: { id: string }
  box: { id: string; title: string; slug: string }
  reveal: {
    products: MysteryRevealProduct[]
    total_retail_value: number
    box_price: number
    savings: number
  }
}

export async function getMysteryBoxes() {
  try {
    const data = await apiGet<MysteryBox[]>("/mystery-boxes")
    if (Array.isArray(data) && data.length > 0) return data
    return MYSTERY_BOXES_FALLBACK
  } catch {
    return MYSTERY_BOXES_FALLBACK
  }
}

export async function getMysteryBox(id: string) {
  return apiGet<MysteryBox>(`/mystery-boxes/${id}`)
}

export async function getMyMysteryRewards() {
  return apiGet<MysteryBoxReward[]>("/mystery-boxes/rewards/me")
}

export async function getMysteryReward(rewardId: string) {
  return apiGet<MysteryBoxReward>(`/mystery-boxes/rewards/${rewardId}`)
}

export async function purchaseMysteryBox(
  boxId: string,
  payload: {
    shipping_address: Record<string, string>
    payment_method: PaymentMethod
    payment_status: "paid" | "pending"
    transaction_id?: string | null
  }
) {
  return apiPost<PurchaseMysteryBoxResponse>(`/mystery-boxes/${boxId}/purchase`, payload)
}

export function notifyMysteryRewardsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ub-mystery-rewards-updated"))
    window.dispatchEvent(new Event("ub-orders-updated"))
    window.dispatchEvent(new Event("ub-wallet-updated"))
  }
}
