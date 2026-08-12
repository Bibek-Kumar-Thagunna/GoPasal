export function buildStoreApprovedUpdate(now = new Date()) {
    return {
        status: "ACTIVE" as const,
        verificationStep: "APPROVED" as const,
        kycStatus: "APPROVED",
        verificationReviewedAt: now,
        isOpen: true,
        updatedAt: now,
    };
}

export function buildStoreRejectedUpdate(reason: string, now = new Date()) {
    return {
        status: "PENDING_APPROVAL" as const,
        verificationStep: "REJECTED" as const,
        kycStatus: "REJECTED",
        verificationReviewedAt: now,
        isOpen: false,
        adminNotes: reason,
        updatedAt: now,
    };
}

export function buildStoreSuspendedUpdate(now = new Date()) {
    return {
        status: "SUSPENDED" as const,
        isOpen: false,
        updatedAt: now,
    };
}

export function isStoreOnboardingComplete(metadata: unknown): boolean {
    if (!metadata || typeof metadata !== "object") return false;
    const m = metadata as { onboardingCompletedAt?: string };
    return Boolean(m.onboardingCompletedAt);
}

export function buildStoreResendSetupUpdate(now = new Date()) {
    const clearedMetadata = {
        onboardingCompletedAt: null,
        onboardingResentAt: now.toISOString(),
    };
    return {
        updatedAt: now,
        metadata: clearedMetadata as unknown,
    };
}

export function mergeStoreMetadata(
    existing: unknown,
    patch: Record<string, unknown>
): Record<string, unknown> {
    const base =
        existing && typeof existing === "object" && !Array.isArray(existing)
            ? { ...(existing as Record<string, unknown>) }
            : {};
    return { ...base, ...patch };
}
