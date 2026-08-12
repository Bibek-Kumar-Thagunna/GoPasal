"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BarChart3, Download, FileBarChart, Sparkles } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import {
  fetchAdminCatalogOverview,
  fetchAdminDashboardStats,
  fetchAdminOrderStatusCounts,
  fetchAdminOrders,
  fetchAdminRevenueChart,
  fetchAdminTopProducts,
} from "@/lib/api";
import { downloadCsv } from "@/lib/csv-download";
import { downloadJson } from "@/lib/download-json";
import { useToast } from "@/lib/toast";

export default function ReportsPage() {
  const toast = useToast();
  const [bundleLoading, setBundleLoading] = useState(false);

  const snapshotM = useMutation({
    mutationFn: async () => {
      const [stats, funnel, top, revenue, catalog] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAdminOrderStatusCounts(),
        fetchAdminTopProducts(),
        fetchAdminRevenueChart(),
        fetchAdminCatalogOverview(),
      ]);
      return {
        exportedAt: new Date().toISOString(),
        dashboard: stats,
        orderStatusFunnel: funnel,
        topProductsByUnits: top,
        revenueSeries: Array.isArray(revenue) ? revenue : [],
        catalogOverview: catalog,
      };
    },
    onMutate: () => setBundleLoading(true),
    onSuccess: (data) => {
      downloadJson(
        `gp-admin-snapshot-${new Date().toISOString().slice(0, 10)}.json`,
        data
      );
      toast.success("Executive snapshot downloaded (JSON).");
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setBundleLoading(false),
  });

  const exportOrdersSample = async () => {
    setBundleLoading(true);
    try {
      const first = await fetchAdminOrders({ page: 1, limit: 100 });
      const headers = [
        "id",
        "customerPhone",
        "customerName",
        "storeName",
        "totalAmount",
        "paymentMethod",
        "paymentStatus",
        "status",
        "createdAt",
      ];
      downloadCsv(`orders-sample-page1-${Date.now()}.csv`, headers, first.items.map((o) => ({
        id: o.id,
        customerPhone: o.customerPhone,
        customerName: o.customerName ?? "",
        storeName: o.storeName,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt,
      })));
      toast.success(`Exported ${first.items.length} rows (first page).`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setBundleLoading(false);
    }
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Reports" }]}
        icon={FileBarChart}
        title="Reports & exports"
        description="Operational bundles you can stash in SOC2-friendly storage or Dropbox for finance checkpoints."
      />

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Executive JSON bundle",
            body: "Stats, funnel, top SKUs, revenue rows, catalogue counts in one artefact.",
            icon: Sparkles,
            action: (
              <button
                type="button"
                disabled={bundleLoading || snapshotM.isPending}
                onClick={() => void snapshotM.mutate()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-[14px] font-semibold text-white shadow-lg shadow-violet-900/40 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </button>
            ),
          },
          {
            title: "Orders workbook seed",
            body: "First 100 live orders exactly as Payments / Support sees them.",
            icon: BarChart3,
            action: (
              <button
                type="button"
                disabled={bundleLoading}
                onClick={() => void exportOrdersSample()}
                className="rounded-xl border border-white/14 bg-white/[0.04] px-4 py-2 text-[14px] font-semibold text-white/85 hover:bg-white/[0.08] disabled:opacity-35"
              >
                Export CSV
              </button>
            ),
          },
        ].map((card) => (
          <article
            key={card.title}
            className="glass-panel rounded-2xl border border-white/[0.06] p-6"
          >
            <card.icon className="h-10 w-10 text-sky-200/70" aria-hidden />
            <h2 className="mt-4 admin-heading-section">{card.title}</h2>
            <p className="admin-copy-lead mt-2">{card.body}</p>
            <div className="mt-6">{card.action}</div>
          </article>
        ))}
      </div>

      <div className="glass-panel rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-6">
        <h3 className="admin-heading-section text-emerald-100">
          Operational hygiene
        </h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-[14px] leading-relaxed text-white/65">
          <li>
            For deeper SKU detail use{" "}
            <Link href="/dashboard/analytics" className="text-sky-300 hover:text-sky-200">
              Analytics → CSV buttons
            </Link>
            .
          </li>
          <li>
            Finance reversals funnel through{" "}
            <Link href="/dashboard/payments" className="text-sky-300 hover:text-sky-200">
              Payments
            </Link>{" "}
            +{" "}
            <Link href="/dashboard/disputes" className="text-sky-300 hover:text-sky-200">
              Disputes
            </Link>
            .
          </li>
          <li>Rotate exports monthly; scrub PII before sharing outside core operators.</li>
        </ul>
      </div>
    </>
  );
}
