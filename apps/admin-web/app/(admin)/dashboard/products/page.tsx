"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Search, Package } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { PageHero } from "@/components/admin/PageHero";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  fetchAdminProductStores,
  fetchAdminProducts,
  patchAdminProductActive,
  type AdminProductRow,
} from "@/lib/api";
import { useAdminCapabilities } from "@/lib/admin-capabilities";
import { downloadCsv } from "@/lib/csv-download";
import { useToast } from "@/lib/toast";

export default function ProductsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { canDeactivateCatalogRows } = useAdminCapabilities();
  const sp = useSearchParams();
  const qFromUrl = sp.get("q") ?? "";
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [storeId, setStoreId] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<AdminProductRow | null>(
    null
  );
  const [nextActive, setNextActive] = useState(false);

  useEffect(() => {
    const v = qFromUrl.trim();
    setDraftQ(v);
    setQ(v);
    setPage(1);
  }, [qFromUrl]);

  const storesQ = useQuery({
    queryKey: ["admin-product-stores"],
    queryFn: fetchAdminProductStores,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-products", page, q, storeId, includeInactive],
    queryFn: () =>
      fetchAdminProducts({
        page,
        limit: 20,
        q: q || undefined,
        storeId: storeId || undefined,
        includeInactive,
      }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchAdminProductActive(id, isActive),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(vars.isActive ? "Listing is live again." : "Listing deactivated.");
      setToggleTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.limit ?? 20))
  );

  const runSearch = () => {
    const t = draftQ.trim();
    setPage(1);
    setQ(t);
    const qs = new URLSearchParams(sp.toString());
    if (t) qs.set("q", t);
    else qs.delete("q");
    const next = qs.toString();
    router.replace(next ? `/dashboard/products?${next}` : "/dashboard/products");
  };

  const handleExportPage = () => {
    if (!items.length) return;
    downloadCsv(
      `catalog-page-${page}-${new Date().toISOString().slice(0, 10)}.csv`,
      ["name", "slug", "storeName", "basePrice", "isActive"],
      items.map((p: AdminProductRow) => ({
        name: p.name,
        slug: p.slug,
        storeName: p.storeName ?? "",
        basePrice: p.basePrice,
        isActive: p.isActive ? "yes" : "no",
      }))
    );
    toast.success("Exported current page to CSV");
  };

  const handleToggleClick = (p: AdminProductRow) => {
    if (!canDeactivateCatalogRows) {
      toast.error("Your role cannot change listing visibility.");
      return;
    }
    setToggleTarget(p);
    setNextActive(!p.isActive);
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Products" }]}
        icon={Package}
        title="Catalog moderation"
        description="Search SKU coverage, deactivate unsafe listings, tune store scope."
      />

      <div className="glass-panel mb-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[200px] flex-1 max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/30" />
            <input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Product name contains…"
              className="glass-input h-11 w-full pl-11 text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            className="rounded-xl bg-gradient-to-r from-gp-blue to-sky-500 px-5 py-2.5 text-[14px] font-semibold text-white"
          >
            Search
          </button>
          <select
            value={storeId}
            onChange={(e) => {
              setPage(1);
              setStoreId(e.target.value);
            }}
            className="glass-input h-11 min-w-[180px] text-[14px]"
          >
            <option value="">All shops</option>
            {(storesQ.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[13px] text-white/55">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setPage(1);
                setIncludeInactive(e.target.checked);
              }}
              className="rounded border-white/20"
            />
            Include inactive
          </label>
          <button
            type="button"
            disabled={!items.length}
            onClick={handleExportPage}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[14px] font-medium text-white/80 hover:bg-white/[0.07] disabled:opacity-35"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      {isError ? (
        <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[14px] text-rose-100">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="glass-panel overflow-hidden rounded-2xl">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[12px] font-semibold uppercase tracking-wider text-white/40">
              <th className="px-5 py-3.5">Product</th>
              <th className="px-5 py-3.5">Store</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Active</th>
              <th className="px-5 py-3.5 text-right">Toggle</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <AdminTableSkeleton cols={5} rows={8} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/45">
                  No catalogue rows returned.
                </td>
              </tr>
            ) : (
              items.map((p: AdminProductRow) => (
                <tr key={p.id} className="border-b border-white/[0.04]">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-[12px] text-white/40">{p.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-white/70">{p.storeName}</td>
                  <td className="px-5 py-3.5 font-mono text-emerald-200">Rs. {p.basePrice}</td>
                  <td className="px-5 py-3.5">
                    {p.isActive ? (
                      <span className="text-[12px] font-bold text-emerald-300">Yes</span>
                    ) : (
                      <span className="text-[12px] font-bold text-rose-300">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      disabled={toggle.isPending}
                      title={!canDeactivateCatalogRows ? "Role cannot toggle listings" : undefined}
                      onClick={() => handleToggleClick(p)}
                      className="rounded-lg border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[13px] disabled:opacity-40"
                    >
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex justify-between border-t border-white/[0.06] px-5 py-3.5 text-[13px] text-white/45">
          <span>
            Total {data?.total ?? 0} · Page {page}/{totalPages}
          </span>
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-white/10 px-3 py-1 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={toggleTarget !== null}
        title={
          nextActive
            ? "Activate this listing?"
            : "Deactivate this listing?"
        }
        description={
          toggleTarget ? (
            <>
              <span className="font-semibold text-white">{toggleTarget.name}</span>
              {!nextActive
                ? " will be hidden from buyers until you turn it back on."
                : " will appear in shop and search surfaces again."}
            </>
          ) : undefined
        }
        confirmLabel={nextActive ? "Activate" : "Deactivate"}
        variant={nextActive ? "default" : "danger"}
        loading={toggle.isPending}
        onCancel={() => setToggleTarget(null)}
        onConfirm={() => {
          if (!toggleTarget) return;
          void toggle.mutate({ id: toggleTarget.id, isActive: nextActive });
        }}
      />
    </>
  );
}
