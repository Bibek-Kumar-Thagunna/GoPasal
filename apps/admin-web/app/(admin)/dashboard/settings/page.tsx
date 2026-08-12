"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  fetchAdminConfigs,
  fetchAdminFeatureFlags,
  patchAdminFeatureFlag,
  seedAdminFeatureFlags,
  upsertAdminConfig,
  type AdminFeatureFlag,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { useToast } from "@/lib/toast";

type SysRow = {
  key: string;
  value: unknown;
  description?: string | null;
};

export default function SettingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { canManageSystemConfig } = useAdminCapabilities();
  const [editing, setEditing] = useState<SysRow | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-configs"],
    queryFn: fetchAdminConfigs,
    enabled: canManageSystemConfig,
  });

  const flagsQuery = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: fetchAdminFeatureFlags,
    enabled: canManageSystemConfig,
  });

  const seedFlags = useMutation({
    mutationFn: seedAdminFeatureFlags,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast.success("Default feature flags ready.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleFlag = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      patchAdminFeatureFlag(key, isEnabled),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast.success("Feature flag updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const flags = (Array.isArray(flagsQuery.data) ? flagsQuery.data : []) as AdminFeatureFlag[];

  const save = useMutation({
    mutationFn: () =>
      upsertAdminConfig(editing!.key, JSON.parse(draftValue || "null")),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-configs"] });
      toast.success(`Updated ${editing?.key}.`);
      setEditing(null);
      setSaveDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => (Array.isArray(data) ? data : []) as SysRow[], [data]);

  const handlePrepareSave = () => {
    try {
      JSON.parse(draftValue || "null");
    } catch {
      toast.error("Fix JSON syntax before saving.");
      return;
    }
    setSaveDialogOpen(true);
  };

  if (!canManageSystemConfig) {
    return (
      <>
        <PageHero
          crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]}
          icon={Settings}
          title="System configuration"
          description="Feature flags & tunable knobs — API access is limited to Super Admins."
        />
        <div className="glass-panel rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-8 text-[14px] leading-relaxed text-amber-50">
          This workspace list is empty for your role: `/admin/configs` requires{" "}
          <span className="font-semibold text-white">SUPER_ADMIN</span>. Operators should rely on
          defaults or request changes through governance.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Settings" }]}
        icon={Settings}
        title="System configuration"
        description="Feature flags & tunable knobs (JSON-backed). Changes are audit-logged server-side."
      />

      <div className="glass-panel mb-6 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <div>
            <h2 className="admin-heading-section">Feature flags</h2>
            <p className="mt-1 text-[13px] text-white/45">
              Toggle platform capabilities. Sellers only see GoPasal fleet delivery when{" "}
              <span className="font-mono text-violet-200">platform_delivery_enabled</span> is on.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void seedFlags.mutate()}
            disabled={seedFlags.isPending}
            className="rounded-xl border border-white/12 px-3 py-1.5 text-[13px]"
          >
            Seed defaults
          </button>
        </div>
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[12px] uppercase text-white/40">
              <th className="px-5 py-3.5">Flag</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5 text-right">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {flagsQuery.isLoading ? (
              <AdminTableSkeleton cols={3} rows={3} />
            ) : flags.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-white/45">
                  No flags yet — click Seed defaults.
                </td>
              </tr>
            ) : (
              flags.map((f) => (
                <tr key={f.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3.5 font-mono text-[13px] text-violet-200">{f.key}</td>
                  <td className="px-5 py-3.5 text-white/55">{f.description ?? "—"}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={toggleFlag.isPending}
                      onClick={() =>
                        void toggleFlag.mutate({ key: f.key, isEnabled: !f.isEnabled })
                      }
                      className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                        f.isEnabled
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {f.isEnabled ? "ON" : "OFF"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[12px] uppercase text-white/40">
              <th className="px-5 py-3.5">Key</th>
              <th className="px-5 py-3.5">Value</th>
              <th className="px-5 py-3.5 text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableSkeleton cols={3} rows={8} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-white/45">
                  Empty config table — add keys via API or drizzle seed.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3.5 font-mono text-[13px] text-violet-200">
                    {r.key}
                  </td>
                  <td className="max-w-xl px-5 py-3.5 text-white/60">
                    <pre className="whitespace-pre-wrap break-all text-[12px] leading-relaxed">
                      {typeof r.value === "string"
                        ? r.value
                        : JSON.stringify(r.value)}
                    </pre>
                    {r.description ? (
                      <p className="mt-1 text-[12px] text-white/35">{r.description}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(r);
                        setDraftValue(
                          typeof r.value === "string"
                            ? JSON.stringify(r.value)
                            : JSON.stringify(r.value, null, 2)
                        );
                      }}
                      className="rounded-lg border border-white/12 px-3 py-1.5 text-[13px]"
                    >
                      JSON
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6">
            <h3 className="admin-heading-section">
              Edit {editing.key}
            </h3>
            <textarea
              rows={14}
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              className="glass-input mt-4 w-full resize-none p-3 font-mono text-[13px]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setSaveDialogOpen(false);
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-[14px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={save.isPending}
                onClick={handlePrepareSave}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-[14px] font-semibold text-white"
              >
                Save…
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={saveDialogOpen && editing !== null}
        title={`Persist ${editing?.key}?`}
        description={
          <>
            Updating live configuration can change checkout, fees, or rider assignment immediately.
            Double-check JSON with another operator when possible.
          </>
        }
        confirmLabel="Commit change"
        variant="danger"
        loading={save.isPending}
        onCancel={() => setSaveDialogOpen(false)}
        onConfirm={() => void save.mutate()}
      />
    </>
  );
}
