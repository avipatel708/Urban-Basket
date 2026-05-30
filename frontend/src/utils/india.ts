/** India-specific ecommerce defaults for Urban-Basket */

export const DEFAULT_COUNTRY = "India"

export const FREE_SHIPPING_MIN_INR = 499
export const STANDARD_SHIPPING_FEE_INR = 49
export const GST_RATE = 0.18

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const

export function calcShippingFee(subtotalInr: number): number {
  return subtotalInr >= FREE_SHIPPING_MIN_INR ? 0 : STANDARD_SHIPPING_FEE_INR
}

export function calcGst(subtotalInr: number): number {
  return Math.round(subtotalInr * GST_RATE)
}
