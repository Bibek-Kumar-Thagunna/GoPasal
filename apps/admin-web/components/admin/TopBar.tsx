"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Loader2,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  type FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminCustomerSubscriptions,
  fetchAdminDisputes,
  fetchAdminReviewsPage,
  fetchAdminStoreMarketingSubscriptions,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

function searchPlaceholder(path: string): string {
  if (path.startsWith("/dashboard/users")) return "Search users by phone, email, name…";
  if (path.startsWith("/dashboard/sellers")) return "Search shops by name, slug, owner phone…";
  if (path.startsWith("/dashboard/products"))
    return "Search products — or press Enter for global search…";
  if (path.startsWith("/dashboard/orders"))
    return "Order ID, phone, customer, shop name…";
  if (path.startsWith("/dashboard/delivery"))
    return "Rider phone, order id, shop, buyer phone…";
  if (path.startsWith("/dashboard/promotions")) return "Coupon code — or global search…";
  if (path.startsWith("/dashboard/search")) return "Search users, catalogue, coupons…";
  return "Search across platform…";
}

function formatRoleLabel(roles?: string[]): string {
  const r = roles ?? [];
  if (r.some((x) => x === "SUPER_ADMIN")) return "Super Admin";
  if (r.some((x) => x === "PLATFORM_OPERATOR")) return "Platform Operator";
  return r[0]?.replace(/_/g, " ") ?? "Admin";
}

function TopBarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const routeSearchParams = useSearchParams();
  const { user, signOut } = useAuth();

  const [query, setQuery] = useState("");
  useEffect(() => {
    const fromUrl = routeSearchParams.get("q") ?? "";
    setQuery(fromUrl);
  }, [routeSearchParams]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const openDisputes = useQuery({
    queryKey: ["topbar-inbox-disputes"],
    queryFn: () => fetchAdminDisputes("OPEN"),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  const pendingReviews = useQuery({
    queryKey: ["topbar-inbox-reviews"],
    queryFn: () => fetchAdminReviewsPage({ page: 1, filter: "pending" }),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

  const trialMemberships = useQuery({
    queryKey: ["topbar-memberships"],
    queryFn: async () => {
      const [c, s] = await Promise.all([
        fetchAdminCustomerSubscriptions(),
        fetchAdminStoreMarketingSubscriptions(),
      ]);
      const now = Date.now();
      type Sub = { endAt?: string; status?: string };
      type Row = { subscription?: Sub };
      const soon = [...(Array.isArray(c) ? c : []), ...(Array.isArray(s) ? s : [])].filter((row) => {
        const sub = (row as Row)?.subscription;
        if (!sub?.endAt || sub.status !== "ACTIVE") return false;
        const end = new Date(sub.endAt).getTime();
        return end > now && end - now < 7 * 24 * 60 * 60 * 1000;
      });
      return soon.length;
    },
    staleTime: 60_000,
    refetchInterval: 180_000,
  });

  const inboxTotal =
    (openDisputes.data?.length ?? 0) +
    (pendingReviews.data?.length ?? 0);
  const expiringSubs = trialMemberships.data ?? 0;
  const badgeCount = inboxTotal + expiringSubs;

  const submitSearch = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const raw = query.trim();
      if (!raw) return;

      if (pathname.startsWith("/dashboard/users")) {
        router.push(`/dashboard/users?q=${encodeURIComponent(raw)}`);
        return;
      }
      if (pathname.startsWith("/dashboard/products")) {
        router.push(`/dashboard/products?q=${encodeURIComponent(raw)}`);
        return;
      }
      if (pathname.startsWith("/dashboard/promotions")) {
        router.push(`/dashboard/promotions?q=${encodeURIComponent(raw)}`);
        return;
      }
      if (pathname.startsWith("/dashboard/orders")) {
        router.push(`/dashboard/orders?q=${encodeURIComponent(raw)}`);
        return;
      }
      if (pathname.startsWith("/dashboard/sellers")) {
        router.push(`/dashboard/sellers?q=${encodeURIComponent(raw)}`);
        return;
      }
      if (pathname.startsWith("/dashboard/delivery")) {
        router.push(`/dashboard/delivery?q=${encodeURIComponent(raw)}`);
        return;
      }
      router.push(`/dashboard/search?q=${encodeURIComponent(raw)}`);
    },
    [pathname, query, router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const el = document.getElementById("gp-admin-global-search") as HTMLInputElement | null;
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ph = searchPlaceholder(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-white/[0.06] bg-[#0a0b1e]/85 px-6 backdrop-blur-xl">
      <form
        role="search"
        onSubmit={submitSearch}
        className="relative max-w-xl flex-1"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/35" />
        <input
          id="gp-admin-global-search"
          type="search"
          placeholder={ph}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search"
          className="glass-input h-11 w-full pl-11 pr-24 text-sm"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[11px] text-white/40 sm:inline">
          ⌘K
        </span>
      </form>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] transition hover:bg-white/[0.08]"
            aria-label="Operational inbox"
            aria-expanded={notifOpen}
          >
            {openDisputes.isFetching || pendingReviews.isFetching ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin text-white/55" />
            ) : (
              <Bell className="h-[18px] w-[18px] text-white/70" />
            )}
            {badgeCount > 0 ? (
              <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-none text-white">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            ) : null}
          </button>

          {notifOpen ? (
            <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12142e]/96 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                Operational inbox
              </p>
              <ul className="max-h-[min(340px,50vh)] space-y-1 overflow-y-auto">
                <li>
                  <Link
                    href="/dashboard/disputes"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] text-white hover:bg-white/[0.06]"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span>Open disputes</span>
                    <span className="rounded-full bg-rose-500/25 px-2 py-0.5 text-[12px] font-bold tabular-nums text-rose-200">
                      {openDisputes.data?.length ?? 0}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/reviews"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] text-white hover:bg-white/[0.06]"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span>Reviews awaiting moderation</span>
                    <span className="rounded-full bg-amber-500/25 px-2 py-0.5 text-[12px] font-bold tabular-nums text-amber-200">
                      {pendingReviews.data?.length ?? 0}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/tiers"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] text-white hover:bg-white/[0.06]"
                    onClick={() => setNotifOpen(false)}
                  >
                    <span>Memberships ending in 7 days</span>
                    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[12px] font-bold tabular-nums text-sky-200">
                      {expiringSubs}
                    </span>
                  </Link>
                </li>
              </ul>
              {badgeCount === 0 && !trialMemberships.isLoading ? (
                <p className="mt-2 text-center text-[13px] text-white/40">Nothing urgent right now.</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <Link
          href="/dashboard/disputes"
          prefetch
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] transition hover:bg-white/[0.08]"
          aria-label="Support queue — messages and disputes"
        >
          <MessageSquare className="h-[18px] w-[18px] text-white/70" />
        </Link>

        <Link
          href="/dashboard/settings"
          prefetch
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] transition hover:bg-white/[0.08]"
          aria-label="System settings"
        >
          <Settings className="h-[18px] w-[18px] text-white/70" />
        </Link>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className={cn(
              "ml-2 flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 pl-3 pr-3 transition hover:bg-white/[0.07]",
              profileOpen && "border-sky-500/35 bg-white/[0.07]"
            )}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            onClick={() => setProfileOpen((v) => !v)}
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600" />
            <div className="text-left leading-tight">
              <p className="max-w-[140px] truncate text-sm font-semibold text-white">
                {user?.name ?? "Administrator"}
              </p>
              <p className="text-[12px] text-white/45">{formatRoleLabel(user?.roles)}</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-white/40 transition",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          {profileOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[220px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12142e]/98 py-2 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              <div className="border-b border-white/[0.06] px-4 pb-3 pt-2">
                <p className="truncate text-[14px] font-semibold text-white">{user?.name ?? "—"}</p>
                <p className="truncate text-[12px] text-white/45">{user?.email ?? user?.phone}</p>
              </div>
              <Link
                href="/dashboard/settings"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-white hover:bg-white/[0.06]"
                onClick={() => setProfileOpen(false)}
              >
                <Settings className="h-4 w-4 opacity-70" />
                Workspace settings
              </Link>
              <Link
                href="/dashboard/tiers"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-white hover:bg-white/[0.06]"
                onClick={() => setProfileOpen(false)}
              >
                <Sparkles className="h-4 w-4 opacity-70" />
                Tier programs
              </Link>
              <Link
                href="/dashboard/disputes"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-white hover:bg-white/[0.06]"
                onClick={() => setProfileOpen(false)}
              >
                <Shield className="h-4 w-4 opacity-70" />
                Support inbox
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 border-t border-white/[0.06] px-5 py-3.5 text-[14px] text-rose-200 hover:bg-rose-500/10"
                onClick={() => void signOut()}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function TopBarSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-white/[0.06] bg-[#0a0b1e]/85 px-6 backdrop-blur-xl">
      <div className="relative max-w-xl flex-1">
        <div className="h-11 w-full animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="ml-2 h-12 w-[200px] animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </header>
  );
}

export function TopBar() {
  return (
    <Suspense fallback={<TopBarSkeleton />}>
      <TopBarInner />
    </Suspense>
  );
}
