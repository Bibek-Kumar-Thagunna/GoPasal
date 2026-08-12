"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { fetchAdminReviewsPage, moderateReviewApi } from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { useToast } from "@/lib/toast";

type Row = Record<string, unknown> & {
  id: string;
  rating?: number;
  comment?: string | null;
  isHidden?: boolean;
};

type ModerationAction = "HIDE" | "SHOW" | "FLAG";

export default function ReviewsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { canModerateReviews } = useAdminCapabilities();
  const [filter, setFilter] = useState<"pending" | "hidden" | "all">("pending");
  const [page, setPage] = useState(1);
  const [pendingModeration, setPendingModeration] = useState<{
    id: string;
    action: ModerationAction;
    label: string;
  } | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", filter, page],
    queryFn: () =>
      fetchAdminReviewsPage({
        page,
        filter: filter === "all" ? "all" : filter,
      }),
  });

  const mod = useMutation({
    mutationFn: (_: { id: string; action: ModerationAction }) =>
      moderateReviewApi(_.id, { action: _.action }),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      void qc.invalidateQueries({ queryKey: ["topbar-inbox-reviews"] });
      const map: Record<ModerationAction, string> = {
        HIDE: "Review hidden from storefront.",
        SHOW: "Review is visible again.",
        FLAG: "Review flagged for follow-up.",
      };
      toast.success(map[vars.action]);
      setPendingModeration(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const list = Array.isArray(data) ? data : [];
  const hasMore = list.length >= 30;

  const requestModeration = (id: string, action: ModerationAction, row: Row) => {
    if (!canModerateReviews) {
      toast.error("Your role cannot moderate reviews.");
      return;
    }
    const labels: Record<ModerationAction, string> = {
      HIDE: "Hide review",
      SHOW: "Show review",
      FLAG: "Flag review",
    };
    setPendingModeration({
      id,
      action,
      label: `${labels[action]} · ${String(row.comment ?? "").slice(0, 72)}`,
    });
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Reviews" }]}
        icon={Star}
        title="Review moderation"
        description="Surface risky feedback, suppress spam without deleting seller telemetry."
      />
      {!canModerateReviews ? (
        <p className="mb-4 text-[14px] text-amber-200/85">
          Read-only analysts can browse reviews but actions require moderation permissions.
        </p>
      ) : null}
      <div className="mb-4 flex gap-2">
        {(["pending", "hidden", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              filter === f ? "bg-amber-500/25 text-amber-100" : "text-white/45"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-white/45">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-white/45">Nothing queued.</p>
        ) : (
          list.map((r) => {
            const row = r as Row;
            const store =
              typeof row.store === "object" && row.store && "name" in row.store
                ? String((row.store as { name?: string }).name)
                : "—";
            return (
              <div
                key={row.id}
                className="glass-panel rounded-2xl border border-white/[0.06] p-4"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-mono text-[12px] text-white/40">{row.id}</p>
                  <span className="text-[12px] text-amber-200/90">
                    {typeof row.rating === "number"
                      ? `${"★".repeat(row.rating)}${"☆".repeat(Math.max(0, 5 - row.rating))}`
                      : "—"}
                  </span>
                  <span className="text-[12px] text-white/45">{store}</span>
                </div>
                <p className="mt-2 text-sm text-white">{row.comment || "No text"}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={mod.isPending || !canModerateReviews}
                    onClick={() =>
                      requestModeration(
                        row.id,
                        row.isHidden ? "SHOW" : "HIDE",
                        row
                      )
                    }
                    className="rounded-lg border border-white/12 px-3 py-1.5 text-[13px] disabled:opacity-40"
                  >
                    {row.isHidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    disabled={mod.isPending || !canModerateReviews}
                    onClick={() => requestModeration(row.id, "FLAG", row)}
                    className="rounded-lg border border-amber-500/35 px-3 py-1.5 text-[13px] text-amber-200 disabled:opacity-40"
                  >
                    Flag
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-[13px] text-white/45">
        <span>Page {page}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingModeration !== null}
        title="Confirm moderation"
        description={
          pendingModeration ? (
            <span className="text-white/80">{pendingModeration.label}</span>
          ) : undefined
        }
        confirmLabel="Apply"
        variant={pendingModeration?.action === "HIDE" ? "danger" : "default"}
        loading={mod.isPending}
        onCancel={() => setPendingModeration(null)}
        onConfirm={() => {
          if (!pendingModeration) return;
          void mod.mutate({
            id: pendingModeration.id,
            action: pendingModeration.action,
          });
        }}
      />
    </>
  );
}
