/** Read tenantId from access JWT payload (no signature verify — client hint only). */
export function readJwtTenantId(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const json =
      typeof atob === 'function'
        ? atob(segment.replace(/-/g, '+').replace(/_/g, '/'))
        : Buffer.from(segment, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { tenantId?: string | null };
    return payload.tenantId ?? null;
  } catch {
    return null;
  }
}
