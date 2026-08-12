const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1"
).replace(/\/api\/v1\/?$/, "");

export type KycPreviewKind = "image" | "pdf" | "link" | "unavailable";

export type KycPreview = {
  kind: KycPreviewKind;
  href: string | null;
  label: string;
  hint?: string;
};

export function resolveKycPreview(value: string | null | undefined): KycPreview {
  const raw = (value ?? "").trim();
  if (!raw) {
    return { kind: "unavailable", href: null, label: "Not uploaded" };
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    if (raw.includes("/seller/media/kyc/") && raw.endsWith(".pdf")) {
      return { kind: "pdf", href: raw, label: "PDF document" };
    }
    if (/\.(pdf)(\?|$)/i.test(raw)) {
      return { kind: "pdf", href: raw, label: "PDF document" };
    }
    if (/\.(png|jpe?g|webp|gif)(\?|$)/i.test(raw) || raw.includes("/seller/media/")) {
      return { kind: "image", href: raw, label: "Image" };
    }
    return { kind: "link", href: raw, label: "Open file" };
  }

  if (raw.startsWith("file:") || raw.startsWith("content:")) {
    return {
      kind: "unavailable",
      href: null,
      label: raw.split("/").pop() ?? raw,
      hint: "Uploaded on device only — ask seller to re-upload using the in-app KYC flow.",
    };
  }

  if (/^[a-zA-Z0-9_-]{12,}\.(pdf|png|jpe?g|webp)$/i.test(raw)) {
    const href = `${API_ORIGIN}/api/v1/seller/media/kyc/${raw}`;
    return raw.endsWith(".pdf")
      ? { kind: "pdf", href, label: raw }
      : { kind: "image", href, label: raw };
  }

  return {
    kind: "unavailable",
    href: null,
    label: raw,
    hint: "No hosted file URL — seller may need to re-submit documents.",
  };
}

export type AdminTenantKyc = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationStep?: string | null;
  kycStatus?: string | null;
  kycBusinessName?: string | null;
  kycPanVat?: string | null;
  kycAddress?: string | null;
  kycDocumentUrl?: string | null;
  kycStoreLicenseUrl?: string | null;
  kycStorePhotos?: string[] | null;
  verificationSubmittedAt?: string | null;
  verificationReviewedAt?: string | null;
  adminNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  owner?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};
