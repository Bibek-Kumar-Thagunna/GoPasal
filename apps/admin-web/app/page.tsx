"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [ready, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gp-navy">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
    </div>
  );
}
