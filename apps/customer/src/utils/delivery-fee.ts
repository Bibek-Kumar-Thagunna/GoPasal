import type { Cart } from '../types';
import type { TranslationKey } from '../i18n';
import { formatMoney } from './money';

export type DeliveryFeeStatus = 'free' | 'charged' | 'shop_set' | 'pickup_only';

type StoreMeta = {
  deliveryFee?: number | string;
  freeDeliveryThreshold?: number | string;
  freeDelivery?: boolean;
};

function parseAmount(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export function resolveDeliveryFee(
  cart: Cart | null | undefined,
  subtotal: number
): { fee: number; status: DeliveryFeeStatus } {
  const store = cart?.store as any;
  const deliveryType = String(store?.deliveryType ?? "").toUpperCase();
  if (
    deliveryType === "PICKUP_ONLY" ||
    (store && (store.latitude == null || store.longitude == null))
  ) {
    return { fee: 0, status: "pickup_only" };
  }

  const meta = store?.metadata;
  const configuredFee = parseAmount(meta?.deliveryFee);
  const freeThreshold = parseAmount(meta?.freeDeliveryThreshold);

  if (meta?.freeDelivery === true) {
    return { fee: 0, status: 'free' };
  }

  if (configuredFee != null) {
    if (configuredFee === 0) {
      return { fee: 0, status: 'free' };
    }
    if (freeThreshold != null && freeThreshold > 0 && subtotal >= freeThreshold) {
      return { fee: 0, status: 'free' };
    }
    return { fee: configuredFee, status: 'charged' };
  }

  return { fee: 0, status: 'free' };
}

export function getDeliveryFeeDisplay(
  cart: Cart | null | undefined,
  t: (key: TranslationKey) => string
): { label: string; tone: 'free' | 'charged' | 'muted'; hint?: string } {
  const subtotal = cart?.subtotal ?? 0;
  const status = cart?.deliveryFeeStatus ?? resolveDeliveryFee(cart, subtotal).status;
  const fee = cart?.deliveryFee ?? 0;

  if (status === 'pickup_only') {
    return { label: 'Pickup Only', tone: 'muted', hint: "Shop hasn't set up delivery" };
  }

  if (status === 'shop_set' || status === 'free' || fee === 0) {
    return { label: t('common.free'), tone: 'free' };
  }

  return { label: formatMoney(fee), tone: 'charged' };
}

export function getCartTotalForDisplay(cart: Cart | null | undefined): number {
  if (!cart) return 0;
  if (cart.deliveryFeeStatus === 'shop_set') {
    const platformFee = cart.platformFee ?? 0;
    return Math.max(0, cart.subtotal - (cart.discount ?? 0) + platformFee);
  }
  return cart.total;
}
