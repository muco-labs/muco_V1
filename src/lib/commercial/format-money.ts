/** Display money with currency symbol where known (server amount is authoritative). */
export function formatCommercialMoney(amount: string, currency: string): string {
  const value = amount.trim()
  const c = currency.trim().toUpperCase()
  if (c === 'INR') return `₹${value}`
  if (c === 'USD') return `$${value}`
  if (c === 'EUR') return `€${value}`
  return `${c} ${value}`
}
