const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
];

function firstImageUrl(images: unknown): string | null {
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0];
  if (typeof first === 'string' && first.trim()) return first.trim();
  if (first && typeof first === 'object' && typeof (first as { url?: string }).url === 'string') {
    return (first as { url: string }).url.trim() || null;
  }
  return null;
}

/** Resolve a product image URL with a stable fallback when none is set. */
export function getProductImageUrl(
  product: { images?: unknown; image?: string | null; id?: string } | null | undefined,
  index = 0
): string {
  const fromImages = firstImageUrl(product?.images);
  if (fromImages) return fromImages;
  if (typeof product?.image === 'string' && product.image.trim()) return product.image.trim();
  return FALLBACK_PRODUCT_IMAGES[Math.abs(index) % FALLBACK_PRODUCT_IMAGES.length];
}
