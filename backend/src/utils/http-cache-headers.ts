/** Conservative caching for authenticated seller read endpoints (CDN-safe when paired with Authorization). */
export function privateSellerShortTermCache(set: {
    headers: Record<string, string | number>;
}): void {
    set.headers["Cache-Control"] = "private, max-age=15, stale-while-revalidate=60";
}
