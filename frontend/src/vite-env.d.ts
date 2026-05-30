/// <reference types="vite/client" />

declare module "@/components/VoiceSearchButton" {
  import type { FC } from "react"
  export const VoiceSearchButton: FC<{
    onTranscript: (transcript: string) => void | Promise<void>
    className?: string
    disabled?: boolean
    silent?: boolean
  }>
}

declare module "@/utils/applyVoiceSearch" {
  export function isInstantVoiceParse(transcript: string): boolean
  export function processVoiceSearch(transcript: string): unknown
  export function processVoiceSearchAsync(transcript: string): Promise<{
    parsed: {
      searchText?: string
      search?: string
      category?: string | null
      sort?: string
    }
    params: URLSearchParams
    path: string
    label: string
    suggestions: string[]
    instant: boolean
  }>
  export function executeVoiceSearch(transcript: string): ReturnType<
    typeof processVoiceSearchAsync
  >
  export function buildProductQueryFromUrl(searchParams: URLSearchParams): {
    params: Record<string, unknown>
    category: string
    sort: string
    search: string
  }
}

declare module "@/hooks/useVoiceSearch" {
  export function useVoiceSearch(options: {
    onTranscript: (transcript: string) => void | Promise<void>
    onError?: (error: { type: string; message: string }) => void
    silent?: boolean
  }): {
    isListening: boolean
    isProcessing: boolean
    busy: boolean
    isSupported: boolean
    start: () => void
    stop: () => void
    toggle: () => void
  }
}

declare module "@/components/payment/PaymentMethods" {
  import type { FC } from "react"
  import type { PaymentMethodId } from "@/services/paymentService"
  export const PaymentMethods: FC<{
    selected: PaymentMethodId
    onSelect: (id: PaymentMethodId) => void
    walletBalance?: number | null
  }>
}

declare module "@/components/payment/WalletPayment" {
  import type { FC } from "react"
  export const WalletPayment: FC<{
    balance: number
    orderTotal: number
    onBalanceChange?: (balance: number) => void
  }>
}

declare module "@/components/payment/CardPayment" {
  import type { FC } from "react"
  export const CardPayment: FC<{
    form: { cardName: string; cardNumber: string; cardExpiry: string; cardCvv: string }
    onChange: (form: { cardName: string; cardNumber: string; cardExpiry: string; cardCvv: string }) => void
  }>
  export function validateCardForm(form: {
    cardName: string
    cardNumber: string
    cardExpiry: string
    cardCvv: string
  }): string | null
}

declare module "@/components/payment/UpiPayment" {
  import type { FC } from "react"
  export const UPI_APP_IDS: string[]
  export const UpiPayment: FC<{
    upiId: string
    onUpiIdChange: (id: string) => void
    selectedApp?: string
    onAppChange?: (app: string) => void
  }>
}

declare module "@/components/payment/CodPayment" {
  import type { FC } from "react"
  export const CodPayment: FC<{ orderTotal: number }>
}

declare module "@/utils/smartProductFilter" {
  import type { Product } from "@/services/productService"

  export interface SearchFilters {
    search: string
    keywords: string[]
    terms: string[]
    intent: string | null
    category: string | null
    minPrice: number | null
    maxPrice: number | null
    minRating: number | null
    color: string | null
    brand: string | null
    features: string[]
    storage: string | null
    ram: string | null
    size: string | null
    deals: boolean
    sort: string
    smart: boolean
  }

  export function filtersFromSearchParams(searchParams: URLSearchParams): SearchFilters
  export function isSmartSearchParams(searchParams: URLSearchParams): boolean
  export function filterAndRankProducts(products: Product[], filters: SearchFilters): Product[]
}
