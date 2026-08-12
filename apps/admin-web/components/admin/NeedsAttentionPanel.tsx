"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CircleAlert,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import {
  fetchAdminCustomerSubscriptions,
  fetchAdminDisputes,
  fetchAdminReviewsPage,
  fetchAdminStoreMarketingSubscriptions,
} from "@/lib/api";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

export function NeedsAttentionPanel() {
  const openDisputes = useQuery({
    queryKey: ["dash-attention-disputes"],
    queryFn: () => fetchAdminDisputes("OPEN"),
    staleTime: 20_000,
  });

  const pendingReviews = useQuery({
    queryKey: ["dash-attention-reviews"],
    queryFn: () => fetchAdminReviewsPage({ page: 1, filter: "pending" }),
    staleTime: 20_000,
  });

  const memberships = useQuery({
    queryKey: ["dash-attention-memberships"],
    queryFn: async () => {
      const [c, s] = await Promise.all([
        fetchAdminCustomerSubscriptions(),
        fetchAdminStoreMarketingSubscriptions(),
      ]);
      const now = Date.now();
      type Sub = { endAt?: string; status?: string };
      type Row = { subscription?: Sub };
      return [...(Array.isArray(c) ? c : []), ...(Array.isArray(s) ? s : [])].filter((row) => {
        const sub = (row as Row)?.subscription;
        if (!sub?.endAt || sub.status !== "ACTIVE") return false;
        const end = new Date(sub.endAt).getTime();
        return end > now && end - now < 7 * 24 * 60 * 60 * 1000;
      }).length;
    },
    staleTime: 45_000,
  });

  const disputesN = openDisputes.data?.length ?? 0;
  const reviewsN = pendingReviews.data?.length ?? 0;
  const subsN = memberships.data ?? 0;
  const urgent = disputesN + reviewsN + subsN;

  const rows = [
    {
      href: "/dashboard/disputes",
      icon: CircleAlert,
      label: "Open disputes",
      value: disputesN,
      tone: disputesN ? "rose" : "muted",
      loading: openDisputes.isLoading,
    },
    {
      href: "/dashboard/reviews",
      icon: MessageSquareText,
      label: "Reviews to moderate",
      value: reviewsN,
      tone: reviewsN ? "amber" : "muted",
      loading: pendingReviews.isLoading,
    },
    {
      href: "/dashboard/tiers",
      icon: Sparkles,
      label: "Memberships expiring (≤7d)",
      value: subsN,
      tone: subsN ? "violet" : "muted",
      loading: memberships.isLoading,
    },
  ] as const;

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
        <AdminSectionHeader
          variant="standalone"
          title="Needs attention"
          description="Same signals as the header inbox — pull your next operational actions here."
          icon={Bell}
          iconWrapperClassName="border-amber-500/30 bg-amber-500/10 text-amber-200"
        />
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-bold ${
            urgent > 0
              ? "bg-rose-500/25 text-rose-100 ring-1 ring-rose-500/40"
              : "bg-emerald-500/15 text-emerald-200/90"
          }`}
        >
          {urgent > 0 ? `${urgent} open items` : "Queue clear"}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map(({ href, icon: Icon, label, value, tone, loading }) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex items-center gap-4 rounded-xl border px-5 py-3.5 transition hover:bg-white/[0.05] ${
                tone === "rose"
                  ? "border-rose-500/25 bg-rose-500/[0.06]"
                  : tone === "amber"
                    ? "border-amber-500/25 bg-amber-500/[0.05]"
                    : tone === "violet"
                      ? "border-violet-500/25 bg-violet-500/[0.05]"
                      : "border-white/[0.06]"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 text-white/55" aria-hidden />
              <span className="flex-1 text-[14px] font-medium text-white">{label}</span>
              <span className="tabular-nums text-[14px] font-bold text-white/90">
                {loading ? "…" : value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/disputes"
        className="mt-4 inline-flex text-[14px] font-semibold text-sky-300 hover:text-sky-200"
      >
        Open disputes queue →
      </Link>
    </div>
  );
}
