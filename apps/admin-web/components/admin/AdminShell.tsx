"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "GoPasal Command Center — Operations & Platform Admin",
  "/dashboard/search": "Global Platform Search — GoPasal Admin",
  "/dashboard/users": "User Directory & Access Control — GoPasal Admin",
  "/dashboard/sellers": "Merchant Approvals & Store Operations — GoPasal Admin",
  "/dashboard/products": "Global Product Directory & Catalog — GoPasal Admin",
  "/dashboard/orders": "Order Monitoring & Real-Time Audits — GoPasal Admin",
  "/dashboard/delivery": "Logistics & Delivery Dispatch — GoPasal Admin",
  "/dashboard/disputes": "Dispute Resolution & Claims — GoPasal Admin",
  "/dashboard/payments": "Payouts & Settlement Ledger — GoPasal Admin",
  "/dashboard/analytics": "Platform Analytics & Growth — GoPasal Admin",
  "/dashboard/promotions": "Campaigns & Promotions Engine — GoPasal Admin",
  "/dashboard/tiers": "Customer & Seller Tiers — GoPasal Admin",
  "/dashboard/reviews": "Customer Reviews & Moderation — GoPasal Admin",
  "/dashboard/notifications": "System Notifications & Broadcasts — GoPasal Admin",
  "/dashboard/reports": "Audits & Financial Reports — GoPasal Admin",
  "/dashboard/settings": "System Configuration & Security — GoPasal Admin",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document !== "undefined") {
      const pageTitle = ROUTE_TITLES[pathname] || "GoPasal Command Center — Operations & Platform Admin";
      document.title = pageTitle;
      
      const head = document.getElementsByTagName("head")[0];
      if (head) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
          link.href = "/favicon.png";
        } else {
          link = document.createElement("link");
          link.rel = "icon";
          link.href = "/favicon.png";
          head.appendChild(link);
        }
      }
    }
  }, [pathname]);
  return (
    <RequireAuth>
      <div className="relative flex min-h-screen bg-gp-navy">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
          <div className="absolute -left-[20%] top-[-10%] h-[520px] w-[520px] rounded-full bg-sky-500/12 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-sky-600/10 blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(-35deg, transparent, transparent 140px, rgba(56,189,248,0.25) 140px, rgba(56,189,248,0.25) 142px)",
            }}
          />
        </div>

        <Sidebar />
        <div className="relative z-10 flex min-h-screen flex-1 flex-col pl-[260px]">
          <TopBar />
          <main
            id="main-content"
            className="flex-1 overflow-auto overflow-admin-scroll px-6 py-7 lg:px-8 lg:py-8 xl:px-10"
            tabIndex={-1}
          >
            <div className="mx-auto w-full max-w-[1720px]">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
