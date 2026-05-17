import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 8000),
      staleTime: 3 * 60_000,
      gcTime: 30 * 60_000,
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
      networkMode: 'always',
    },
  },
});