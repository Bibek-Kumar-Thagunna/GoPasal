"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, LineChart, PieChart, Table2 } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import {
  fetchAdminOrderStatusCounts,
  fetchAdminRevenueChart,
  fetchAdminTopProducts,
} from "@/lib/api";
import { downloadCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast";

export default function DashboardAnalyticsAliasPage() {
  const toast = useToast();
  const top = useQuery({
    queryKey: ["analytics-top"],
    queryFn: fetchAdminTopProducts,
  });
  const funnel = useQuery({
    queryKey: ["analytics-funnel"],
    queryFn: fetchAdminOrderStatusCounts,
  });
  const revenueRaw = useQuery({
    queryKey: ["analytics-revenue-raw"],
    queryFn: fetchAdminRevenueChart,
  });

  const revenueRows = useMemo(
    () => (Array.isArray(revenueRaw.data) ? revenueRaw.data : []),
    [revenueRaw.data]
  );

  const revenueHeaders = useMemo(() => {
    const keys = new Set<string>();
    for (const row of revenueRows) {
      if (row && typeof row === "object") {
        for (const k of Object.keys(row as Record<string, unknown>)) keys.add(k);
      }
    }
    return Array.from(keys).sort();
  }, [revenueRows]);

  const revenueTableRows = useMemo(
    () =>
      revenueRows.map((row) => {
        const o = row as Record<string, unknown>;
        const out: Record<string, string> = {};
        for (const h of revenueHeaders) {
          const v = o[h];
          out[h] = v === null || v === undefined ? "" : String(v);
        }
        return out;
      }),
    [revenueHeaders, revenueRows]
  );

  const exportTopProducts = () => {
    const data = top.data ?? [];
    if (!data.length) return;
    downloadCsv(
      `top-products-${new Date().toISOString().slice(0, 10)}.csv`,
      ["productId", "productName", "totalSold", "revenue"],
      data.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        totalSold: p.totalSold,
        revenue: p.revenue,
      }))
    );
    toast.success("Exported top products CSV");
  };

  const exportFunnel = () => {
    const b = funnel.data?.breakdown ?? [];
    if (!b.length) return;
    downloadCsv(
      `order-funnel-${new Date().toISOString().slice(0, 10)}.csv`,
      ["status", "count", "percent"],
      b.map((x) => ({ status: x.status, count: x.count, percent: x.percent }))
    );
    toast.success("Exported funnel CSV");
  };

  const exportRevenueSeries = () => {
    if (!revenueHeaders.length || !revenueTableRows.length) return;
    downloadCsv(
      `revenue-series-${new Date().toISOString().slice(0, 10)}.csv`,
      revenueHeaders,
      revenueTableRows.map((r) => ({ ...r }))
    );
    toast.success("Exported revenue rows CSV");
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Analytics" }]}
        icon={BarChart3}
        title="Analytics workspace"
        description="Tabular SKU momentum, funnel mix, and raw revenue intervals — spreadsheet-ready exports for founders and BD."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-5">
          <AdminSectionHeader
            variant="standalone"
            className="mb-4 flex-wrap"
            icon={Table2}
            title="Top movers (qty)"
            description="Fastest-selling SKUs by fulfilled units — reconcile with catalogue promos."
            actions={
              <button
              type="button"
              disabled={!top.data?.length}
              onClick={exportTopProducts}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] font-medium text-white/70 hover:bg-white/[0.05] disabled:opacity-30"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            }
          />
          <div className="mt-1 space-y-2 text-[14px]">
            {top.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.05]" />
                ))}
              </div>
            ) : (top.data ?? []).length === 0 ? (
              <p className="text-white/45">No sales yet.</p>
            ) : (
              top.data!.map((p) => (
                <div
                  key={p.productId}
                  className="flex justify-between border-b border-white/[0.04] pb-2"
                >
                  <span className="text-white/80">{p.productName}</span>
                  <span className="font-mono text-emerald-200">{p.totalSold} units</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <AdminSectionHeader
            variant="standalone"
            className="mb-4 flex-wrap"
            icon={PieChart}
            title="Order funnel"
            description="Status mix across the live pipeline — percentages are share of all indexed orders."
            actions={
              <button
              type="button"
              disabled={!(funnel.data?.breakdown ?? []).length}
              onClick={exportFunnel}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] font-medium text-white/70 hover:bg-white/[0.05] disabled:opacity-30"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            }
          />
          <div className="space-y-2 text-[14px]">
            {funnel.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-7 animate-pulse rounded-lg bg-white/[0.05]" />
                ))}
              </div>
            ) : (
              (funnel.data?.breakdown ?? []).map((b) => (
                <div key={b.status} className="flex justify-between">
                  <span className="text-white/65">{b.status}</span>
                  <span>
                    {b.count} <span className="text-white/35">({b.percent}%)</span>
                  </span>
                </div>
              ))
            )}
            {!(funnel.data?.breakdown ?? []).length && !funnel.isLoading ? (
              <p className="text-white/45">No orders indexed.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <AdminSectionHeader
          variant="standalone"
          className="mb-4 flex-wrap"
          icon={LineChart}
          title="Revenue series"
          description="Normalized SQL rows — visualize trends on the Overview dashboard."
          actions={
            <button
            type="button"
            disabled={!revenueHeaders.length}
            onClick={exportRevenueSeries}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] font-medium text-white/70 hover:bg-white/[0.05] disabled:opacity-30"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          }
        />
        <div className="max-h-80 overflow-auto overflow-admin-scroll rounded-xl border border-white/[0.06]">
          {revenueRaw.isLoading ? (
            <p className="p-4 text-[14px] text-white/45">Loading series…</p>
          ) : revenueHeaders.length === 0 ? (
            <p className="p-4 text-[14px] text-white/45">No revenue rows.</p>
          ) : (
            <table className="w-full min-w-[480px] text-left text-[12px] text-white/65">
              <thead className="sticky top-0 bg-[#0d1024] text-[11px] uppercase tracking-wider text-white/35">
                <tr>
                  {revenueHeaders.map((h) => (
                    <th key={h} className="border-b border-white/[0.06] px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revenueTableRows.map((r, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {revenueHeaders.map((h) => (
                      <td key={h} className="px-3 py-1.5 font-mono">
                        {r[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
