"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  Mail,
  Megaphone,
  MessageSquareWarning,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHero } from "@/components/admin/PageHero";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import {
  broadcastAdminNotification,
  sendAdminNotification,
} from "@/lib/api";
import { useToast } from "@/lib/toast";

import type { LucideIcon } from "lucide-react";

const OPS_LINKS: {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/dashboard/disputes",
    label: "Disputes & refunds",
    detail: "Send manual messages after closing tickets; COD reversals originate here.",
    icon: MessageSquareWarning,
  },
  {
    href: "/dashboard/promotions",
    label: "Coupons push",
    detail: "Growth drops (WELCOME*, festival codes) tied to lifecycle email later.",
    icon: Megaphone,
  },
  {
    href: "/dashboard/tiers",
    label: "Membership messaging",
    detail: "Expiring tiers — export CSV from Tiers tab for drip campaigns.",
    icon: Sparkles,
  },
  {
    href: "/dashboard/users",
    label: "Buyer segments",
    detail: "Support CSV exports → CRM / Meta custom audiences once consent flows ship.",
    icon: Users,
  },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [broadcastLimit, setBroadcastLimit] = useState("500");

  const sendM = useMutation({
    mutationFn: () =>
      sendAdminNotification({
        userId: userId.trim() || undefined,
        phone: phone.trim() || undefined,
        title: title.trim(),
        message: message.trim(),
        type: "INFO",
      }),
    onSuccess: () => {
      toast.success("Notification sent.");
      setTitle("");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const broadcastM = useMutation({
    mutationFn: () =>
      broadcastAdminNotification({
        title: title.trim(),
        message: message.trim(),
        type: "INFO",
        limit: Number(broadcastLimit) || 500,
      }),
    onSuccess: (res) => {
      toast.success(`Broadcast sent to ${res.sent} users.`);
      setTitle("");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/dashboard" }, { label: "Notifications" }]}
        icon={Bell}
        title="Lifecycle & messaging"
        description="Send in-app notifications to one user (by id or phone) or broadcast to active users."
      />

      <div className="glass-panel mb-8 rounded-2xl border border-white/[0.07] p-6">
        <AdminSectionHeader
          variant="standalone"
          icon={Send}
          title="Send in-app notification"
          description="Delivered immediately to the customer/seller notification inbox."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-[13px] text-white/50">
            User ID (optional)
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="glass-input mt-1 h-11 w-full text-[14px]"
              placeholder="usr_…"
            />
          </label>
          <label className="block text-[13px] text-white/50">
            Phone (optional)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input mt-1 h-11 w-full text-[14px]"
              placeholder="+977…"
            />
          </label>
          <label className="block text-[13px] text-white/50 sm:col-span-2">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input mt-1 h-11 w-full text-[14px]"
            />
          </label>
          <label className="block text-[13px] text-white/50 sm:col-span-2">
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="glass-input mt-1 w-full resize-y text-[14px]"
            />
          </label>
          <label className="block text-[13px] text-white/50">
            Broadcast cap
            <input
              value={broadcastLimit}
              onChange={(e) => setBroadcastLimit(e.target.value)}
              type="number"
              min={1}
              max={2000}
              className="glass-input mt-1 h-11 w-full text-[14px]"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canSend || (!userId.trim() && !phone.trim()) || sendM.isPending}
            onClick={() => sendM.mutate()}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
          >
            {sendM.isPending ? "Sending…" : "Send to user"}
          </button>
          <button
            type="button"
            disabled={!canSend || broadcastM.isPending}
            onClick={() => broadcastM.mutate()}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-[14px] font-semibold text-amber-100 disabled:opacity-40"
          >
            {broadcastM.isPending ? "Broadcasting…" : "Broadcast (capped)"}
          </button>
        </div>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {OPS_LINKS.map(({ href, label, detail, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group glass-panel rounded-2xl border border-white/[0.06] p-6 transition hover:border-violet-500/30 hover:bg-white/[0.03]"
          >
            <Icon className="h-9 w-9 text-violet-200/70 transition group-hover:text-violet-100" aria-hidden />
            <p className="mt-4 admin-heading-section">{label}</p>
            <p className="admin-copy-lead mt-2">{detail}</p>
            <span className="mt-5 inline-flex text-[13px] font-semibold text-sky-300 group-hover:text-sky-200">
              Open workspace →
            </span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel lg:col-span-2 rounded-2xl border border-white/[0.07] p-6">
          <AdminSectionHeader
            variant="standalone"
            icon={Send}
            title="Template backlog"
            description="Planned lifecycle touchpoints before ESP integration — keep copy aligned with Disputes outcomes."
          />
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-white/55">
            <li>
              <Mail className="mr-2 inline h-4 w-4 align-text-bottom text-white/35" />
              OTP + passwordless receipts (reuse auth infra).
            </li>
            <li>
              <BellRing className="mr-2 inline h-4 w-4 align-text-bottom text-white/35" />
              Seller SLA nudges (late acceptance, SLA breaches).
            </li>
            <li>
              <Sparkles className="mr-2 inline h-4 w-4 align-text-bottom text-white/35" />
              Tier downgrade / churn prevention sequences.
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/14 to-transparent p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-violet-200/88">
            Guardrails
          </p>
          <p className="admin-copy-lead mt-3">
            Audience filters will respect unsubscribes per channel. Broadcasts targeting all users remain Super
            Admin–gated pending legal review for Nepal PSD / marketing rules.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-6 inline-flex text-[14px] font-semibold text-white/80 hover:text-white"
          >
            Feature flags (settings) →
          </Link>
        </div>
      </div>
    </>
  );
}
