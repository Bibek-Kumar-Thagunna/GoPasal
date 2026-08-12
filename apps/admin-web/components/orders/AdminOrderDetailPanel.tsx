"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { fetchAdminOrderDetail, type AdminOrderDetail } from "@/lib/api";
import { orderFulfillmentLabel } from "@/lib/fulfillment-labels";

type AdminOrderDetailPanelProps = {
  orderId: string | null;
  onClose: () => void;
};

export function AdminOrderDetailPanel({ orderId, onClose }: AdminOrderDetailPanelProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-order-detail", orderId],
    enabled: Boolean(orderId),
    queryFn: () => fetchAdminOrderDetail(orderId!),
  });

  if (!orderId) return null;

  const order = data as AdminOrderDetail | undefined;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <div className="glass-panel flex h-full w-full max-w-lg flex-col border-l border-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] p-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-sky-300/90">
              Order detail
            </p>
            <h2 className="admin-heading-section mt-1 font-mono text-[14px]">
              {orderId.length > 22 ? `${orderId.slice(0, 22)}…` : orderId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-admin-scroll p-5">
          {isLoading ? (
            <p className="text-[14px] text-white/50">Loading order…</p>
          ) : isError ? (
            <p className="text-[14px] text-rose-300">{(error as Error).message}</p>
          ) : order ? (
            <div className="space-y-4 text-[14px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <p className="text-white/40">Status</p>
                  <p className="mt-1 font-semibold text-white">{order.status}</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] p-3">
                  <p className="text-white/40">Payment</p>
                  <p className="mt-1 font-semibold text-white">
                    {order.paymentStatus} · {order.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{order.storeName}</p>
                <p className="text-white/50">{orderFulfillmentLabel(order.fulfillmentType)}</p>
                <p className="mt-2 font-mono text-emerald-200">Rs. {order.totalAmount}</p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <p className="text-[12px] font-semibold uppercase text-white/40">Customer</p>
                <p className="mt-1 text-white">{order.customerName ?? "—"}</p>
                <p className="text-white/55">{order.customerPhone}</p>
                {order.customerEmail ? (
                  <p className="text-white/45">{order.customerEmail}</p>
                ) : null}
              </div>

              {order.notes ? (
                <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-amber-100">
                  Notes: {order.notes}
                </p>
              ) : null}

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase text-white/40">Line items</p>
                <ul className="space-y-2">
                  {(order.items ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2"
                    >
                      <span className="text-white/80">
                        {item.productName}
                        {item.variantName ? ` · ${item.variantName}` : ""} × {item.quantity}
                      </span>
                      <span className="font-mono text-white/60">{item.priceAtPurchase}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[12px] text-white/35">
                Placed {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
