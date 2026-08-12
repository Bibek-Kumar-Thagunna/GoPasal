import { CURRENCY_SYMBOL } from '../constants';

/**
 * Formats a rupee amount for display. Prices from the API are stored as
 * decimal rupees (e.g. "150.00"), NOT minor units, so we never divide here.
 * Uses manual grouping to stay safe on Hermes where Intl may be unavailable.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  options?: { symbol?: string; withSymbol?: boolean }
): string {
  const symbol = options?.symbol ?? CURRENCY_SYMBOL;
  const withSymbol = options?.withSymbol ?? true;

  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  const safe = Number.isFinite(parsed as number) ? (parsed as number) : 0;

  const rounded = Math.round(safe * 100) / 100;
  const hasDecimals = !Number.isInteger(rounded);
  const fixed = hasDecimals ? rounded.toFixed(2) : String(Math.round(rounded));
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const value = decPart ? `${grouped}.${decPart}` : grouped;

  return withSymbol ? `${symbol}${value}` : value;
}

/** Resolve display price from API product shape (basePrice, price, or first variant). */
export function getProductPrice(product: {
  price?: number | string;
  basePrice?: number | string;
  variants?: { price?: number | string }[];
} | null | undefined): number {
  if (!product) return 0;
  const variantRaw = product.variants?.[0]?.price;
  if (variantRaw != null) {
    const v = typeof variantRaw === 'string' ? parseFloat(variantRaw) : variantRaw;
    if (Number.isFinite(v) && v > 0) return v;
  }
  const raw = product.basePrice ?? product.price;
  const parsed = typeof raw === 'string' ? parseFloat(raw) : raw ?? 0;
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function getProductComparePrice(product: {
  compareAtPrice?: number | string;
  variants?: { compareAtPrice?: number | string }[];
} | null | undefined): number | undefined {
  if (!product) return undefined;
  const variantRaw = product.variants?.[0]?.compareAtPrice;
  if (variantRaw != null) {
    const v = typeof variantRaw === 'string' ? parseFloat(variantRaw) : variantRaw;
    if (Number.isFinite(v) && v > 0) return v;
  }
  const raw = product.compareAtPrice;
  if (raw == null) return undefined;
  const parsed = typeof raw === 'string' ? parseFloat(raw) : raw;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
