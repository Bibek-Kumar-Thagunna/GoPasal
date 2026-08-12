import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmDialog } from '../components/ConfirmDialog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 3 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children as any}
      <ConfirmDialog />
    </QueryClientProvider>
  );
}
