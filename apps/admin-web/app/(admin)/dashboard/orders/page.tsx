"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHero } from "@/components/admin/PageHero";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminOrderDetailPanel } from "@/components/orders/AdminOrderDetailPanel";
import { fetchAdminOrders, type AdminOrderRow } from "@/lib/api";
import { downloadCsv } from "@/lib/csv-download";
import { orderFulfillmentLabel, orderFulfillmentTone } from "@/lib/fulfillment-labels";
import { useToast } from "@/lib/toast";

const STATUSES = [
  "",
  "PLACED",
  "ACCEPTED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

const STATUS_PRESETS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Packed", value: "PACKED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function OrdersPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const qFromUrl = sp.get("q") ?? "";
  const statusFromUrl = sp.get("status") ?? "";
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [pendingQ, setPendingQ] = useState("");
  const [q, setQ] = useState("");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  useEffect(() => {
    const v = qFromUrl.trim();
    setPendingQ(v);
    setQ(v);
    setPage(1);
  }, [qFromUrl]);

  useEffect(() => {
    const allowed = new Set(STATUSES);
    const next = statusFromUrl.trim();
    if (next && !allowed.has(next as (typeof STATUSES)[number])) {
      setStatus("");
      return;
    }
    setStatus(next);
    setPage(1);
  }, [statusFromUrl]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-orders", page, status, q],
    queryFn: () =>
      fetchAdminOrders({
        page,
        limit: 20,
        status: status || undefined,
        q: q || undefined,
      }),
  });

  const items = data?.items ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.limit ?? 20))
  );

  const syncOrdersUrl = (next: {
    q?: string;
    status?: string;
    resetPage?: boolean;
  }) => {
    const qs = new URLSearchParams(sp.toString());
    const qVal = next.q !== undefined ? next.q.trim() : q.trim();
    if (qVal) qs.set("q", qVal);
    else qs.delete("q");

    const st = next.status !== undefined ? next.status : status;
    if (st) qs.set("status", st);
    else qs.delete("status");

    const serialized = qs.toString();
    router.replace(serialized ? `/dashboard/orders?${serialized}` : "/dashboard/orders");
    if (next.resetPage) setPage(1);
  };

  const runSearch = () => {
    const t = pendingQ.trim();
    setQ(t);
    syncOrdersUrl({ q: t, resetPage: true });
  };

  const handleStatusSelect = (value: string) => {
    setStatus(value);
    syncOrdersUrl({ status: value, resetPage: true });
  };

  const handlePreset = (value: string) => {
    setStatus(value);
    syncOrdersUrl({ status: value, resetPage: true });
  };

  const handleExportPage = () => {
    if (!items.length) return;
    downloadCsv(
      `orders-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "id",
        "storeName",
        "customerName",
        "customerPhone",
        "totalAmount",
        "paymentMethod",
        "paymentStatus",
        "fulfillmentType",
        "status",
        "createdAt",
      ],
      items.map((o: AdminOrderRow) => ({
        id: o.id,
        storeName: o.storeName,
        customerName: o.customerName ?? "",
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        fulfillmentType: o.fulfillmentType,
        status: o.status,
        createdAt: o.createdAt,
      }))
    );
    toast.success("Exported current page to CSV");
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Orders" }]}
        icon={ShoppingCart}
        title="Orders pipeline"
        description="Cross-shop order monitor — search by ID, customer phone, buyer name, or storefront."
      />

      <div className="glass-panel mb-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" />
            <input
              type="search"
              value={pendingQ}
              onChange={(e) => setPendingQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Order ID, phone, name, shop…"
              className="glass-input h-11 w-full pl-11 text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Search
          </button>
          <label className="flex items-center gap-2 text-[13px] text-white/50">
            Status
            <select
              value={status}
              onChange={(e) => handleStatusSelect(e.target.value)}
              className="glass-input h-11 rounded-lg px-3 text-[14px]"
            >
              {STATUSES.map((s) => (
                <option key={s || "all"} value={s}>
                  {s || "All statuses"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!items.length}
            onClick={handleExportPage}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/[0.07] disabled:opacity-35"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export page CSV
          </button>
          {isFetching && !isLoading ? (
            <span className="text-[12px] text-white/35">Refreshing…</span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition",
                status === p.value
                  ? "bg-violet-600/45 text-white"
                  : "bg-white/[0.05] text-white/55 hover:bg-white/[0.08] hover:text-white/80"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[14px] text-rose-100">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="overflow-x-auto overflow-admin-scroll">
          <table className="w-full min-w-[960px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wider text-white/40">
                <th className="px-5 py-3.5">Order</th>
                <th className="px-5 py-3.5">Store</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Fulfillment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Placed</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton cols={8} rows={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/45">
                    {q ? "No orders match this search." : "No orders yet."}
                  </td>
                </tr>
              ) : (
                items.map((o: AdminOrderRow) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.03]"
                    onClick={() => setDetailOrderId(o.id)}
                  >
                    <td className="px-5 py-3.5 font-mono text-[13px] text-sky-200">{o.id}</td>
                    <td className="px-5 py-3.5 text-white/75">{o.storeName}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-white/85">{o.customerName || "—"}</p>
                      <p className="text-[12px] text-white/40">{o.customerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-200">
                      Rs. {o.totalAmount}
                    </td>
                    <td className="px-5 py-3.5 text-white/55">
                      {o.paymentMethod} · {o.paymentStatus}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                          orderFulfillmentTone(o.fulfillmentType).className
                        )}
                      >
                        {orderFulfillmentLabel(o.fulfillmentType)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] font-bold text-violet-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-white/45">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 text-[13px] text-white/45">
          <span>
            Total {data?.total ?? 0} · Page {page}/{totalPages}
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

      <AdminOrderDetailPanel
        orderId={detailOrderId}
        onClose={() => setDetailOrderId(null)}
      />
    </>
  );
}
