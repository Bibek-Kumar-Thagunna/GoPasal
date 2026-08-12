"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Search, ShoppingCart, Store, Tag, UserRound } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import {
  fetchAdminCoupons,
  fetchAdminOrders,
  fetchAdminProducts,
  fetchAdminTenants,
  fetchAdminUsers,
  type AdminCouponRow,
  type AdminOrderRow,
  type AdminProductRow,
  type AdminUserRow,
} from "@/lib/api";

const PREVIEW_LIMIT = 8;

function SectionCard({
  title,
  icon: Icon,
  href,
  total,
  isLoading,
  isError,
  error,
  children,
}: {
  title: string;
  icon: typeof UserRound;
  href: string;
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  children: ReactNode;
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-2xl">
      <AdminSectionHeader
        variant="panel"
        icon={Icon}
        title={title}
        description={
          isLoading ? "Loading preview…" : `${total} match${total === 1 ? "" : "es"} in this preview`
        }
        actions={
          <Link
              href={href}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[13px] font-medium text-sky-200 transition hover:bg-white/[0.06]"
            >
              Open full list
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
        }
      />
      {isError && error ? (
        <div className="border-b border-rose-500/20 bg-rose-500/10 px-5 py-3 text-[14px] text-rose-100">
          {error.message}
        </div>
      ) : null}
      <div className="p-0">{children}</div>
    </section>
  );
}

function DashboardSearchContent() {
  const sp = useSearchParams();
  const qRaw = sp.get("q") ?? "";
  const q = qRaw.trim();
  const hasQuery = q.length > 0;

  const enc = encodeURIComponent(q);

  const usersQ = useQuery({
    queryKey: ["dashboard-global-search-users", q],
    enabled: hasQuery,
    queryFn: () => fetchAdminUsers({ page: 1, limit: PREVIEW_LIMIT, q }),
  });

  const productsQ = useQuery({
    queryKey: ["dashboard-global-search-products", q],
    enabled: hasQuery,
    queryFn: () =>
      fetchAdminProducts({
        page: 1,
        limit: PREVIEW_LIMIT,
        q,
        includeInactive: true,
      }),
  });

  const couponsQ = useQuery({
    queryKey: ["dashboard-global-search-coupons", q],
    enabled: hasQuery,
    queryFn: () => fetchAdminCoupons({ page: 1, limit: PREVIEW_LIMIT, q }),
  });

  const ordersQ = useQuery({
    queryKey: ["dashboard-global-search-orders", q],
    enabled: hasQuery,
    queryFn: () =>
      fetchAdminOrders({ page: 1, limit: PREVIEW_LIMIT, q }),
  });

  const sellersQ = useQuery({
    queryKey: ["dashboard-global-search-sellers", q],
    enabled: hasQuery,
    queryFn: () => fetchAdminTenants({ page: 1, limit: PREVIEW_LIMIT, q }),
  });

  const userItems = usersQ.data?.items ?? [];
  const productItems = productsQ.data?.items ?? [];
  const couponItems = couponsQ.data?.items ?? [];
  const orderItems = ordersQ.data?.items ?? [];
  const sellerItems = (sellersQ.data?.items ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    verificationStep?: string;
  }>;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Search" },
        ]}
        icon={Search}
        title={hasQuery ? `Results for "${q}"` : "Global search"}
        description="Preview matches across accounts, orders, catalogue, and coupon codes — refine in each module."
      />

      {!hasQuery ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-[14px] text-white/55">
          <Search className="mx-auto mb-3 h-10 w-10 text-white/25" aria-hidden />
          <p>
            Enter a keyword in the top bar and press <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[12px]">Enter</kbd>{" "}
            or use{" "}
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[12px]">⌘K</kbd> /{" "}
            <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-[12px]">Ctrl+K</kbd>{" "}
            to focus search.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <SectionCard
            title="Customers & roles"
            icon={UserRound}
            href={`/dashboard/users?q=${enc}`}
            total={usersQ.data?.total ?? userItems.length}
            isLoading={usersQ.isLoading}
            isError={usersQ.isError}
            error={usersQ.error as Error | null}
          >
            <ul className="divide-y divide-white/[0.04]">
              {usersQ.isLoading ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">Loading users…</li>
              ) : userItems.length === 0 ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">No user matches.</li>
              ) : (
                userItems.map((u: AdminUserRow) => (
                  <li key={u.id} className="flex flex-wrap items-baseline gap-2 px-5 py-3 text-[14px]">
                    <span className="font-medium text-white">{u.name || "—"}</span>
                    <span className="text-white/50">{u.phone}</span>
                    <span className="ml-auto text-[12px] uppercase tracking-wide text-white/35">
                      {(u.roles ?? []).slice(0, 2).join(", ")}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </SectionCard>

          <SectionCard
            title="Shops & sellers"
            icon={Store}
            href={`/dashboard/sellers?q=${enc}`}
            total={sellersQ.data?.total ?? sellerItems.length}
            isLoading={sellersQ.isLoading}
            isError={sellersQ.isError}
            error={sellersQ.error as Error | null}
          >
            <ul className="divide-y divide-white/[0.04]">
              {sellersQ.isLoading ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">Loading shops…</li>
              ) : sellerItems.length === 0 ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">No shop matches.</li>
              ) : (
                sellerItems.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-baseline gap-2 px-5 py-3 text-[14px]">
                    <span className="font-medium text-white">{s.name}</span>
                    <span className="text-white/45">{s.slug}</span>
                    <span className="ml-auto text-[12px] uppercase tracking-wide text-white/35">
                      {s.status} · {s.verificationStep ?? "—"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </SectionCard>

          <SectionCard
            title="Catalogue listings"
            icon={Package}
            href={`/dashboard/products?q=${enc}`}
            total={productsQ.data?.total ?? productItems.length}
            isLoading={productsQ.isLoading}
            isError={productsQ.isError}
            error={productsQ.error as Error | null}
          >
            <ul className="divide-y divide-white/[0.04]">
              {productsQ.isLoading ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">Loading products…</li>
              ) : productItems.length === 0 ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">No product matches.</li>
              ) : (
                productItems.map((p: AdminProductRow) => (
                  <li key={p.id} className="flex flex-wrap items-baseline gap-2 px-5 py-3 text-[14px]">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className="text-white/45">{p.storeName ?? p.storeId}</span>
                    <span className="ml-auto tabular-nums text-white/50">Rs. {p.basePrice}</span>
                  </li>
                ))
              )}
            </ul>
          </SectionCard>

          <SectionCard
            title="Orders"
            icon={ShoppingCart}
            href={`/dashboard/orders?q=${enc}`}
            total={ordersQ.data?.total ?? orderItems.length}
            isLoading={ordersQ.isLoading}
            isError={ordersQ.isError}
            error={ordersQ.error as Error | null}
          >
            <ul className="divide-y divide-white/[0.04]">
              {ordersQ.isLoading ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">Loading orders…</li>
              ) : orderItems.length === 0 ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">No order matches.</li>
              ) : (
                orderItems.map((o: AdminOrderRow) => (
                  <li key={o.id} className="flex flex-wrap items-baseline gap-2 px-5 py-3 text-[14px]">
                    <span className="font-mono text-[13px] text-white/80">{o.id}</span>
                    <span className="text-white/50">{o.storeName}</span>
                    <span className="text-white/45">{o.customerPhone}</span>
                    <span className="ml-auto tabular-nums text-emerald-200/90">Rs. {o.totalAmount}</span>
                  </li>
                ))
              )}
            </ul>
          </SectionCard>

          <SectionCard
            title="Coupons"
            icon={Tag}
            href={`/dashboard/promotions?q=${enc}`}
            total={couponsQ.data?.total ?? couponItems.length}
            isLoading={couponsQ.isLoading}
            isError={couponsQ.isError}
            error={couponsQ.error as Error | null}
          >
            <ul className="divide-y divide-white/[0.04]">
              {couponsQ.isLoading ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">Loading coupons…</li>
              ) : couponItems.length === 0 ? (
                <li className="px-5 py-6 text-center text-[14px] text-white/40">No coupon matches.</li>
              ) : (
                couponItems.map((c: AdminCouponRow) => (
                  <li key={c.id} className="flex flex-wrap items-baseline gap-2 px-5 py-3 text-[14px]">
                    <span className="font-mono font-semibold text-orange-100">{c.code}</span>
                    <span className="text-white/50">
                      {c.type === "FIXED" ? `Rs. ${c.value}` : `${c.value}%`}
                    </span>
                    <span className="ml-auto text-[12px] text-white/40">
                      {c.status}
                      {c.requiresGold ? (
                        <span className="ml-1 text-violet-300">· membership</span>
                      ) : null}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </SectionCard>
        </div>
      )}
    </>
  );
}

export default function DashboardSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-[14px] text-white/45">
          Loading search…
        </div>
      }
    >
      <DashboardSearchContent />
    </Suspense>
  );
}
