export function isOnboardingComplete(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as { onboardingCompletedAt?: string };
  return Boolean(m.onboardingCompletedAt);
}

export function isSellerApproved(store: {
  verificationStep?: string | null;
  status?: string | null;
} | null | undefined): boolean {
  if (!store) return false;
  return (
    store.verificationStep === 'APPROVED' ||
    store.status === 'ACTIVE'
  );
}

export function isSellerSuspended(store: { status?: string | null } | null | undefined): boolean {
  return store?.status === 'SUSPENDED';
}
