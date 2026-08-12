"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bike,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  UserCircle2,
  Users,
  FileBarChart,
  Bell,
  ShieldCheck,
  Star,
  Crown,
  ShieldAlert,
} from "lucide-react";
import { GoPasalLogo } from "@/components/brand/GoPasalLogo";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/search", label: "Search", icon: Search },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/sellers", label: "Sellers", icon: Store },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/delivery", label: "Delivery", icon: Bike },
  { href: "/dashboard/disputes", label: "Disputes", icon: ShieldAlert },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/promotions", label: "Promotions", icon: Megaphone },
  { href: "/dashboard/tiers", label: "Tiers", icon: Crown },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const displayName = user?.name || "Admin";
  const primaryRole =
    user?.roles.find((r) => r === "SUPER_ADMIN") ?? user?.roles[0] ?? "Admin";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#0f172a] to-[#0b0f19] backdrop-blur-xl">
      <div className="border-b border-white/[0.06] px-5 py-6">
        <GoPasalLogo />
      </div>

      <nav className="flex-1 overflow-y-auto overflow-admin-scroll px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium tracking-tight transition-all",
                    active
                      ? "bg-gradient-to-r from-sky-500/20 to-blue-600/15 text-white shadow-sm shadow-sky-500/10 border border-sky-400/20 font-semibold"
                      : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-sky-400" : "text-white/45")} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <div className="mb-3 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-900/20 via-slate-900/40 to-transparent p-4 shadow-lg shadow-black/40">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />
            <span className="font-display text-sm font-semibold tracking-tight text-white">AI Insights</span>
            <span className="ml-auto rounded-md bg-emerald-500/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
              New
            </span>
          </div>
          <p className="text-[12px] leading-relaxed text-white/50">
            Smart signals for payouts, churn, and catalogue health ship here next.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-950/40">
            <UserCircle2 className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-white">{displayName}</p>
            <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-400/80">
              {primaryRole.replace(/_/g, " ")}
            </p>
          </div>
          <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-emerald-400" aria-hidden />
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] font-medium text-white/75 transition hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
