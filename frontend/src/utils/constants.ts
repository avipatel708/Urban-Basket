export const CATEGORIES = [
  { id: "electronics", name: "Electronics", icon: "Cpu" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "home", name: "Home & Living", icon: "Home" },
  { id: "sports", name: "Sports", icon: "Dumbbell" },
  { id: "beauty", name: "Beauty", icon: "Sparkles" },
  { id: "books", name: "Books", icon: "BookOpen" },
  { id: "toys", name: "Toys & Games", icon: "Gamepad2" },
  { id: "automotive", name: "Automotive", icon: "Car" },
] as const

export const ORDER_STATUSES = {
  pending: { label: "Order Placed", color: "text-yellow-400 bg-yellow-400/10" },
  confirmed: { label: "Confirmed", color: "text-cyan-400 bg-cyan-400/10" },
  packed: { label: "Packed", color: "text-blue-400 bg-blue-400/10" },
  processing: { label: "Packed", color: "text-blue-400 bg-blue-400/10" },
  shipped: { label: "Shipped", color: "text-purple-400 bg-purple-400/10" },
  out_for_delivery: { label: "Out For Delivery", color: "text-indigo-400 bg-indigo-400/10" },
  delivered: { label: "Delivered", color: "text-green-400 bg-green-400/10" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-400/10" },
  returned: { label: "Returned", color: "text-amber-400 bg-amber-400/10" },
} as const

/** Statuses sellers can set manually (returns are customer-initiated). */
export const SELLER_SETTABLE_ORDER_STATUSES = {
  pending: ORDER_STATUSES.pending,
  confirmed: ORDER_STATUSES.confirmed,
  packed: ORDER_STATUSES.packed,
  shipped: ORDER_STATUSES.shipped,
  out_for_delivery: ORDER_STATUSES.out_for_delivery,
  delivered: ORDER_STATUSES.delivered,
  cancelled: ORDER_STATUSES.cancelled,
} as const

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
] as const

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/deals", label: "Deals" },
] as const

export type OrderStatus = keyof typeof ORDER_STATUSES
export type Category = (typeof CATEGORIES)[number]["id"]
