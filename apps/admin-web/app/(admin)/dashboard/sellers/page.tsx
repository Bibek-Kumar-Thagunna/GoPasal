"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { SellerKycPanel } from "@/components/sellers/SellerKycPanel";
import { PageHero } from "@/components/admin/PageHero";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  approveSeller,
  fetchAdminTenants,
  patchTenantCommission,
  patchTenantStatus,
  rejectSeller,
  suspendSeller,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { cn } from "@/lib/cn";
import { useToast } from "@/lib/toast";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verificationStep?: string | null;
  kycStatus?: string | null;
  verificationSubmittedAt?: string | null;
  commissionRate?: number | null;
  address?: string | null;
  phone?: string | null;
  owner?: { name: string | null; email: string | null; phone: string };
};

function canApproveStore(s: StoreRow): boolean {
  if (s.verificationStep === "APPROVED" && s.status === "ACTIVE") return false;
  return (
    s.verificationStep === "UNDER_REVIEW" ||
    s.verificationStep === "PENDING_REVIEW" ||
    s.status === "PENDING" ||
    s.status === "PENDING_APPROVAL"
  );
}

function verificationBadge(step?: string | null) {
  const v = step ?? "—";
  if (v === "APPROVED") return "bg-emerald-500/15 text-emerald-300";
  if (v === "REJECTED") return "bg-rose-500/15 text-rose-300";
  if (v === "UNDER_REVIEW" || v === "PENDING_REVIEW") return "bg-amber-500/15 text-amber-200";
  return "bg-white/10 text-white/55";
}

export default function SellersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  const { canGovernSellers } = useAdminCapabilities();
  const [page, setPage] = useState(1);
  const [lane, setLane] = useState<"" | "review" | "active" | "suspended">("");
  const [commissionTarget, setCommissionTarget] = useState<StoreRow | null>(null);
  const [commissionInput, setCommissionInput] = useState("10");
  const [suspendTarget, setSuspendTarget] = useState<StoreRow | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [approveTarget, setApproveTarget] = useState<StoreRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StoreRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [kycStoreId, setKycStoreId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [q, lane]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-tenants", page, q, lane],
    queryFn: () =>
      fetchAdminTenants({
        page,
        limit: 15,
        q: q || undefined,
        lane: lane || undefined,
      }),
  });

  const approveM = useMutation({
    mutationFn: (id: string) => approveSeller(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Shop approved and activated.");
      setApproveTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendSeller(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      setSuspendTarget(null);
      setSuspendReason("");
      toast.success("Shop suspended.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectSeller(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      setRejectTarget(null);
      setRejectReason("");
      toast.success("Application rejected — seller can resubmit documents.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reactivateM = useMutation({
    mutationFn: (id: string) =>
      patchTenantStatus(id, "ACTIVE", "Reactivated by platform admin"),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Shop reactivated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commissionM = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      patchTenantCommission(id, rate),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      setCommissionTarget(null);
      toast.success("Commission rate saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = (data?.items ?? []) as StoreRow[];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.limit ?? 15))
  );

  const openCommission = (s: StoreRow) => {
    if (!canGovernSellers) {
      toast.error("Only Super Admins can edit take rates.");
      return;
    }
    setCommissionTarget(s);
    setCommissionInput(String(s.commissionRate ?? 10));
  };

  const handleOpenSuspend = (s: StoreRow) => {
    if (!canGovernSellers) {
      toast.error("Only Super Admins can suspend shops.");
      return;
    }
    setSuspendTarget(s);
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Sellers" }]}
        icon={Store}
        title="Shops & sellers"
        description="Operate approvals, suspensions, and default take-rate. Marketing tiers attach separate commission discounts at checkout."
      />

      {!canGovernSellers ? (
        <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-5 py-3.5 text-[14px] text-amber-100">
          Marketplace governance (approve / suspend / commission) is restricted to Super Admins. You can browse the directory.
        </div>
      ) : null}

      {isError ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[14px] text-rose-100">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["", "All shops"],
            ["review", "Awaiting review"],
            ["active", "Active"],
            ["suspended", "Suspended"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key || "all"}
            type="button"
            onClick={() => setLane(key)}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-semibold transition",
              lane === key
                ? "bg-violet-600/35 text-white"
                : "text-white/45 hover:bg-white/[0.04]"
            )}
          >
            {label}
          </button>
        ))}
        {q ? (
          <span className="self-center text-[13px] text-white/40">
            Search: <span className="text-white/70">{q}</span>
          </span>
        ) : null}
      </div>

      <div className="glass-panel rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto overflow-admin-scroll">
          <table className="w-full min-w-[1100px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wider text-white/40">
                <th className="px-5 py-3.5">Store</th>
                <th className="px-5 py-3.5">Owner</th>
                <th className="px-5 py-3.5">Marketplace</th>
                <th className="px-5 py-3.5">KYC step</th>
                <th className="px-5 py-3.5">Commission %</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton cols={6} rows={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                    No shops yet — seed locally or onboard sellers.
                  </td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-[12px] text-white/40">{s.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-white/70">
                      <p>{s.owner?.name || "—"}</p>
                      <p className="text-[12px] text-white/40">{s.owner?.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[12px] font-bold",
                          s.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : s.status === "SUSPENDED"
                              ? "bg-rose-500/15 text-rose-300"
                              : "bg-amber-500/15 text-amber-200"
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[12px] font-bold",
                          verificationBadge(s.verificationStep)
                        )}
                      >
                        {s.verificationStep ?? "—"}
                      </span>
                      {s.kycStatus ? (
                        <p className="mt-1 text-[11px] text-white/35">KYC {s.kycStatus}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-white/80">
                      {typeof s.commissionRate === "number"
                        ? s.commissionRate
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setKycStoreId(s.id)}
                          className="rounded-lg border border-violet-500/35 bg-violet-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-violet-200"
                        >
                          Review KYC
                        </button>
                        {canApproveStore(s) ? (
                          <button
                            type="button"
                            disabled={!canGovernSellers || approveM.isPending}
                            title={
                              !canGovernSellers
                                ? "Super Admin only"
                                : "Approve KYC and activate storefront"
                            }
                            onClick={() =>
                              canGovernSellers ? setApproveTarget(s) : undefined
                            }
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-200 disabled:opacity-35"
                          >
                            Approve
                          </button>
                        ) : null}
                        {canApproveStore(s) ? (
                          <button
                            type="button"
                            disabled={!canGovernSellers || rejectM.isPending}
                            onClick={() => canGovernSellers && setRejectTarget(s)}
                            className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-amber-100 disabled:opacity-35"
                          >
                            Reject
                          </button>
                        ) : null}
                        {s.status === "SUSPENDED" ? (
                          <button
                            type="button"
                            disabled={!canGovernSellers || reactivateM.isPending}
                            onClick={() => canGovernSellers && reactivateM.mutate(s.id)}
                            className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-200 disabled:opacity-35"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canGovernSellers || s.status !== "ACTIVE"}
                            title={
                              !canGovernSellers
                                ? "Super Admin only"
                                : "Suspend seller storefront"
                            }
                            onClick={() => handleOpenSuspend(s)}
                            className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-rose-200 disabled:opacity-35"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!canGovernSellers}
                          title={!canGovernSellers ? "Super Admin only" : "Marketplace commission"}
                          onClick={() => openCommission(s)}
                          className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-sky-200 disabled:opacity-35"
                        >
                          Commission
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 text-[13px] text-white/45">
          <span>
            Total {data?.total ?? 0} · Page {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={approveTarget !== null}
        title="Approve this storefront?"
        description={
          <>
            <span className="text-white">{approveTarget?.name}</span> will be marked ACTIVE, KYC
            approved, and the seller app will show the welcome + setup flow.
          </>
        }
        confirmLabel="Approve shop"
        loading={approveM.isPending}
        onCancel={() => setApproveTarget(null)}
        onConfirm={() => {
          if (!approveTarget) return;
          void approveM.mutate(approveTarget.id);
        }}
      />

      {commissionTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6">
            <h3 className="admin-heading-section">Commission rate</h3>
            <p className="admin-copy-muted mt-1">{commissionTarget.name}</p>
            <label className="mt-4 block text-[13px] font-medium text-white/60">
              Take rate (0–100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              className="glass-input mt-1 h-11 w-full text-[14px]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCommissionTarget(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-[14px] text-white/70"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={commissionM.isPending}
                onClick={() => {
                  const r = parseFloat(commissionInput);
                  if (Number.isNaN(r) || r < 0 || r > 100) return;
                  void commissionM.mutate({
                    id: commissionTarget.id,
                    rate: r,
                  });
                }}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-[14px] font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6">
            <h3 className="admin-heading-section">Reject application</h3>
            <p className="admin-copy-muted mt-1">{rejectTarget.name}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason shown internally; seller must resubmit KYC"
              rows={3}
              className="glass-input mt-4 w-full resize-none p-3 text-[14px]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-[14px] text-white/70"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectM.isPending || rejectReason.trim().length < 3}
                onClick={() =>
                  void rejectM.mutate({
                    id: rejectTarget.id,
                    reason: rejectReason.trim(),
                  })
                }
                className="rounded-xl bg-amber-700/90 px-4 py-2 text-[14px] font-semibold text-white"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {suspendTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6">
            <h3 className="admin-heading-section">Suspend shop</h3>
            <p className="admin-copy-muted mt-1">{suspendTarget.name}</p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for operators & audit log"
              rows={3}
              className="glass-input mt-4 w-full resize-none p-3 text-[14px]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-[14px] text-white/70"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={suspendM.isPending || suspendReason.trim().length < 3}
                onClick={() =>
                  void suspendM.mutate({
                    id: suspendTarget.id,
                    reason: suspendReason.trim(),
                  })
                }
                className="rounded-xl bg-rose-600/90 px-4 py-2 text-[14px] font-semibold text-white"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SellerKycPanel
        storeId={kycStoreId}
        onClose={() => setKycStoreId(null)}
        canGovern={canGovernSellers}
      />
    </>
  );
}
