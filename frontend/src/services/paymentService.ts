import { apiGet, apiPost } from "./api"

export type PaymentMethodId = "wallet" | "gpay" | "upi" | "card" | "cod"

export interface WalletTransaction {
  id: string
  user_id: string
  type: "credit" | "debit"
  amount: number
  status: string
  reference?: string | null
  created_at: string
}

export interface WalletResponse {
  balance: number
  transactions: WalletTransaction[]
}

export async function getWallet() {
  return apiGet<WalletResponse>("/payments/wallet")
}

export async function addWalletMoney(amount: number) {
  return apiPost<{ message: string; balance: number }>("/payments/wallet/add", { amount })
}

export async function simulatePayment(payload: {
  method: "gpay" | "upi" | "card"
  amount: number
  upiId?: string
  cardNumber?: string
}) {
  return apiPost<{
    success: boolean
    payment_status: string
    transaction_id: string
    message: string
  }>("/payments/simulate", payload)
}

/** Demo loading delay for payment gateway UX */
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
