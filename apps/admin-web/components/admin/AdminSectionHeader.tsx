"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function AdminSectionHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  variant = "panel",
  className,
  iconWrapperClassName,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  iconWrapperClassName?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  variant?: "panel" | "flush" | "standalone";
  className?: string;
}) {
  const shell =
    variant === "panel"
      ? "flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4"
      : variant === "flush"
        ? "flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4"
        : "flex flex-wrap items-start justify-between gap-3";

  return (
    <div className={cn(shell, className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon ? (
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-sky-300/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              iconWrapperClassName
            )}
            aria-hidden
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 className="admin-heading-section">{title}</h2>
            {badge}
          </div>
          {description ? (
            <div className="admin-copy-muted mt-0.5 max-w-2xl [&_code]:text-[0.95em]">{description}</div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
