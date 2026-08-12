"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  fetchAdminDisputeMessages,
  fetchAdminDisputes,
  postAdminDisputeMessage,
  resolveAdminDispute,
  type AdminDispute,
  type AdminDisputeMessage,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { useToast } from "@/lib/toast";

export default function DisputesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { canResolveDisputes } = useAdminCapabilities();
  const [status, setStatus] = useState<string>("");
  const [resolveDraft, setResolveDraft] = useState<
    | null
    | { dispute: AdminDispute; action: "RELEASE" | "REJECT" | "REFUND" }
  >(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [threadDispute, setThreadDispute] = useState<AdminDispute | null>(null);
  const [threadReply, setThreadReply] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-disputes", status],
    queryFn: () => fetchAdminDisputes(status ? status : undefined),
  });

  const threadQ = useQuery({
    queryKey: ["admin-dispute-messages", threadDispute?.id],
    queryFn: () => fetchAdminDisputeMessages(threadDispute!.id),
    enabled: !!threadDispute?.id,
  });

  const replyM = useMutation({
    mutationFn: () =>
      postAdminDisputeMessage(threadDispute!.id, threadReply.trim()),
    onSuccess: () => {
      setThreadReply("");
      void qc.invalidateQueries({
        queryKey: ["admin-dispute-messages", threadDispute?.id],
      });
      toast.success("Reply sent.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolveM = useMutation({
    mutationFn: (args: {
      id: string;
      action: "REFUND" | "RELEASE" | "REJECT";
      notes?: string;
      refundAmount?: string;
    }) => resolveAdminDispute(args.id, args),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin-disputes"] });
      void qc.invalidateQueries({ queryKey: ["topbar-inbox-disputes"] });
      const label =
        vars.action === "RELEASE"
          ? "released"
          : vars.action === "REFUND"
            ? "refunded"
            : "rejected";
      toast.success(`Dispute ${label}.`);
      setResolveDraft(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!resolveDraft) {
      setResolutionNotes("");
      setRefundAmount("");
      return;
    }
    setResolutionNotes(
      resolveDraft.action === "RELEASE"
        ? "Released escrow via admin console."
        : resolveDraft.action === "REFUND"
          ? "Refund issued after dispute review."
          : "Rejected claim after review."
    );
  }, [resolveDraft]);

  const openResolve = (d: AdminDispute, action: "RELEASE" | "REJECT" | "REFUND") => {
    if (!canResolveDisputes) {
      toast.error("Your role cannot resolve disputes.");
      return;
    }
    setResolveDraft({ dispute: d, action });
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Disputes" }]}
        icon={ShieldAlert}
        title="Support disputes"
        description="Operational queue for cancellations, COD issues, or refund arbitration."
      />

      {!canResolveDisputes ? (
        <p className="mb-4 text-[14px] text-amber-200/85">
          You have read-only access to disputes. Escalate closure to operators with adjudication privileges.
        </p>
      ) : null}

      <div className="mb-4 flex gap-2">
        {["", "OPEN", "RESOLVED", "REJECTED"].map((s) => (
          <button
            key={s || "ALL"}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold ${
              status === s
                ? "bg-violet-600/35 text-white"
                : "text-white/45 hover:bg-white/[0.04]"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[12px] uppercase text-white/40">
              <th className="px-5 py-3.5">Dispute</th>
              <th className="px-5 py-3.5">Order</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Thread</th>
              <th className="px-5 py-3.5 text-right">Resolve</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableSkeleton cols={5} rows={6} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/45">
                  No disputes in this lane.
                </td>
              </tr>
            ) : (
              data.map((d: AdminDispute) => (
                <tr key={d.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-[12px] text-white/55">{d.id}</p>
                    <p className="text-white/70">{d.reason}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[13px]">
                    <Link
                      href={`/dashboard/orders?q=${encodeURIComponent(d.orderId)}`}
                      className="text-sky-300 hover:text-sky-200 hover:underline"
                    >
                      {d.orderId}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] font-bold uppercase text-amber-200">
                    {d.status}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      className="rounded-lg border border-white/12 px-2 py-1 text-[12px] text-sky-200"
                      onClick={() => setThreadDispute(d)}
                    >
                      Messages
                    </button>
                  </td>
                  <td className="space-x-1 px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={
                        resolveM.isPending || d.status !== "OPEN" || !canResolveDisputes
                      }
                      className="rounded-lg border border-white/12 px-2 py-1 text-[12px]"
                      onClick={() => openResolve(d, "RELEASE")}
                    >
                      Release
                    </button>
                    <button
                      type="button"
                      disabled={
                        resolveM.isPending || d.status !== "OPEN" || !canResolveDisputes
                      }
                      className="rounded-lg border border-violet-400/35 px-2 py-1 text-[12px] text-violet-200"
                      onClick={() => openResolve(d, "REFUND")}
                    >
                      Refund
                    </button>
                    <button
                      type="button"
                      disabled={
                        resolveM.isPending || d.status !== "OPEN" || !canResolveDisputes
                      }
                      className="rounded-lg border border-rose-400/35 px-2 py-1 text-[12px] text-rose-200"
                      onClick={() => openResolve(d, "REJECT")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {threadDispute ? (
        <div className="glass-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0c0b14]/95 p-5 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] uppercase tracking-wider text-white/40">Dispute thread</p>
              <p className="font-mono text-[13px] text-white/70">{threadDispute.id}</p>
            </div>
            <button
              type="button"
              className="text-white/50 hover:text-white"
              onClick={() => setThreadDispute(null)}
            >
              Close
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto overflow-admin-scroll pr-1">
            {threadQ.isLoading ? (
              <p className="text-[14px] text-white/45">Loading messages…</p>
            ) : (threadQ.data ?? []).length === 0 ? (
              <p className="text-[14px] text-white/45">No messages yet.</p>
            ) : (
              (threadQ.data ?? []).map((m: AdminDisputeMessage) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
                >
                  <p className="text-[11px] font-bold uppercase text-violet-200/80">
                    {m.senderRole}
                  </p>
                  <p className="mt-1 text-[14px] text-white/80">{m.message}</p>
                  <p className="mt-1 text-[11px] text-white/35">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <textarea
              value={threadReply}
              onChange={(e) => setThreadReply(e.target.value)}
              rows={3}
              className="glass-input w-full resize-none p-3 text-[14px]"
              placeholder="Reply to customer…"
            />
            <button
              type="button"
              disabled={!threadReply.trim() || replyM.isPending}
              onClick={() => replyM.mutate()}
              className="mt-2 w-full rounded-xl bg-violet-600/80 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {replyM.isPending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={resolveDraft !== null}
        title={
          resolveDraft?.action === "RELEASE"
            ? "Release funds?"
            : resolveDraft?.action === "REFUND"
              ? "Issue refund?"
              : "Reject dispute?"
        }
        description={
          resolveDraft ? (
            <>
              Order{" "}
              <span className="font-mono text-white">{resolveDraft.dispute.orderId}</span>
              {" — "}this is logged for payouts and audits.
            </>
          ) : undefined
        }
        confirmLabel={
          resolveDraft?.action === "RELEASE"
            ? "Release"
            : resolveDraft?.action === "REFUND"
              ? "Refund"
              : "Reject claim"
        }
        variant={resolveDraft?.action === "REJECT" ? "danger" : "default"}
        loading={resolveM.isPending}
        onCancel={() => setResolveDraft(null)}
        onConfirm={() => {
          if (!resolveDraft || !resolutionNotes.trim()) return;
          if (resolveDraft.action === "REFUND" && !refundAmount.trim()) return;
          void resolveM.mutate({
            id: resolveDraft.dispute.id,
            action: resolveDraft.action,
            notes: resolutionNotes.trim(),
            ...(resolveDraft.action === "REFUND"
              ? { refundAmount: refundAmount.trim() }
              : {}),
          });
        }}
      >
        <label className="block text-[13px] font-medium text-white/55">
          Resolution notes
        </label>
        <textarea
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          rows={3}
          className="glass-input mt-1 w-full resize-none p-3 text-[14px]"
          placeholder="Required — visible in internal records"
        />
        {resolveDraft?.action === "REFUND" ? (
          <>
            <label className="mt-4 block text-[13px] font-medium text-white/55">
              Refund amount (NPR)
            </label>
            <input
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="glass-input mt-1 h-11 w-full font-mono text-[14px]"
              placeholder="e.g. 1500.00"
            />
          </>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
