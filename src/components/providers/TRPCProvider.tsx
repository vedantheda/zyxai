'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import superjson from 'superjson';

import { type AppRouter } from '@/server/api/root';
import { useAuth } from '@/contexts/AuthContext';

export const api = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity, // Never consider data stale
        gcTime: Infinity, // Never garbage collect
        retry: false, // No retries
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false, // No automatic refetching
        refetchIntervalInBackground: false,
        notifyOnChangeProps: [], // Don't notify on any prop changes
      },
    },
  }));

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          maxURLLength: 2048,
          transformer: superjson,
          headers() {
            const headers: Record<string, string> = {};

            // Add auth header if user is logged in
            if (user) {
              // Note: In a real app, you'd get the actual session token
              // For now, we'll use a placeholder
              headers.authorization = `Bearer ${user.id}`;
            }

            return headers;
          },
          // Simple fetch - no custom timeout bullshit
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  );
}
