"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Users } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { PageHero } from "@/components/admin/PageHero";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  fetchAdminUsers,
  patchAdminUserActive,
  type AdminUserRow,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { downloadCsv } from "@/lib/csv-download";
import { cn } from "@/lib/cn";
import { useToast } from "@/lib/toast";

export default function UsersPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { canSuspendUserAccounts } = useAdminCapabilities();
  const sp = useSearchParams();
  const qFromUrl = sp.get("q") ?? "";
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [pendingQ, setPendingQ] = useState("");
  const [disableTarget, setDisableTarget] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    const v = qFromUrl.trim();
    setPendingQ(v);
    setQ(v);
    setPage(1);
  }, [qFromUrl]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-users", page, q],
    queryFn: () => fetchAdminUsers({ page, limit: 20, q: q || undefined }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchAdminUserActive(id, isActive),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(vars.isActive ? "Account enabled." : "Account disabled.");
      setDisableTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.limit ?? 20)));

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString() : "—";

  const handleSearch = () => {
    const t = pendingQ.trim();
    setPage(1);
    setQ(t);
    const qs = new URLSearchParams(sp.toString());
    if (t.length > 0) qs.set("q", t);
    else qs.delete("q");
    const next = qs.toString();
    router.replace(next ? `/dashboard/users?${next}` : "/dashboard/users");
  };

  const handleExportPage = () => {
    if (!items.length) return;
    downloadCsv(
      `users-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["id", "name", "phone", "roles", "isPhoneVerified", "lastLoginAt", "isActive"],
      items.map((u: AdminUserRow) => ({
        id: u.id,
        name: u.name ?? "",
        phone: u.phone,
        roles: (u.roles ?? []).join(";"),
        isPhoneVerified: u.isPhoneVerified ? "yes" : "no",
        lastLoginAt: u.lastLoginAt ?? "",
        isActive: u.isActive ? "yes" : "no",
      }))
    );
    toast.success("Exported current page to CSV");
  };

  const handleToggleClick = (u: AdminUserRow) => {
    if (!canSuspendUserAccounts) {
      toast.error("Only Super Admins may enable or disable customer accounts.");
      return;
    }
    if (!u.isActive) {
      void toggleActive.mutate({ id: u.id, isActive: true });
      return;
    }
    setDisableTarget(u);
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Users" }]}
        icon={Users}
        title="Customers & accounts"
        description="Search users, see roles, and suspend abusive accounts (soft disable login privileges)."
      />

      <div className="glass-panel mb-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" />
            <input
              type="search"
              value={pendingQ}
              onChange={(e) => setPendingQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Phone, email, or name…"
              className="glass-input h-11 w-full pl-11 text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-xl bg-gradient-to-r from-gp-blue to-indigo-500 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Search
          </button>
          <button
            type="button"
            disabled={!items.length}
            onClick={handleExportPage}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/[0.07] disabled:opacity-35"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
          <span className="ml-auto text-[13px] text-white/40">
            {total} user{total === 1 ? "" : "s"}
          </span>
        </div>
        {!canSuspendUserAccounts ? (
          <p className="mt-3 text-[13px] text-amber-200/80">
            View-only operators: escalate account suspensions to a Super Admin.
          </p>
        ) : null}
      </div>

      {isError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[14px] text-rose-100">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="glass-panel rounded-2xl p-0 overflow-hidden">
        <div className="overflow-x-auto overflow-admin-scroll">
          <table className="w-full min-w-[900px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wider text-white/40">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Roles</th>
                <th className="px-5 py-3.5">Verified</th>
                <th className="px-5 py-3.5">Last login</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <AdminTableSkeleton cols={7} rows={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/45">
                    No users match this search.
                  </td>
                </tr>
              ) : (
                items.map((u: AdminUserRow) => (
                  <tr key={u.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-white">{u.name || "—"}</p>
                      <p className="text-[12px] text-white/35">{u.id.slice(0, 12)}…</p>
                    </td>
                    <td className="px-5 py-3.5 text-white/70">{u.phone}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles ?? []).map((r) => (
                          <span
                            key={r}
                            className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-violet-200"
                          >
                            {r.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "text-[12px] font-bold",
                          u.isPhoneVerified ? "text-emerald-300" : "text-amber-200"
                        )}
                      >
                        {u.isPhoneVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-white/45">
                      {fmtTime(u.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold",
                          u.isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-rose-500/15 text-rose-300"
                        )}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        disabled={toggleActive.isPending}
                        title={!canSuspendUserAccounts ? "Super Admin only" : undefined}
                        onClick={() => handleToggleClick(u)}
                        className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[13px] font-semibold text-sky-200 hover:bg-white/[0.08] disabled:opacity-40"
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3.5 text-[13px] text-white/45">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={disableTarget !== null}
        title="Disable login for this customer?"
        description={
          <>
            <span className="text-white">{disableTarget?.name || "Customer"}</span> will not be able to sign in
            until re-enabled by an admin.
          </>
        }
        confirmLabel="Disable account"
        variant="danger"
        loading={toggleActive.isPending}
        onCancel={() => setDisableTarget(null)}
        onConfirm={() => {
          if (!disableTarget) return;
          void toggleActive.mutate({ id: disableTarget.id, isActive: false });
        }}
      />
    </>
  );
}
