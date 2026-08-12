"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 2 } } }));
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
