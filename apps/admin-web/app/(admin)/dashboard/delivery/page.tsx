"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Download,
  LayoutGrid,
  Package,
  Search,
} from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import {
  assignAdminDeliveryTask,
  fetchAdminDeliveryTasks,
  fetchAdminRiders,
  type AdminDeliveryTaskRow,
  type AdminRiderRow,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast";

const TASK_STATUSES = [
  "",
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;

type Desk = "tasks" | "fleet";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function DeliveryPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const sp = useSearchParams();
  const appliedQ = sp.get("q") ?? "";

  const [desk, setDesk] = useState<Desk>("fleet");
  const [pendingQ, setPendingQ] = useState(appliedQ);
  const [taskStatus, setTaskStatus] = useState<string>("");

  useEffect(() => {
    setPendingQ(appliedQ);
  }, [appliedQ]);

  const ridersQ = useQuery({
    queryKey: ["admin-riders", desk],
    queryFn: () => fetchAdminRiders({ limit: 400 }),
    enabled: desk === "fleet" || desk === "tasks",
    staleTime: 45_000,
  });

  const assignM = useMutation({
    mutationFn: ({ taskId, riderId }: { taskId: string; riderId: string }) =>
      assignAdminDeliveryTask(taskId, riderId),
    onSuccess: () => {
      toast.success("Rider assigned.");
      void qc.invalidateQueries({ queryKey: ["admin-delivery-tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tasksQ = useQuery({
    queryKey: ["admin-delivery-tasks", taskStatus, desk],
    queryFn: () =>
      fetchAdminDeliveryTasks({
        limit: 120,
        status: taskStatus || undefined,
      }),
    enabled: desk === "tasks",
    staleTime: 20_000,
  });

  const runSearch = () => {
    const t = pendingQ.trim();
    const qs = new URLSearchParams(sp.toString());
    if (t) qs.set("q", t);
    else qs.delete("q");
    const next = qs.toString();
    router.replace(next ? `/dashboard/delivery?${next}` : "/dashboard/delivery");
  };

  const riderRows = useMemo(() => {
    const all = ridersQ.data ?? [];
    const t = appliedQ.trim().toLowerCase();
    if (!t) return all;
    return all.filter((r: AdminRiderRow) => {
      const blob = [
        r.name,
        r.phone,
        r.vehicleType,
        r.licensePlate,
        r.status,
        r.id,
        r.userId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(t);
    });
  }, [ridersQ.data, appliedQ]);

  const taskRows = useMemo(() => {
    const all = tasksQ.data ?? [];
    const t = appliedQ.trim().toLowerCase();
    if (!t) return all;
    return all.filter((row: AdminDeliveryTaskRow) => {
      const blob = [
        row.orderId,
        row.customerPhone,
        row.customerName,
        row.storeName,
        row.taskId,
        row.riderId,
        row.paymentMethod,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(t);
    });
  }, [tasksQ.data, appliedQ]);

  const handleExportRiders = () => {
    if (!riderRows.length) return;
    downloadCsv(
      `riders-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "id",
        "userId",
        "name",
        "phone",
        "vehicleType",
        "licensePlate",
        "status",
        "walletBalance",
        "tier",
      ],
      riderRows.map((r: AdminRiderRow) => ({
        id: r.id,
        userId: r.userId,
        name: r.name ?? "",
        phone: r.phone,
        vehicleType: r.vehicleType,
        licensePlate: r.licensePlate,
        status: r.status,
        walletBalance: r.walletBalance ?? "",
        tier: r.tier ?? "",
      }))
    );
    toast.success("Exported rider list to CSV");
  };

  const handleExportTasks = () => {
    if (!taskRows.length) return;
    downloadCsv(
      `delivery-tasks-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "taskId",
        "taskStatus",
        "orderId",
        "orderStatus",
        "paymentMethod",
        "storeName",
        "customerPhone",
        "customerName",
        "riderId",
        "codAmount",
        "codCollected",
        "failureReason",
        "taskCreatedAt",
        "pickedUpAt",
        "deliveredAt",
      ],
      taskRows.map((row: AdminDeliveryTaskRow) => ({
        taskId: row.taskId,
        taskStatus: row.taskStatus,
        orderId: row.orderId,
        orderStatus: row.orderStatus,
        paymentMethod: row.paymentMethod,
        storeName: row.storeName,
        customerPhone: row.customerPhone,
        customerName: row.customerName ?? "",
        riderId: row.riderId ?? "",
        codAmount: row.codAmount ?? "",
        codCollected:
          row.codCollected === true ? "yes" : row.codCollected === false ? "no" : "",
        failureReason: row.failureReason ?? "",
        taskCreatedAt: row.taskCreatedAt,
        pickedUpAt: row.pickedUpAt ?? "",
        deliveredAt: row.deliveredAt ?? "",
      }))
    );
    toast.success("Exported delivery tasks to CSV");
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Delivery" }]}
        icon={Bike}
        title="Delivery desk"
        description="Fleet snapshot plus live delivery_tasks with COD context — search syncs from the header (⌘K) or the bar below."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/orders?status=OUT_FOR_DELIVERY"
              className="rounded-full border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-[13px] font-semibold text-amber-100"
            >
              Orders out for delivery
            </Link>
            <Link
              href="/dashboard/disputes"
              className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[13px] font-medium text-white/70"
            >
              Disputes →
            </Link>
          </div>
        }
      />

      <div className="mb-3">
        <p className="admin-heading-micro">Operations</p>
        <p className="admin-copy-muted mt-1 max-w-xl">Switch between rider roster and live delivery tasks. Filters respect the URL query.</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-2">
        <button
          type="button"
          onClick={() => setDesk("fleet")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition",
            desk === "fleet"
              ? "bg-white/[0.12] text-white shadow-inner shadow-black/40"
              : "text-white/45 hover:bg-white/[0.05] hover:text-white/75"
          )}
        >
          <Bike className="h-4 w-4" aria-hidden />
          Rider fleet
        </button>
        <button
          type="button"
          onClick={() => setDesk("tasks")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition",
            desk === "tasks"
              ? "bg-white/[0.12] text-white shadow-inner shadow-black/40"
              : "text-white/45 hover:bg-white/[0.05] hover:text-white/75"
          )}
        >
          <Package className="h-4 w-4" aria-hidden />
          Task queue
        </button>
      </div>

      <div className="glass-panel mb-6 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1 max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="search"
              value={pendingQ}
              onChange={(e) => setPendingQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder={
                desk === "fleet"
                  ? "Rider phone, plate, wallet status…"
                  : "Order id, shopper phone, COD lane…"
              }
              id="delivery-desk-search"
              className="glass-input h-11 w-full pl-11 text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Apply filter
          </button>

          {desk === "tasks" ? (
            <label className="flex items-center gap-2 text-[13px] text-white/50">
              Task lifecycle
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="glass-input h-11 rounded-lg px-3 text-[14px]"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s || "all"} value={s}>
                    {s || "All states"}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {desk === "fleet" ? (
            <button
              type="button"
              disabled={!riderRows.length}
              onClick={handleExportRiders}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/[0.07] disabled:opacity-35"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </button>
          ) : (
            <button
              type="button"
              disabled={!taskRows.length}
              onClick={handleExportTasks}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/[0.07] disabled:opacity-35"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </button>
          )}
          <span className="text-[13px] text-white/38">
            {appliedQ.trim() ? `URL filter: “${appliedQ.trim()}”` : "Showing full feed"}
          </span>
        </div>
      </div>

      {desk === "fleet" ? (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] uppercase text-white/40">
                <th className="px-5 py-3.5">Rider</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Vehicle</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {ridersQ.isLoading ? (
                <AdminTableSkeleton cols={5} rows={9} />
              ) : ridersQ.error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-rose-200">
                    {(ridersQ.error as Error).message}
                  </td>
                </tr>
              ) : riderRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/45">
                    {appliedQ.trim()
                      ? "No riders match this filter."
                      : "No riders onboarded yet."}
                  </td>
                </tr>
              ) : (
                riderRows.map((r: AdminRiderRow) => (
                  <tr key={r.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-3.5 text-white">
                      {r.name || "Partner"}
                      <p className="font-mono text-[11px] text-white/30">{r.id}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-white/65">{r.phone}</td>
                    <td className="px-5 py-3.5 text-white/60">
                      {r.vehicleType} · {r.licensePlate}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] font-bold text-sky-200">{r.status}</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-200">
                      Rs. {r.walletBalance ?? "0"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
            <LayoutGrid className="h-4 w-4 text-white/35" aria-hidden />
            <p className="text-[13px] text-white/50">
              Linked to marketplace orders · COD riders should reconcile with Payments after POD.
            </p>
          </div>
          <div className="overflow-x-auto overflow-admin-scroll">
            <table className="w-full min-w-[1080px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wider text-white/40">
                  <th className="px-5 py-3.5">Task</th>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">Shop / buyer</th>
                  <th className="px-5 py-3.5">Pay</th>
                  <th className="px-5 py-3.5">COD</th>
                  <th className="px-5 py-3.5">State</th>
                  <th className="px-5 py-3.5">Timeline</th>
                  <th className="px-5 py-3.5">Assign</th>
                </tr>
              </thead>
              <tbody>
                {tasksQ.isLoading ? (
                  <AdminTableSkeleton cols={8} rows={8} />
                ) : tasksQ.error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-rose-200">
                      {(tasksQ.error as Error).message}
                    </td>
                  </tr>
                ) : taskRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-white/45">
                      {appliedQ.trim() || taskStatus
                        ? "No tasks match this filter."
                        : "No delivery tasks recorded."}
                    </td>
                  </tr>
                ) : (
                  taskRows.map((row: AdminDeliveryTaskRow) => (
                    <tr key={row.taskId} className="border-b border-white/[0.04]">
                      <td className="px-5 py-3.5 font-mono text-[12px] text-white/55">{row.taskId}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/orders?q=${encodeURIComponent(row.orderId)}`}
                          className="font-mono text-[13px] text-sky-300 hover:text-sky-200"
                        >
                          {row.orderId.length > 22
                            ? `${row.orderId.slice(0, 22)}…`
                            : row.orderId}
                        </Link>
                        <p className="text-[11px] text-white/35">{row.orderStatus}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-white/85">{row.storeName}</p>
                        <p className="text-[12px] text-white/40">
                          {row.customerPhone} · {row.customerName || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-white/60">{row.paymentMethod}</td>
                      <td className="px-5 py-3.5">
                        {row.paymentMethod === "COD" ? (
                          <div className="text-[13px]">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                row.codCollected === true
                                  ? "bg-emerald-500/20 text-emerald-200"
                                  : "bg-amber-500/20 text-amber-100"
                              )}
                            >
                              {row.codCollected === true
                                ? "Collected"
                                : row.codCollected === false
                                  ? "Outstanding"
                                  : "Unset"}
                            </span>
                            {row.codAmount ? (
                              <p className="mt-1 font-mono text-white/65">Rs. {row.codAmount}</p>
                            ) : (
                              <p className="mt-1 text-white/35 text-[12px]">Amount n/a</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-white/35">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-bold text-violet-200">
                          {row.taskStatus}
                        </span>
                        {row.failureReason ? (
                          <p className="mt-1 text-[12px] text-rose-200/85">{row.failureReason}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] leading-snug text-white/45">
                        <span className="text-white/55">Pick</span> {fmt(row.pickedUpAt)}
                        <br />
                        <span className="text-white/55">Drop</span> {fmt(row.deliveredAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        {row.taskStatus === "PENDING" || row.taskStatus === "ASSIGNED" ? (
                          <select
                            className="glass-input h-9 max-w-[160px] rounded-lg px-2 text-[12px]"
                            defaultValue={row.riderId ?? ""}
                            disabled={assignM.isPending}
                            onChange={(e) => {
                              const riderId = e.target.value;
                              if (!riderId) return;
                              assignM.mutate({ taskId: row.taskId, riderId });
                            }}
                          >
                            <option value="">Assign rider…</option>
                            {(ridersQ.data ?? []).map((r: AdminRiderRow) => (
                              <option key={r.id} value={r.id}>
                                {r.name || r.phone}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[12px] text-white/35">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
