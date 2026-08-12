"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bike,
  IndianRupee,
  LayoutDashboard,
  Package,
  PieChart as PieChartIcon,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  fetchAdminCatalogOverview,
  fetchAdminDashboardStats,
  fetchAdminOrderStatusCounts,
  fetchAdminRecentOrders,
  fetchAdminRevenueChart,
  fetchAdminTopProducts,
} from "@/lib/api";
import { NeedsAttentionPanel } from "@/components/admin/NeedsAttentionPanel";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

function KPICard(props: {
  label: string;
  value: string;
  delta?: string;
  up?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  const { label, value, delta, up, icon: Icon, accent } = props;
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05]"
          style={{ boxShadow: `inset 0 0 0 1px ${accent}33` }}
        >
          <div style={{ color: accent }}>
            <Icon className="h-[22px] w-[22px]" />
          </div>
        </div>
        {delta !== undefined ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-semibold ${
              up
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta}
          </span>
        ) : (
          <span className="text-[12px] text-white/30">live</span>
        )}
      </div>
      <p className="admin-heading-micro">{label}</p>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#22c55e",
  PLACED: "#6366f1",
  ACCEPTED: "#38bdf8",
  CONFIRMED: "#a78bfa",
  PACKED: "#f97316",
  OUT_FOR_DELIVERY: "#eab308",
  SHIPPED: "#14b8a6",
  CANCELLED: "#71717a",
  RETURN_INITIATED: "#f472b6",
};

export default function DashboardPage() {
  const router = useRouter();
  const stats = useQuery({
    queryKey: ["dash-stats"],
    queryFn: fetchAdminDashboardStats,
  });

  const statusQ = useQuery({
    queryKey: ["dash-order-status"],
    queryFn: fetchAdminOrderStatusCounts,
  });

  const recent = useQuery({
    queryKey: ["dash-recent"],
    queryFn: () => fetchAdminRecentOrders(10),
  });

  const catalog = useQuery({
    queryKey: ["dash-catalog"],
    queryFn: fetchAdminCatalogOverview,
  });

  const chartRows = useQuery({
    queryKey: ["dash-revenue"],
    queryFn: fetchAdminRevenueChart,
  });

  const topProducts = useQuery({
    queryKey: ["dash-top-products"],
    queryFn: fetchAdminTopProducts,
  });

  const ruFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

  const pieRows = useMemo(() => {
    const b = statusQ.data?.breakdown ?? [];
    return b.map((x) => ({
      name: x.status.replace(/_/g, " "),
      value: x.percent,
      count: x.count,
      raw: x.status,
    }));
  }, [statusQ.data]);

  const revenueSeries = useMemo(() => {
    const raw = chartRows.data ?? [];
    return raw.map((r, i) => {
      const row = r as Record<string, unknown>;
      const d = String(row.date ?? row.DATE ?? "");
      const rev = Number(row.revenue ?? row.REVENUE ?? 0);
      return {
        d: d ? d.slice(5) : `${i + 1}`,
        revenue: rev,
      };
    });
  }, [chartRows.data]);

  const totalRev = stats.data?.totalRevenue ?? 0;
  const totalOrders = stats.data?.totalOrders ?? 0;
  const activeUsers = stats.data?.totalUsers ?? 0;
  const sellers = stats.data?.activeStores ?? 0;
  const products = catalog.data?.activeProducts ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <p className="admin-heading-micro">Command center</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.07] to-white/[0.02] text-sky-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="admin-heading-page">Overview</h1>
          </div>
          <p className="admin-copy-lead mt-3 max-w-xl">
            Live aggregates from PostgreSQL — KPIs, revenue mix, and queue health in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/promotions"
            className="rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-2 text-[13px] font-semibold text-violet-100"
          >
            New coupon
          </Link>
          <Link
            href="/dashboard/sellers"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/60"
          >
            Review shops
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard
          label="Total revenue (NPR)"
          value={`Rs. ${ruFmt.format(totalRev)}`}
          icon={IndianRupee}
          accent="#38bdf8"
        />
        <KPICard
          label="Orders"
          value={ruFmt.format(totalOrders)}
          icon={ShoppingBag}
          accent="#a78bfa"
        />
        <KPICard
          label="Users"
          value={ruFmt.format(activeUsers)}
          icon={Users}
          accent="#34d399"
        />
        <KPICard
          label="Active shops"
          value={ruFmt.format(sellers)}
          icon={Store}
          accent="#fb923c"
        />
        <KPICard
          label="Active SKUs"
          value={ruFmt.format(products)}
          icon={Package}
          accent="#ec4899"
        />
      </div>

      <NeedsAttentionPanel />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
          <AdminSectionHeader
            variant="standalone"
            className="mb-4"
            icon={TrendingUp}
            title="Revenue (30d)"
            description="Daily gross NPR from order lines in the trailing window."
          />
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gpFill2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="d"
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.25)"
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(12,14,35,0.95)",
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#gpFill2)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5">
          <AdminSectionHeader
            variant="standalone"
            className="mb-3"
            icon={PieChartIcon}
            title="Orders by status"
            description="Share of active pipeline — use Orders for filters and exports."
          />
          <div className="h-[210px]">
            {pieRows.length === 0 ? (
              <p className="pt-16 text-center text-[14px] text-white/40">Place first orders to chart mix.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieRows}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieRows.map((e) => (
                      <Cell
                        key={e.raw}
                        fill={STATUS_COLORS[e.raw] ?? "#52525b"}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, _n, ctx) => [
                      `${v}% · ${(ctx?.payload as { count?: number })?.count ?? 0} orders`,
                      "Share",
                    ]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(12,14,35,0.95)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <AdminSectionHeader
          variant="standalone"
          className="mb-4"
          icon={Package}
          title="Top SKUs (units)"
          description="Best movers by fulfilled quantity — informs promos and replenishment."
        />
        <div className="h-[240px]">
          {(topProducts.data ?? []).length === 0 ? (
            <p className="pt-20 text-center text-white/40">No order lines yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={(topProducts.data ?? []).map((p) => ({
                  name: p.productName.slice(0, 18),
                  sold: p.totalSold,
                }))}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.25)" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(12,14,35,0.95)",
                  }}
                />
                <Bar dataKey="sold" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <AdminSectionHeader
          variant="panel"
          icon={ShoppingBag}
          title="Recent orders"
          description="Latest checkout activity — open the pipeline for deep search and CSV."
          actions={
            <Link href="/dashboard/orders" className="text-[14px] font-medium text-sky-300 hover:text-sky-200">
              View all
            </Link>
          }
        />
        <div className="overflow-x-auto overflow-admin-scroll">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wider text-white/40">
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Shop</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-white/45">
                    No orders yet — happy path when you wire customer checkout.
                  </td>
                </tr>
              ) : (
                (recent.data ?? []).map((o) => (
                  <tr
                    key={o.id}
                    className="cursor-pointer border-b border-white/[0.04] text-white/80 transition hover:bg-white/[0.03]"
                    onClick={() =>
                      router.push(`/dashboard/orders?q=${encodeURIComponent(o.id)}`)
                    }
                  >
                    <td className="px-5 py-3 font-medium text-white">{o.customerName || o.customerPhone}</td>
                    <td className="px-5 py-3 font-mono text-[13px] text-sky-300/80">{o.id}</td>
                    <td className="px-5 py-3 text-white/55">{o.storeName}</td>
                    <td className="px-5 py-3 font-semibold text-emerald-200/90">Rs. {o.totalAmount}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full bg-indigo-500/15 px-2.5 py-1 text-[12px] font-semibold text-indigo-200">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-4">
          <p className="admin-heading-micro">Shortcuts</p>
          <p className="admin-copy-muted mt-1 max-w-xl">
            Jump to the desks you touch most often — mirrors left navigation priorities.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          {(
            [
              { href: "/dashboard/users", label: "Users", color: "from-sky-500 to-blue-600" },
              { href: "/dashboard/sellers", label: "Shops", color: "from-emerald-500 to-teal-600" },
              { href: "/dashboard/products", label: "Catalog", color: "from-orange-500 to-amber-500" },
              {
                href: "/dashboard/delivery",
                label: "Delivery",
                color: "from-teal-500 to-cyan-600",
                icon: Bike,
              },
              { href: "/dashboard/promotions", label: "Coupons", color: "from-violet-500 to-purple-600" },
              { href: "/dashboard/tiers", label: "Tiers", color: "from-fuchsia-500 to-pink-600" },
              { href: "/dashboard/disputes", label: "Disputes", color: "from-rose-500 to-red-600" },
            ] as const
          ).map((a) => {
            const Icon = "icon" in a ? a.icon : null;
            return (
            <Link
              key={a.href}
              href={a.href}
              className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-4 text-left font-display text-sm font-semibold text-white shadow-lg ${a.color} shadow-black/30 transition hover:brightness-110`}
            >
              {Icon ? (
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              ) : null}
              {a.label}
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
