/**
 * Formats an amount using a non-breaking space as thousands separator and currency suffix.
 * Example: 5500 -> "5 500 DA"
 */
export function formatMoney(amount: number, currency: string = "DA"): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
  return `${formatted} ${currency}`;
}
