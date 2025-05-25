'use client';

import React from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  QueryOptions, 
  useQuery as useReactQuery
} from 'react-query';

// Create a new QueryClient instance to manage queries
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// QueryProvider component to wrap the application
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Custom hook with better TypeScript support
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<QueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useReactQuery<TData, TError>(queryKey, queryFn, options);
}

// Helper for prefetching data
export async function prefetchQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  staleTime?: number
) {
  return queryClient.prefetchQuery(queryKey, queryFn, {
    staleTime: staleTime || 5 * 60 * 1000, // 5 minutes by default
  });
}

// Helper for invalidating queries
export function invalidateQueries(queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries(queryKey);
}

// Helper for setting query data directly
export function setQueryData<TData>(
  queryKey: readonly unknown[],
  updater: TData | ((oldData: TData | undefined) => TData)
) {
  return queryClient.setQueryData<TData>(queryKey, updater);
}

// withQueryData HOC for class components
export function withQueryData<P extends object, TData>(
  Component: React.ComponentType<P & { data: TData; isLoading: boolean; error: unknown }>,
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<QueryOptions<TData, unknown>, 'queryKey' | 'queryFn'>
) {
  return function WithQueryData(props: P) {
    const { data, isLoading, error } = useOptimizedQuery<TData>(queryKey, queryFn, options);
    return <Component {...props} data={data as TData} isLoading={isLoading} error={error} />;
  };
}
