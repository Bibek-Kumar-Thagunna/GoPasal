"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHero({
  crumbs,
  title,
  description,
  action,
  icon: Icon,
  badge,
}: {
  crumbs: { label: string; href?: string }[];
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0 max-w-[min(100%,54rem)]">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1 text-[12px] font-medium uppercase tracking-[0.14em] text-white/38"
        >
          {crumbs.map((c, i) => (
            <span key={c.label + i} className="flex items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight className="h-3 w-3 text-white/25" aria-hidden />
              ) : null}
              {c.href ? (
                <Link href={c.href} className="transition hover:text-white/55">
                  {c.label}
                </Link>
              ) : (
                <span className="text-white/45">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {Icon ? (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.07] to-white/[0.02] text-sky-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="admin-heading-page">{title}</h1>
            {badge ? <span className="shrink-0">{badge}</span> : null}
          </div>
        </div>

        {description ? <p className="admin-copy-lead mt-3.5 max-w-2xl">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-start gap-2">{action}</div> : null}
    </div>
  );
}

export function AdminStatusBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "success" | "default" | "warn";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        tone === "success" && "bg-emerald-500/88 text-white shadow-sm shadow-emerald-900/30",
        tone === "warn" && "bg-amber-500/85 text-neutral-950",
        tone === "default" && "bg-white/[0.1] text-white/80 ring-1 ring-white/10"
      )}
    >
      {children}
    </span>
  );
}
