import type { Cart, CartItem } from '../types';
import { resolveDeliveryFee } from './delivery-fee';

type CartItemLike = CartItem & {
  variant?: {
    price?: number | string;
    priceOffset?: number | string;
    product?: {
      name?: string;
      storeId?: string;
      basePrice?: number | string;
      price?: number | string;
      store?: { id: string; name: string };
    };
  };
};

type CartLike = Cart & {
  store?: { id: string; name: string };
  items?: CartItemLike[];
};

function parseNumeric(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getCartItemPrice(item: CartItemLike): number {
  if (item.price != null && item.price > 0) return item.price;

  const variant = item.variant;
  if (variant?.product) {
    const basePrice = parseNumeric(variant.product.basePrice);
    const priceOffset = parseNumeric(variant.priceOffset);
    return basePrice + priceOffset;
  }

  const basePrice = parseNumeric(item.product?.basePrice ?? item.product?.price);
  if (basePrice > 0) return basePrice;

  const raw = variant?.price;
  const parsed = typeof raw === 'string' ? parseFloat(raw) : raw ?? 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeCart(cart: CartLike | null | undefined): Cart {
  if (!cart?.items?.length) {
    return {
      items: [],
      subtotal: 0,
      deliveryFee: cart?.deliveryFee ?? 0,
      discount: cart?.discount ?? 0,
      platformFee: 10,
      total: 0,
      ...(cart?.storeId ? { storeId: cart.storeId } : {}),
      ...(cart?.store ? { store: cart.store } : {}),
    };
  }

  const items = cart.items.map((item) => {
    const price = getCartItemPrice(item);
    const total = price * item.quantity;
    return { ...item, price, total };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = cart.discount ?? 0;
  const { fee: deliveryFee, status: deliveryFeeStatus } = resolveDeliveryFee(
    { ...cart, items, subtotal },
    subtotal
  );
  const platformFee = 10;
  const total =
    deliveryFeeStatus === 'shop_set'
      ? Math.max(0, subtotal - discount + platformFee)
      : Math.max(0, subtotal + deliveryFee - discount + platformFee);

  return {
    ...cart,
    items,
    subtotal,
    deliveryFee,
    deliveryFeeStatus,
    discount,
    platformFee,
    total,
  };
}

export function getCartItemStoreId(item: CartItemLike): string | undefined {
  return (
    item.product?.storeId ||
    item.variant?.product?.storeId ||
    item.variant?.product?.store?.id
  );
}

export function getCartItemProductName(item: CartItemLike): string {
  return item.product?.name || item.variant?.product?.name || 'Product';
}

export function getCartStoreIds(cart: CartLike | null | undefined): string[] {
  if (!cart) return [];
  const ids = new Set<string>();
  if (cart.storeId) ids.add(cart.storeId);
  if (cart.store?.id) ids.add(cart.store.id);
  for (const item of cart.items ?? []) {
    const sid = getCartItemStoreId(item);
    if (sid) ids.add(sid);
  }
  return Array.from(ids);
}

export function isSingleStoreCart(cart: CartLike | null | undefined): boolean {
  if (!cart?.items?.length) return true;
  return getCartStoreIds(cart).length <= 1;
}

export function getCartStoreName(cart: CartLike | null | undefined): string | undefined {
  if (!cart) return undefined;
  if (cart.store?.name) return cart.store.name;
  const first = cart.items?.[0];
  return first?.variant?.product?.store?.name;
}

export function getCartStoreId(cart: CartLike | null | undefined): string | undefined {
  if (!cart) return undefined;
  const ids = getCartStoreIds(cart);
  return cart.storeId || cart.store?.id || ids[0];
}
