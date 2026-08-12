"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Megaphone } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  createAdminCoupon,
  fetchAdminCoupons,
  fetchAdminProductStores,
  patchAdminCouponStatus,
  type AdminCouponRow,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { downloadCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast";

export default function PromotionsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { canManageCoupons } = useAdminCapabilities();
  const sp = useSearchParams();
  const qFromUrl = sp.get("q") ?? "";
  const [page, setPage] = useState(1);
  const [couponFilter, setCouponFilter] = useState("");
  const [pendingCouponFilter, setPendingCouponFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [couponStatusChange, setCouponStatusChange] = useState<
    Pick<AdminCouponRow, "id" | "code" | "status"> | null
  >(null);
  useEffect(() => {
    const v = qFromUrl.trim();
    setPendingCouponFilter(v);
    setCouponFilter(v);
    setPage(1);
  }, [qFromUrl]);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [value, setValue] = useState(50);
  const [minOrderValue, setMinOrderValue] = useState(199);
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimitTotal, setUsageLimitTotal] = useState(5000);
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(1);
  const [requiresMembership, setRequiresMembership] = useState(false);
  const [platformWide, setPlatformWide] = useState(true);
  const [couponStoreId, setCouponStoreId] = useState("");
  const [daysValid, setDaysValid] = useState(30);

  const storesQ = useQuery({
    queryKey: ["stores-for-promo"],
    queryFn: fetchAdminProductStores,
  });

  const listQ = useQuery({
    queryKey: ["admin-coupons", page, couponFilter],
    queryFn: () =>
      fetchAdminCoupons({
        page,
        limit: 20,
        q: couponFilter || undefined,
      }),
  });

  const createM = useMutation({
    mutationFn: () =>
      createAdminCoupon({
        ...(platformWide || !couponStoreId
          ? {}
          : { storeId: couponStoreId }),
        code,
        type,
        value,
        minOrderValue,
        maxDiscount:
          maxDiscount.trim() === "" ? undefined : parseFloat(maxDiscount),
        usageLimitTotal: usageLimitTotal || undefined,
        usageLimitPerUser: usageLimitPerUser || 1,
        requiresMembership,
        startDate: new Date().toISOString(),
        endDate: new Date(
          Date.now() + daysValid * 24 * 60 * 60 * 1000
        ).toISOString(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setShowForm(false);
      toast.success("Coupon issued.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusM = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "PAUSED";
    }) => patchAdminCouponStatus(id, status),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(vars.status === "ACTIVE" ? "Coupon activated." : "Coupon paused.");
      setCouponStatusChange(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const applyWelcomePreset = () => {
    if (!canManageCoupons) {
      toast.error("Your role cannot create coupons.");
      return;
    }
    const suffix = Math.floor(Math.random() * 900 + 100);
    setCode(`WELCOME${suffix}`);
    setType("FIXED");
    setValue(50);
    setMinOrderValue(249);
    setUsageLimitPerUser(1);
    setUsageLimitTotal(10000);
    setRequiresMembership(false);
    setPlatformWide(true);
    setDaysValid(45);
    setShowForm(true);
  };

  const items = listQ.data?.items ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((listQ.data?.total ?? 0) / (listQ.data?.limit ?? 20))
  );

  const runCouponSearch = () => {
    const t = pendingCouponFilter.trim();
    setPage(1);
    setCouponFilter(t);
    const qs = new URLSearchParams(sp.toString());
    if (t) qs.set("q", t);
    else qs.delete("q");
    const next = qs.toString();
    router.replace(next ? `/dashboard/promotions?${next}` : "/dashboard/promotions");
  };

  const handleExportCouponsPage = () => {
    if (!items.length) return;
    downloadCsv(
      `coupons-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "code",
        "scope",
        "type",
        "value",
        "status",
        "endDate",
        "usedCount",
        "usageLimitTotal",
      ],
      items.map((c: AdminCouponRow) => ({
        code: c.code,
        scope: c.isPlatformWide ? "platform" : (c.storeName ?? c.storeId),
        type: c.type,
        value: c.value,
        status: c.status,
        endDate: c.endDate,
        usedCount: c.usedCount ?? "",
        usageLimitTotal: c.usageLimitTotal ?? "",
      }))
    );
    toast.success("Exported current page to CSV");
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Promotions" }]}
        icon={Megaphone}
        title="Coupons & growth"
        description="Platform vouchers for first orders, member-only boosts, or store-funded campaigns."
        action={
          canManageCoupons ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyWelcomePreset}
              className="rounded-xl border border-violet-500/35 bg-violet-500/15 px-4 py-2.5 text-[14px] font-semibold text-violet-100"
            >
              Welcome Rs.50 preset
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg"
            >
              New coupon
            </button>
          </div>
          ) : undefined
        }
      />

      <div className="glass-panel mb-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" />
            <input
              type="search"
              value={pendingCouponFilter}
              onChange={(e) => setPendingCouponFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runCouponSearch()}
              placeholder="Filter by coupon code…"
              className="glass-input h-11 w-full pl-11 text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={runCouponSearch}
            className="rounded-xl bg-gradient-to-r from-gp-blue to-indigo-500 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Apply
          </button>
          <button
            type="button"
            disabled={!items.length}
            onClick={handleExportCouponsPage}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/[0.07] disabled:opacity-35"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      {!canManageCoupons ? (
        <p className="mb-4 text-[14px] text-amber-200/85">
          Your operator role can review coupon performance below but cannot pause or publish codes.
        </p>
      ) : null}

      {listQ.isError ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[14px] text-rose-100">
          {(listQ.error as Error).message}
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full min-w-[900px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[12px] uppercase tracking-wider text-white/40">
              <th className="px-5 py-3.5">Code</th>
              <th className="px-5 py-3.5">Scope</th>
              <th className="px-5 py-3.5">Value</th>
              <th className="px-5 py-3.5">Usage</th>
              <th className="px-5 py-3.5">Ends</th>
              <th className="px-5 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading ? (
              <AdminTableSkeleton cols={6} rows={8} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                  {couponFilter
                    ? "No coupons match this search."
                    : "No coupons defined — seed platform store and create your first voucher."}
                </td>
              </tr>
            ) : (
              items.map((c: AdminCouponRow) => (
                <tr key={c.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3.5 font-mono font-bold text-white">
                    {c.code}
                    {c.requiresGold ? (
                      <span className="ml-2 rounded bg-violet-500/20 px-1.5 py-0.5 text-[11px] text-violet-200">
                        member
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-white/70">
                    {c.isPlatformWide ? (
                      <span className="text-sky-200">Marketplace-wide</span>
                    ) : (
                      c.storeName ?? c.storeId
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {c.type === "FIXED"
                      ? `Rs. ${c.value}`
                      : `${c.value}%`}
                    <p className="text-[12px] text-white/40">
                      min Rs. {c.minOrderValue}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-white/60">
                    {c.usedCount ?? 0}/{c.usageLimitTotal ?? "∞"} ·{" "}
                    {c.usageLimitPerUser ?? 1} / user
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-white/45">
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={statusM.isPending || !canManageCoupons}
                      onClick={() =>
                        canManageCoupons
                          ? setCouponStatusChange({
                              id: c.id,
                              code: c.code,
                              status: c.status,
                            })
                          : undefined
                      }
                      className="rounded-lg border border-white/12 px-3 py-1.5 text-[13px] disabled:opacity-35"
                    >
                      {c.status === "ACTIVE" ? "Pause" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-between border-t border-white/[0.06] px-5 py-3.5 text-[13px] text-white/45">
          <span>
            Total {listQ.data?.total ?? 0} · Page {page}/{totalPages}
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
        open={couponStatusChange !== null}
        title={
          couponStatusChange?.status === "ACTIVE"
            ? "Pause this coupon?"
            : "Activate this coupon?"
        }
        description={
          couponStatusChange ? (
            <>
              Code{" "}
              <span className="font-mono text-white">{couponStatusChange.code}</span>{" "}
              {couponStatusChange.status === "ACTIVE"
                ? "will stop accepting new redemptions until re-activated."
                : "will be eligible at checkout again if still within validity rules."}
            </>
          ) : undefined
        }
        confirmLabel={
          couponStatusChange?.status === "ACTIVE" ? "Pause" : "Activate"
        }
        variant={couponStatusChange?.status === "ACTIVE" ? "danger" : "default"}
        loading={statusM.isPending}
        onCancel={() => setCouponStatusChange(null)}
        onConfirm={() => {
          if (!couponStatusChange || !canManageCoupons) return;
          void statusM.mutate({
            id: couponStatusChange.id,
            status: couponStatusChange.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
          });
        }}
      />

      {showForm && canManageCoupons ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6">
            <h3 className="admin-heading-section">Issue coupon</h3>
            <label className="mt-4 block text-[13px] text-white/55">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="glass-input mt-1 h-11 w-full font-mono text-[14px]"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] text-white/55">Type</label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "FIXED" | "PERCENT")
                  }
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                >
                  <option value="FIXED">Fixed NPR</option>
                  <option value="PERCENT">Percent</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] text-white/55">Value</label>
                <input
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                />
              </div>
            </div>

            <label className="mt-3 block text-[13px] text-white/55">
              Min cart (NPR)
            </label>
            <input
              type="number"
              min={0}
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(Number(e.target.value))}
              className="glass-input mt-1 h-11 w-full text-[14px]"
            />

            {type === "PERCENT" ? (
              <>
                <label className="mt-3 block text-[13px] text-white/55">
                  Max discount cap (optional NPR)
                </label>
                <input
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                  placeholder="e.g. 200"
                />
              </>
            ) : null}

            <label className="mt-3 block text-[13px] text-white/55">
              Valid days from today
            </label>
            <input
              type="number"
              min={1}
              value={daysValid}
              onChange={(e) => setDaysValid(Number(e.target.value))}
              className="glass-input mt-1 h-11 w-full text-[14px]"
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] text-white/55">
                  Total redemptions cap
                </label>
                <input
                  type="number"
                  min={1}
                  value={usageLimitTotal}
                  onChange={(e) =>
                    setUsageLimitTotal(Number(e.target.value))
                  }
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                />
              </div>
              <div>
                <label className="text-[13px] text-white/55">Per-user cap</label>
                <input
                  type="number"
                  min={1}
                  value={usageLimitPerUser}
                  onChange={(e) =>
                    setUsageLimitPerUser(Number(e.target.value))
                  }
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 text-[14px] text-white/65">
              <input
                type="checkbox"
                checked={requiresMembership}
                onChange={(e) => setRequiresMembership(e.target.checked)}
              />
              Requires paid membership / Gold benefits
            </label>

            <label className="mt-3 flex items-center gap-2 text-[14px] text-white/65">
              <input
                type="checkbox"
                checked={platformWide}
                onChange={(e) => setPlatformWide(e.target.checked)}
              />
              Platform-wide (omit to target one shop below)
            </label>

            {!platformWide ? (
              <select
                value={couponStoreId}
                onChange={(e) => setCouponStoreId(e.target.value)}
                className="glass-input mt-2 h-11 w-full text-[14px]"
              >
                <option value="">Select shop…</option>
                {(storesQ.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : null}

            {createM.isError ? (
              <p className="mt-3 text-[13px] text-rose-300">
                {(createM.error as Error).message}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/12 px-4 py-2 text-[14px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  createM.isPending ||
                  code.trim().length < 3 ||
                  (!platformWide && !couponStoreId)
                }
                onClick={() => void createM.mutate()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-[14px] font-semibold text-white"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
