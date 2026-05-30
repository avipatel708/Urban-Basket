/**
 * Formats a numeric price into Indian Rupees (INR) with proper Indian numbering system format (lakh/crore groupings).
 * Example: 24999 -> ₹24,999, 149999 -> ₹1,49,999
 * @param amount 
 * @returns Formatted price
 */
export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
    return "₹0";
  }
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericAmount);
  
  return `₹${formatted}`;
}
