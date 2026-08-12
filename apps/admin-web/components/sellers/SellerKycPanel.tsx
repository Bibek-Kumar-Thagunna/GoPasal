"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, X } from "lucide-react";
import {
  approveSeller,
  fetchAdminTenant,
  rejectSeller,
  resendSellerToSetup,
} from "@/lib/api";
import { resolveKycPreview, type AdminTenantKyc } from "@/lib/kyc-preview";
import { cn } from "@/lib/cn";
import { useToast } from "@/lib/toast";

type SellerKycPanelProps = {
  storeId: string | null;
  onClose: () => void;
  canGovern: boolean;
};

function DocBlock({ title, value }: { title: string; value?: string | null }) {
  const preview = resolveKycPreview(value);
  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-white/45">{title}</p>
      <p className="mt-1 break-all text-[14px] text-white/80">{preview.label}</p>
      {preview.hint ? (
        <p className="mt-2 text-[13px] leading-relaxed text-amber-200/90">{preview.hint}</p>
      ) : null}
      {preview.href && preview.kind === "image" ? (
        <a href={preview.href} target="_blank" rel="noreferrer" className="mt-3 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.href}
            alt={title}
            className="max-h-56 w-full rounded-lg border border-white/10 object-contain bg-black/40"
          />
        </a>
      ) : null}
      {preview.href && preview.kind === "pdf" ? (
        <iframe
          title={title}
          src={preview.href}
          className="mt-3 h-64 w-full rounded-lg border border-white/10 bg-white"
        />
      ) : null}
      {preview.href && (preview.kind === "link" || preview.kind === "pdf") ? (
        <a
          href={preview.href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-sky-300 hover:text-sky-200"
        >
          Open in new tab
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

export function SellerKycPanel({ storeId, onClose, canGovern }: SellerKycPanelProps) {
  const qc = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-tenant-kyc", storeId],
    enabled: Boolean(storeId),
    queryFn: () => fetchAdminTenant(storeId!),
  });

  const tenant = data as AdminTenantKyc | undefined;

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-tenants"] });
    void qc.invalidateQueries({ queryKey: ["admin-tenant-kyc", storeId] });
  };

  const approveM = useMutation({
    mutationFn: () => approveSeller(storeId!),
    onSuccess: () => {
      toast.success("Shop approved.");
      invalidate();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectM = useMutation({
    mutationFn: (reason: string) => rejectSeller(storeId!, reason),
    onSuccess: () => {
      toast.success("Application rejected.");
      invalidate();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resendM = useMutation({
    mutationFn: () => resendSellerToSetup(storeId!),
    onSuccess: () => {
      toast.success("Seller will see the setup checklist again on next app open.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!storeId) return null;

  const photos = Array.isArray(tenant?.kycStorePhotos) ? tenant!.kycStorePhotos! : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <div className="glass-panel flex h-full w-full max-w-lg flex-col border-l border-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-violet-300/90">
              KYC review
            </p>
            <h2 className="admin-heading-section mt-1">{tenant?.name ?? "Loading…"}</h2>
            <p className="admin-copy-muted mt-1 font-mono text-[12px]">{storeId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-admin-scroll p-5">
          {isLoading ? (
            <p className="text-[14px] text-white/50">Loading KYC…</p>
          ) : isError ? (
            <p className="text-[14px] text-rose-300">{(error as Error).message}</p>
          ) : tenant ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <p className="text-white/40">Marketplace</p>
                  <p className="mt-1 font-semibold text-white">{tenant.status}</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <p className="text-white/40">KYC step</p>
                  <p className="mt-1 font-semibold text-white">{tenant.verificationStep ?? "—"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-[14px]">
                <p className="font-semibold text-white">{tenant.owner?.name ?? "Owner"}</p>
                <p className="text-white/55">{tenant.owner?.phone}</p>
                <p className="text-white/55">{tenant.owner?.email}</p>
              </div>

              <div className="space-y-2 text-[14px] text-white/75">
                <p>
                  <span className="text-white/45">Business:</span> {tenant.kycBusinessName ?? "—"}
                </p>
                <p>
                  <span className="text-white/45">PAN/VAT:</span> {tenant.kycPanVat ?? "—"}
                </p>
                <p>
                  <span className="text-white/45">Address:</span> {tenant.kycAddress ?? "—"}
                </p>
              </div>

              <DocBlock title="Business registration" value={tenant.kycDocumentUrl} />
              <DocBlock title="PAN / license" value={tenant.kycStoreLicenseUrl} />

              {photos.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-white/45">
                    Store photos
                  </p>
                  {photos.map((url, i) => (
                    <DocBlock key={`${url}-${i}`} title={`Photo ${i + 1}`} value={url} />
                  ))}
                </div>
              ) : (
                <DocBlock title="Store photos" value={null} />
              )}

              {tenant.adminNotes ? (
                <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-[13px] text-amber-100">
                  Admin notes: {tenant.adminNotes}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {canGovern && tenant ? (
          <div className="space-y-2 border-t border-white/[0.06] p-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={approveM.isPending}
                onClick={() => approveM.mutate()}
                className="flex-1 rounded-xl bg-emerald-600/90 px-3 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={rejectM.isPending}
                onClick={() => {
                  const reason = window.prompt(
                    "Rejection reason (seller must resubmit KYC):",
                    "Documents incomplete or unclear"
                  );
                  if (reason && reason.trim().length >= 3) rejectM.mutate(reason.trim());
                }}
                className="flex-1 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-[14px] font-semibold text-amber-100 disabled:opacity-40"
              >
                Reject
              </button>
            </div>
            {tenant.status === "ACTIVE" && tenant.verificationStep === "APPROVED" ? (
              <button
                type="button"
                disabled={resendM.isPending}
                onClick={() => resendM.mutate()}
                className={cn(
                  "w-full rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2.5 text-[14px] font-semibold text-sky-200"
                )}
              >
                Re-send to store setup
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
