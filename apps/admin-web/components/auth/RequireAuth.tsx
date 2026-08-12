"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gp-navy">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
