/**
 * Currency formatting — one place, one currency.
 *
 * The platform trades in Ghana cedis: the backend stores GHS, the commission
 * ledger is GHS, and checkout tells the shopper what they'll hand the vendor in
 * cedis. Most of the app was nevertheless rendering a "$" in front of the very
 * same numbers, so a product could read $59.99 on the home screen and
 * GH₵59.99 at checkout. Same amount, two currencies, no conversion anywhere.
 *
 * Import from here rather than writing the symbol inline, so the next change
 * is one edit instead of forty.
 */

/** Currency symbol shown to users. */
export const CURRENCY_SYMBOL = 'GH₵';

// Non-breaking space: when a price wraps, the symbol must not be stranded on
// the line above its amount.
const NBSP = ' ';

/** `GH₵ 1,234.56` — the default for anything money-shaped. */
export function formatCurrency(n: number | null | undefined): string {
  return `${CURRENCY_SYMBOL}${NBSP}${(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** `GH₵ 1.2k` for tight spots like chart labels; falls back to whole cedis. */
export function formatCurrencyCompact(n: number | null | undefined): string {
  const value = n ?? 0;
  return value >= 1000
    ? `${CURRENCY_SYMBOL}${NBSP}${(value / 1000).toFixed(1)}k`
    : `${CURRENCY_SYMBOL}${NBSP}${value.toFixed(0)}`;
}
