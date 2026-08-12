"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Store, Users, Zap, Download } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import {
  fetchAdminCustomerPlans,
  fetchAdminCustomerSubscriptions,
  fetchAdminStoreMarketingPlans,
  fetchAdminStoreMarketingSubscriptions,
  patchAdminCustomerPlan,
  patchAdminStoreMarketingPlan,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { downloadCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast";

function BenefitsSummary({ benefits }: { benefits: Record<string, unknown> }) {
  const free = benefits.freeDelivery as
    | { mode?: string; threshold?: number }
    | undefined;
  let deliveryLine = "—";
  if (free?.mode === "always") deliveryLine = "Free delivery on every order";
  else if (free?.mode === "above_subtotal_threshold" && free.threshold != null) {
    deliveryLine = `Free delivery above Rs. ${free.threshold}`;
  } else if (free?.mode === "never") deliveryLine = "No delivery waiver";

  const loyalty = typeof benefits.loyaltyEarnMultiplier === "number"
    ? `${Math.round((benefits.loyaltyEarnMultiplier - 1) * 100)}% extra loyalty`
    : null;

  const commission = typeof benefits.commissionDiscountBps === "number"
    ? `−${(benefits.commissionDiscountBps / 100).toFixed(2)} pp commission`
    : null;

  const search =
    typeof benefits.searchBoostMultiplier === "number"
      ? `Search boost ×${benefits.searchBoostMultiplier}`
      : null;

  const lines = [
    deliveryLine !== "—" ? deliveryLine : null,
    loyalty,
    commission,
    search,
  ].filter(Boolean) as string[];

  if (lines.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed text-white/35">
        Configure JSON benefits on the plan (free delivery rules, boosts, credits).
      </p>
    );
  }

  return (
    <ul className="space-y-1 text-[13px] leading-snug text-white/60">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400/80" aria-hidden />
          {line}
        </li>
      ))}
    </ul>
  );
}

export default function TiersPage() {
  const toast = useToast();
  const qc = useQueryClient();

  const patchCustomerM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof patchAdminCustomerPlan>[1] }) =>
      patchAdminCustomerPlan(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "tiers", "customer-plans"] });
      toast.success("Customer plan updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchStoreM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof patchAdminStoreMarketingPlan>[1] }) =>
      patchAdminStoreMarketingPlan(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "tiers", "store-plans"] });
      toast.success("Seller plan updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const customerQ = useQuery({
    queryKey: ["admin", "tiers", "customer-plans"],
    queryFn: fetchAdminCustomerPlans,
  });

  const storeQ = useQuery({
    queryKey: ["admin", "tiers", "store-plans"],
    queryFn: fetchAdminStoreMarketingPlans,
  });

  const custSubsQ = useQuery({
    queryKey: ["admin", "tiers", "cust-subs"],
    queryFn: fetchAdminCustomerSubscriptions,
  });

  const storeSubsQ = useQuery({
    queryKey: ["admin", "tiers", "store-subs"],
    queryFn: fetchAdminStoreMarketingSubscriptions,
  });

  const exportCustomerSubsCsv = () => {
    type Row = {
      subscription?: { id?: string; status?: string; endAt?: string };
      plan?: { name?: string };
    };
    const list = Array.isArray(custSubsQ.data) ? (custSubsQ.data as Row[]) : [];
    if (!list.length) {
      toast.error("No customer subscriptions loaded.");
      return;
    }
    downloadCsv(
      `customer-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["planName", "subscriptionId", "status", "endsOn"],
      list.map((row) => ({
        planName: row.plan?.name ?? "",
        subscriptionId: row.subscription?.id ?? "",
        status: row.subscription?.status ?? "",
        endsOn: row.subscription?.endAt
          ? new Date(row.subscription.endAt).toISOString()
          : "",
      }))
    );
    toast.success(`Exported ${list.length} customer subscription rows`);
  };

  const exportSellerSubsCsv = () => {
    type Row = {
      subscription?: {
        id?: string;
        status?: string;
        storeId?: string;
        endAt?: string;
      };
      plan?: { name?: string };
    };
    const list = Array.isArray(storeSubsQ.data) ? (storeSubsQ.data as Row[]) : [];
    if (!list.length) {
      toast.error("No seller marketing subscriptions loaded.");
      return;
    }
    downloadCsv(
      `seller-marketing-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["planName", "subscriptionId", "storeId", "status", "endsOn"],
      list.map((row) => ({
        planName: row.plan?.name ?? "",
        subscriptionId: row.subscription?.id ?? "",
        storeId: row.subscription?.storeId ?? "",
        status: row.subscription?.status ?? "",
        endsOn: row.subscription?.endAt
          ? new Date(row.subscription.endAt).toISOString()
          : "",
      }))
    );
    toast.success(`Exported ${list.length} seller subscription rows`);
  };

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Tiers & memberships" },
        ]}
        icon={Crown}
        title="Customer & seller tiers"
        description="Membership perks for buyers (delivery, loyalty) and paid shop plans (take-rate, discovery). Checkout and commission already read these benefits."
      />

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="glass-panel relative overflow-hidden rounded-2xl p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl" />
          <AdminSectionHeader
            variant="standalone"
            title="Customer membership"
            description="Swiggy One / Zomato Gold–style: free or threshold-based delivery, priority handling, and loyalty multipliers from plan JSON."
            icon={Crown}
            iconWrapperClassName="border-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30"
          />

          <div className="relative mt-8 space-y-4">
            {customerQ.isLoading ? (
              <p className="text-[14px] text-white/40">Loading plans…</p>
            ) : customerQ.isError ? (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-5 py-3.5 text-[14px] text-rose-200">
                {(customerQ.error as Error)?.message ?? "Could not load plans"}
              </p>
            ) : customerQ.data?.length === 0 ? (
              <p className="text-[14px] text-white/40">
                No plans yet. Run <code className="rounded bg-black/30 px-1.5 py-0.5">db:seed</code>{" "}
                or insert via migration.
              </p>
            ) : (
              customerQ.data?.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="admin-heading-section text-[15px]">
                        {plan.name}
                      </p>
                      {plan.slug ? (
                        <p className="mt-0.5 text-[13px] text-white/40">{plan.slug}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-emerald-200">
                        Rs. {plan.price}
                      </p>
                      <p className="text-[12px] text-white/35">{plan.durationDays} days</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                        plan.isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/45"
                      )}
                    >
                      {plan.isActive ? "Live" : "Off"}
                    </span>
                    {plan.isPriorityDelivery ? (
                      <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sky-200">
                        Priority
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <BenefitsSummary benefits={plan.benefits} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={patchCustomerM.isPending}
                      onClick={() =>
                        patchCustomerM.mutate({
                          id: plan.id,
                          body: { isActive: !plan.isActive },
                        })
                      }
                      className="rounded-lg border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/75 hover:bg-white/[0.06]"
                    >
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={patchCustomerM.isPending}
                      onClick={() => {
                        const next = window.prompt("New price (NPR)", String(plan.price ?? ""));
                        if (next?.trim()) {
                          patchCustomerM.mutate({ id: plan.id, body: { price: next.trim() } });
                        }
                      }}
                      className="rounded-lg border border-violet-500/35 bg-violet-500/10 px-3 py-1.5 text-[12px] font-semibold text-violet-200"
                    >
                      Edit price
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="glass-panel relative overflow-hidden rounded-2xl p-6">
          <div className="pointer-events-none absolute -right-8 -bottom-16 h-44 w-44 rounded-full bg-sky-600/15 blur-3xl" />
          <AdminSectionHeader
            variant="standalone"
            title="Seller shop marketing"
            description="Monthly tiers shops buy: commission relief at order time (snapshot), search multipliers and promo credits for your ads and catalogue pipeline."
            icon={Store}
            iconWrapperClassName="border-0 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-900/25"
          />

          <div className="relative mt-8 space-y-4">
            {storeQ.isLoading ? (
              <p className="text-[14px] text-white/40">Loading shop plans…</p>
            ) : storeQ.isError ? (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-5 py-3.5 text-[14px] text-rose-200">
                {(storeQ.error as Error)?.message ?? "Could not load store plans"}
              </p>
            ) : storeQ.data?.length === 0 ? (
              <p className="text-[14px] text-white/40">No seller tier products defined.</p>
            ) : (
              storeQ.data?.map((plan) => (
                <article
                  key={plan.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="admin-heading-section text-[15px]">
                        {plan.name}
                      </p>
                      <p className="mt-0.5 text-[13px] text-white/40">{plan.slug}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-sky-200">
                        Rs. {plan.monthlyPrice}
                        <span className="text-[12px] font-normal text-white/35"> / mo</span>
                      </p>
                    </div>
                  </div>
                  {plan.description ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-white/45">
                      {plan.description}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                        plan.isActive
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/45"
                      )}
                    >
                      {plan.isActive ? "Live" : "Off"}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-white/[0.06] pt-3">
                    <BenefitsSummary benefits={plan.benefits} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={patchStoreM.isPending}
                      onClick={() =>
                        patchStoreM.mutate({
                          id: plan.id,
                          body: { isActive: !plan.isActive },
                        })
                      }
                      className="rounded-lg border border-white/12 px-3 py-1.5 text-[12px] font-semibold text-white/75 hover:bg-white/[0.06]"
                    >
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={patchStoreM.isPending}
                      onClick={() => {
                        const next = window.prompt(
                          "Monthly price (NPR)",
                          String(plan.monthlyPrice ?? "")
                        );
                        if (next?.trim()) {
                          patchStoreM.mutate({ id: plan.id, body: { monthlyPrice: next.trim() } });
                        }
                      }}
                      className="rounded-lg border border-sky-500/35 bg-sky-500/10 px-3 py-1.5 text-[12px] font-semibold text-sky-200"
                    >
                      Edit monthly price
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5">
          <AdminSectionHeader
            variant="standalone"
            className="mb-4"
            icon={Users}
            title="Active customer subscriptions"
            description="Latest rows from user_subscriptions (API limit 200)."
            actions={
            <button
              type="button"
              onClick={exportCustomerSubsCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-white/75 hover:bg-white/[0.07]"
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV
            </button>
            }
          />
          <ul className="max-h-64 space-y-2 overflow-auto text-[13px]">
            {custSubsQ.isLoading ? (
              <li className="text-white/45">Loading…</li>
            ) : custSubsQ.isError ? (
              <li className="text-rose-300">{(custSubsQ.error as Error).message}</li>
            ) : !(custSubsQ.data as unknown[])?.length ? (
              <li className="text-white/45">No subscriptions.</li>
            ) : (
              (
                custSubsQ.data as {
                  subscription?: { id: string; status: string; endAt: string };
                  plan?: { name: string };
                }[]
              ).map((row, i) => (
                <li
                  key={`${row.subscription?.id ?? i}`}
                  className="flex justify-between rounded-lg border border-white/[0.05] px-3 py-2"
                >
                  <span className="text-white/85">{row.plan?.name ?? "Plan"}</span>
                  <span className="text-white/55">
                    {row.subscription?.status} ·{" "}
                    {row.subscription?.endAt
                      ? new Date(row.subscription.endAt).toLocaleDateString()
                      : "—"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <AdminSectionHeader
            variant="standalone"
            className="mb-4"
            icon={Store}
            title="Seller marketing subscriptions"
            description="store_marketing_subscriptions stream (limit 200)."
            actions={
            <button
              type="button"
              onClick={exportSellerSubsCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-[13px] font-semibold text-white/75 hover:bg-white/[0.07]"
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV
            </button>
            }
          />
          <ul className="max-h-64 space-y-2 overflow-auto text-[13px]">
            {storeSubsQ.isLoading ? (
              <li className="text-white/45">Loading…</li>
            ) : storeSubsQ.isError ? (
              <li className="text-rose-300">{(storeSubsQ.error as Error).message}</li>
            ) : !(storeSubsQ.data as unknown[])?.length ? (
              <li className="text-white/45">No subscriptions.</li>
            ) : (
              (
                storeSubsQ.data as {
                  subscription?: {
                    id: string;
                    status: string;
                    storeId: string;
                    endAt: string;
                  };
                  plan?: { name: string };
                }[]
              ).map((row, i) => (
                <li
                  key={`${row.subscription?.id ?? i}`}
                  className="flex justify-between rounded-lg border border-white/[0.05] px-3 py-2"
                >
                  <span className="text-white/85">
                    {row.plan?.name ?? "Plan"}{" "}
                    <span className="font-mono text-[11px] text-white/35">
                      {row.subscription?.storeId?.slice(0, 10)}…
                    </span>
                  </span>
                  <span className="text-white/55">{row.subscription?.status}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <div className="glass-panel rounded-2xl border border-violet-500/20 bg-violet-950/20 p-5">
        <AdminSectionHeader
          variant="standalone"
          icon={Zap}
          title="How it ships"
          description="Integration points your engineers already call from checkout and seller apps."
          iconWrapperClassName="border-amber-500/30 bg-amber-500/12 text-amber-200"
        />
        <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-white/55">
          <li>
            <strong className="text-white/80">Customers</strong> subscribe via{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[13px]">POST /growth/subscription/subscribe</code>
            ; checkout applies delivery rules from <code className="rounded bg-black/30 px-1.5 py-0.5 text-[13px]">benefits</code>.
          </li>
          <li>
            <strong className="text-white/80">Shops</strong> subscribe via seller API{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-[13px]">
              POST /seller/marketing/subscribe
            </code>
            ; order service snapshots commission discounts into each order.
          </li>
        </ul>
      </div>
    </>
  );
}
