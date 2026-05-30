import { apiGet, apiPost, apiPut } from "./api"

export type PaymentMethod = "wallet" | "gpay" | "upi" | "card" | "cod"
export type PaymentStatus = "paid" | "pending" | "failed"

export interface Order {
  id: string
  user_id: string
  total: number
  status: string
  shipping_address: Record<string, string> | null
  payment_method?: PaymentMethod | string | null
  payment_status?: PaymentStatus | string | null
  transaction_id?: string | null
  tracking_step?: number | null
  estimated_delivery?: string | null
  shipped_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
  returned_at?: string | null
  return_reason?: string | null
  created_at: string
}

export interface OrderItemProduct {
  title: string
  image_url: string | null
  category?: string
}

export interface OrderItemWithProduct {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products: OrderItemProduct | null
}

export interface OrderWithItems extends Order {
  order_items: OrderItemWithProduct[]
}

export async function createOrder(order: {
  total: number
  shipping_address: Record<string, string>
  items: { product_id: string; quantity: number; price: number }[]
  payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  transaction_id?: string | null
}) {
  return apiPost<Order>("/orders", {
    total: order.total,
    shipping_address: order.shipping_address,
    items: order.items,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    transaction_id: order.transaction_id,
  })
}

export async function getUserOrders() {
  return apiGet<OrderWithItems[]>("/orders")
}

export interface SellerOrder {
  id: string
  customer: string
  email: string
  items: string
  total: number
  status:
    | "pending"
    | "confirmed"
    | "packed"
    | "processing"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "returned"
  date: string
}

export interface ReturnEligibilityResponse {
  eligible: boolean
  daysLeft: number
  reason?: string | null
  return_window_days: number
  refund_destination: string
}

export interface OrderReturnResponse {
  order: Order
  refund_amount: number
  wallet_balance?: number
  message: string
}

export async function getSellerOrders() {
  return apiGet<SellerOrder[]>("/orders/seller")
}

export async function updateOrderStatus(orderId: string, status: string) {
  const order = await apiPut<Order>(`/orders/${orderId}/status`, { status })
  notifyOrdersUpdated()
  return order
}

export async function getOrderReturnEligibility(orderId: string) {
  return apiGet<ReturnEligibilityResponse>(`/orders/${orderId}/return-eligibility`)
}

export async function requestOrderReturn(orderId: string, reason?: string) {
  return apiPost<OrderReturnResponse>(`/orders/${orderId}/return`, { reason })
}

/** Notify order history views to refetch after a successful checkout. */
export function notifyOrdersUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ub-orders-updated"))
    window.dispatchEvent(new Event("ub-seller-orders-updated"))
  }
}

export interface PendingReviewItem {
  order_id: string
  product_id: string
  product_title: string
  product_image: string | null
}

export async function getPendingReviewItems() {
  return apiGet<PendingReviewItem[]>("/orders/pending-reviews")
}
