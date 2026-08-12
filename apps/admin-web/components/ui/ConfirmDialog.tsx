"use client";

import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    open,
    title,
    description,
    children,
    confirmLabel,
    cancelLabel = "Cancel",
    variant = "default",
    loading = false,
    onConfirm,
    onCancel,
  } = props;

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    function onTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    window.addEventListener("keydown", onEscape);
    window.addEventListener("keydown", onTab);
    return () => {
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("keydown", onTab);
    };
  }, [loading, open, onCancel]);

  useEffect(() => {
    if (open && dialogRef.current) {
      const firstBtn = dialogRef.current.querySelector<HTMLButtonElement>('button:not([disabled])');
      firstBtn?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal
        aria-labelledby="confirm-dialog-title"
        className="glass-panel max-h-[min(560px,calc(100vh-4rem))] w-full max-w-md overflow-y-auto rounded-2xl border border-white/[0.08] p-6 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="admin-heading-section">
          {title}
        </h2>
        {description ? (
          <div className="mt-2 text-[14px] leading-relaxed text-white/55">{description}</div>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-[14px] text-white/70 transition hover:bg-white/[0.04]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] font-semibold text-white transition",
              variant === "danger"
                ? "bg-rose-600/90 hover:bg-rose-500"
                : "bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
