import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white text-charcoal-900">
        <h1 className="font-heading text-3xl p-8">Made by Algerians</h1>
      </div>
    </QueryClientProvider>
  );
}
