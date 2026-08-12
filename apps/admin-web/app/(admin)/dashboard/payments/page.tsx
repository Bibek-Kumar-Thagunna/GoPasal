"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bike,
  CreditCard,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  fetchAdminDashboardStats,
  fetchAdminProductStores,
  fetchAdminRecentOrders,
  fetchAdminSettlements,
  fetchAdminWebhooks,
  fetchAdminCodRecords,
  postAdminGenerateSettlement,
  postAdminRefund,
  postAdminSettlementPayout,
  type AdminSettlementRow,
  type RecentOrderRow,
  type WebhookEventRow,
  type CodRecordRow,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { useToast } from "@/lib/toast";

export default function PaymentsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const {
    canProcessRefunds,
    canGenerateSettlements,
    canExecutePayouts,
    isStaffAdmin,
  } = useAdminCapabilities();

  const statsQ = useQuery({
    queryKey: ["finance-dash-stats"],
    queryFn: fetchAdminDashboardStats,
    staleTime: 60_000,
  });

  const recentQ = useQuery({
    queryKey: ["finance-recent-orders"],
    queryFn: () => fetchAdminRecentOrders(12),
    staleTime: 30_000,
  });

  const storesQ = useQuery({
    queryKey: ["finance-stores"],
    queryFn: fetchAdminProductStores,
    staleTime: 120_000,
  });

  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const [settleStoreId, setSettleStoreId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);

  const [payoutSettlementId, setPayoutSettlementId] = useState("");
  const [payoutTxnRef, setPayoutTxnRef] = useState("");
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [settlementsPage, setSettlementsPage] = useState(1);

  const settlementsQ = useQuery({
    queryKey: ["finance-settlements", settlementsPage],
    queryFn: () => fetchAdminSettlements({ page: settlementsPage, limit: 10 }),
    staleTime: 30_000,
  });

  const webhooksQ = useQuery({
    queryKey: ["finance-webhooks"],
    queryFn: () => fetchAdminWebhooks({ limit: 15 }),
    staleTime: 20_000,
  });

  const codQ = useQuery({
    queryKey: ["finance-cod-records"],
    queryFn: () => fetchAdminCodRecords({ limit: 15 }),
    staleTime: 20_000,
  });

  const refundM = useMutation({
    mutationFn: () =>
      postAdminRefund({
        orderId: orderId.trim(),
        amount: amount.trim(),
        reason: reason.trim(),
      }),
    onSuccess: () => {
      toast.success("Refund request recorded in governance ledger.");
      setRefundDialogOpen(false);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["finance-recent-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settleGenM = useMutation({
    mutationFn: () =>
      postAdminGenerateSettlement({
        storeId: settleStoreId.trim(),
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Settlement batch generation requested.");
      setSettleDialogOpen(false);
      void qc.invalidateQueries({ queryKey: ["finance-settlements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payoutM = useMutation({
    mutationFn: () =>
      postAdminSettlementPayout(payoutSettlementId.trim(), payoutTxnRef.trim()),
    onSuccess: () => {
      toast.success("Payout marker recorded.");
      setPayoutDialogOpen(false);
      setPayoutTxnRef("");
      void qc.invalidateQueries({ queryKey: ["finance-settlements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ruFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

  const handleRefundClick = () => {
    if (!canProcessRefunds) {
      toast.error("Sign in as platform staff to process refunds.");
      return;
    }
    if (
      orderId.trim().length < 8 ||
      !amount.trim() ||
      reason.trim().length < 4
    ) {
      toast.error("Fill order id, amount, and a reason (min 4 chars).");
      return;
    }
    setRefundDialogOpen(true);
  };

  const handleSettlePrep = () => {
    if (!canGenerateSettlements) return;
    if (!settleStoreId.trim() || !periodStart || !periodEnd) {
      toast.error("Choose a shop and both period boundaries.");
      return;
    }
    const a = new Date(periodStart).getTime();
    const b = new Date(periodEnd).getTime();
    if (!(b > a)) {
      toast.error("Period end must be after start.");
      return;
    }
    setSettleDialogOpen(true);
  };

  const handlePayoutPrep = () => {
    if (!canExecutePayouts) return;
    if (payoutSettlementId.trim().length < 8 || payoutTxnRef.trim().length < 4) {
      toast.error("Settlement id and bank / gateway reference required.");
      return;
    }
    setPayoutDialogOpen(true);
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Payments" }]}
        icon={CreditCard}
        title="Finance & treasury"
        description="Refund intents, seller settlement batches, and payout references — paired with Orders and Disputes for clean audit trails."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[13px] font-semibold text-white/80 hover:bg-white/[0.09]"
            >
              Orders pipeline <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/delivery"
              className="inline-flex items-center gap-1 rounded-full border border-teal-500/35 bg-teal-500/10 px-4 py-2 text-[13px] font-semibold text-teal-100 hover:bg-teal-500/18"
            >
              <Bike className="h-3.5 w-3.5" aria-hidden />
              Delivery desk
            </Link>
            <Link
              href="/dashboard/disputes"
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-[13px] font-semibold text-rose-100"
            >
              Disputes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/10 px-4 py-2 text-[13px] font-semibold text-sky-100"
            >
              Reports export <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      {!isStaffAdmin ? (
        <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-5 py-3.5 text-[14px] text-amber-100">
          Finance actions require platform staff credentials.
        </div>
      ) : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Lifetime GMV (NPR)",
            value: `Rs. ${ruFmt.format(statsQ.data?.totalRevenue ?? 0)}`,
            tone: "text-emerald-200",
          },
          {
            label: "Orders booked",
            value: ruFmt.format(statsQ.data?.totalOrders ?? 0),
            tone: "text-violet-200",
          },
          {
            label: "Buyers registered",
            value: ruFmt.format(statsQ.data?.totalUsers ?? 0),
            tone: "text-sky-200",
          },
          {
            label: "Active storefronts",
            value: ruFmt.format(statsQ.data?.activeStores ?? 0),
            tone: "text-orange-200",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-4"
          >
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/38">
              {k.label}
            </div>
            <p className={`mt-2 font-display text-xl font-bold ${k.tone}`}>
              {statsQ.isLoading ? "…" : k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8 glass-panel overflow-hidden rounded-2xl">
        <AdminSectionHeader
          variant="panel"
          icon={FileSpreadsheet}
          title="Settlement batches"
          description="Generated seller payout cycles — click a row to pre-fill payout reference below."
        />
        <div className="overflow-x-auto overflow-admin-scroll">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-wider text-white/38">
              <tr>
                <th className="px-4 py-2">Settlement</th>
                <th className="px-4 py-2">Shop</th>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Net NPR</th>
              </tr>
            </thead>
            <tbody>
              {settlementsQ.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/45">
                    Loading…
                  </td>
                </tr>
              ) : (settlementsQ.data?.items ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/45">
                    No settlements yet — generate a batch for a shop below.
                  </td>
                </tr>
              ) : (
                (settlementsQ.data?.items ?? []).map((row: AdminSettlementRow) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03]"
                    onClick={() => setPayoutSettlementId(row.id)}
                  >
                    <td className="px-4 py-2.5 font-mono text-[12px] text-sky-200">
                      {row.id.length > 18 ? `${row.id.slice(0, 18)}…` : row.id}
                    </td>
                    <td className="px-4 py-2.5 text-white/70">
                      {row.store?.name ?? row.storeId}
                    </td>
                    <td className="px-4 py-2.5 text-white/50">
                      {new Date(row.periodStart).toLocaleDateString()} –{" "}
                      {new Date(row.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-white/60">{row.status}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-200/90">
                      {row.netAmount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-white/[0.06] px-4 py-2 text-[13px] text-white/45">
          <span>
            Total {settlementsQ.data?.total ?? 0} · Page {settlementsPage}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={settlementsPage <= 1}
              onClick={() => setSettlementsPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={
                settlementsPage * (settlementsQ.data?.limit ?? 10) >=
                (settlementsQ.data?.total ?? 0)
              }
              onClick={() => setSettlementsPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="glass-panel xl:col-span-2 overflow-hidden rounded-2xl">
          <AdminSectionHeader
            variant="panel"
            icon={FileSpreadsheet}
            title="Recent orders"
            description="Latest checkout lines for finance review — deep link into the full pipeline."
            actions={
              <Link href="/dashboard/orders" className="text-[13px] font-medium text-sky-300 hover:text-sky-200">
                Open all →
              </Link>
            }
          />
          <div className="max-h-[360px] overflow-auto overflow-admin-scroll">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[#0d1024]/98 text-[11px] uppercase tracking-wider text-white/38">
                <tr>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Shop</th>
                  <th className="px-4 py-2 text-right">NPR</th>
                </tr>
              </thead>
              <tbody>
                {recentQ.isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-white/45">
                      Loading…
                    </td>
                  </tr>
                ) : (recentQ.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-white/45">
                      No recent orders yet.
                    </td>
                  </tr>
                ) : (
                  (recentQ.data ?? []).map((o: RecentOrderRow) => (
                    <tr key={o.id} className="border-b border-white/[0.04]">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/dashboard/orders?q=${encodeURIComponent(o.id)}`}
                          className="font-mono text-[12px] text-sky-200 hover:text-sky-100"
                        >
                          {o.id && o.id.length > 14 ? `${o.id.slice(0, 14)}…` : (o.id ?? "—")}
                        </Link>
                        <p className="text-[11px] text-white/35">{o.status}</p>
                      </td>
                      <td className="px-4 py-2.5 text-white/60">{o.storeName}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-emerald-200/90">
                        {o.totalAmount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <div className="glass-panel rounded-2xl p-6">
            <AdminSectionHeader
              variant="standalone"
              className="mb-6"
              icon={Banknote}
              title="Manual refund"
              iconWrapperClassName="border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              description={
                <>
                  <code className="text-violet-200/95">POST /admin/governance/refunds</code>
                  {" "}
                  — verify order state and escrow with Disputes before posting.
                </>
              }
            />
            {!canProcessRefunds ? (
              <p className="mt-4 text-[14px] text-amber-200/85">
                Your session cannot post refunds — staff role required.
              </p>
            ) : (
              <>
                <label className="mt-6 block text-[13px] text-white/55">Order id</label>
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="glass-input mt-1 h-11 w-full font-mono text-[14px]"
                  placeholder="ord_…"
                />
                <label className="mt-4 block text-[13px] text-white/55">Amount NPR</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                />
                <label className="mt-4 block text-[13px] text-white/55">
                  Reason / ticket reference (audit)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="glass-input mt-1 w-full resize-none text-[14px]"
                />
                <button
                  type="button"
                  disabled={
                    refundM.isPending || !canProcessRefunds || !orderId || !amount || reason.length < 4
                  }
                  onClick={handleRefundClick}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-[14px] font-semibold text-white disabled:opacity-35"
                >
                  Review & submit refund
                </button>
              </>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <AdminSectionHeader
              variant="standalone"
              className="mb-5"
              icon={RefreshCw}
              title="Generate seller settlement batch"
              iconWrapperClassName="border-sky-500/25 bg-sky-500/10 text-sky-200"
              description="Rolls up payouts for one shop inside a ledger period boundary."
            />
            {!canGenerateSettlements ? (
              <p className="mt-4 text-[14px] text-amber-200/85">Staff credentials required.</p>
            ) : (
              <>
                <label className="mt-5 block text-[13px] text-white/55">Store</label>
                <select
                  value={settleStoreId}
                  onChange={(e) => setSettleStoreId(e.target.value)}
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                >
                  <option value="">Select shop…</option>
                  {(storesQ.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[13px] text-white/55">Period start</label>
                    <input
                      type="datetime-local"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="glass-input mt-1 h-11 w-full text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] text-white/55">Period end</label>
                    <input
                      type="datetime-local"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="glass-input mt-1 h-11 w-full text-[14px]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={settleGenM.isPending}
                  onClick={handleSettlePrep}
                  className="mt-6 w-full rounded-xl border border-sky-500/40 bg-sky-500/15 py-3 text-[14px] font-semibold text-sky-100 disabled:opacity-35"
                >
                  Generate settlement
                </button>
              </>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <AdminSectionHeader
              variant="standalone"
              className="mb-5"
              icon={AlertTriangle}
              title="Execute payout reference"
              iconWrapperClassName="border-amber-500/30 bg-amber-500/12 text-amber-200"
              description="Marks a settlement as paid with bank or PSP reference — restricted on this console."
            />
            {!canExecutePayouts ? (
              <p className="mt-4 text-[14px] text-amber-200/85">
                Payout confirmation is Super Admin–only here to reduce duplicate transfers.
              </p>
            ) : (
              <>
                <label className="mt-5 block text-[13px] text-white/55">
                  Settlement id
                </label>
                <input
                  value={payoutSettlementId}
                  onChange={(e) => setPayoutSettlementId(e.target.value)}
                  className="glass-input mt-1 h-11 w-full font-mono text-[14px]"
                />
                <label className="mt-4 block text-[13px] text-white/55">
                  Transaction reference
                </label>
                <input
                  value={payoutTxnRef}
                  onChange={(e) => setPayoutTxnRef(e.target.value)}
                  className="glass-input mt-1 h-11 w-full text-[14px]"
                  placeholder="UTR / gateway ref"
                />
                <button
                  type="button"
                  disabled={payoutM.isPending}
                  onClick={handlePayoutPrep}
                  className="mt-6 w-full rounded-xl border border-amber-500/40 bg-amber-500/15 py-3 text-[14px] font-semibold text-amber-100 disabled:opacity-35"
                >
                  Record payout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <AdminSectionHeader
            variant="standalone"
            title="Payment webhooks"
            description="SkyPay and aggregator IPN events (idempotent processing)."
          />
          <div className="mt-4 max-h-64 overflow-y-auto text-[13px]">
            {(webhooksQ.data?.items ?? []).length === 0 ? (
              <p className="text-white/50">No webhook events yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/45">
                    <th className="pb-2 pr-2">Provider</th>
                    <th className="pb-2 pr-2">Status</th>
                    <th className="pb-2">Order / ref</th>
                  </tr>
                </thead>
                <tbody>
                  {(webhooksQ.data?.items ?? []).map((w: WebhookEventRow) => (
                    <tr key={w.id} className="border-t border-white/10 text-white/80">
                      <td className="py-2 pr-2">{w.provider}</td>
                      <td className="py-2 pr-2">{w.status}</td>
                      <td className="py-2 font-mono text-[12px]">{w.orderId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <AdminSectionHeader
            variant="standalone"
            title="COD collections"
            description="Rider-collected cash matched against orders."
          />
          <div className="mt-4 max-h-64 overflow-y-auto text-[13px]">
            {(codQ.data?.items ?? []).length === 0 ? (
              <p className="text-white/50">No COD records yet — created when riders mark COD collected.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-white/45">
                    <th className="pb-2 pr-2">Order</th>
                    <th className="pb-2 pr-2">Status</th>
                    <th className="pb-2">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {(codQ.data?.items ?? []).map((c: CodRecordRow) => (
                    <tr key={c.id} className="border-t border-white/10 text-white/80">
                      <td className="py-2 pr-2 font-mono text-[12px]">{c.orderId.slice(0, 12)}…</td>
                      <td className="py-2 pr-2">{c.status}</td>
                      <td className="py-2">Rs {c.collectedAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={refundDialogOpen}
        title="Submit manual refund?"
        description={
          <>
            Order <span className="font-mono text-white">{orderId.trim()}</span> for{" "}
            <span className="text-emerald-200">Rs. {amount.trim()}</span>. Ensure disputes and COD
            state are reconciled externally.
          </>
        }
        confirmLabel="Submit refund intent"
        variant="danger"
        loading={refundM.isPending}
        onCancel={() => setRefundDialogOpen(false)}
        onConfirm={() => void refundM.mutate()}
      />

      <ConfirmDialog
        open={settleDialogOpen}
        title="Generate settlement batch?"
        description={
          <>
            Queue settlement for shop{" "}
            <span className="text-white">
              {(storesQ.data ?? []).find((s) => s.id === settleStoreId)?.name ?? settleStoreId}
            </span>{" "}
            from <span className="text-white">{periodStart}</span> to{" "}
            <span className="text-white">{periodEnd}</span>.
          </>
        }
        confirmLabel="Run generator"
        loading={settleGenM.isPending}
        onCancel={() => setSettleDialogOpen(false)}
        onConfirm={() => void settleGenM.mutate()}
      />

      <ConfirmDialog
        open={payoutDialogOpen}
        title="Record payout against settlement?"
        description={
          <>
            Settlement{" "}
            <span className="font-mono text-white">{payoutSettlementId.trim()}</span> with reference{" "}
            <span className="font-mono text-white">{payoutTxnRef.trim()}</span>. This should match a
            real treasury transfer only.
          </>
        }
        confirmLabel="Confirm payout"
        variant="danger"
        loading={payoutM.isPending}
        onCancel={() => setPayoutDialogOpen(false)}
        onConfirm={() => void payoutM.mutate()}
      />
    </>
  );
}
