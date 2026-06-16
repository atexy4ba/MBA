import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { queryClient, apiFetch } from '@shared/lib/api';
import { useAuthStore } from '@client/feature/auth/stores';
import { ErrorBoundary } from '@shared/components';
import { router } from './router';
import './index.css';

function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = useAuthStore.getState();
    if (store.refreshToken) {
      apiFetch<{ data: { refreshToken: string } }>('/admin/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: store.refreshToken }),
      })
        .then((res) => {
          useAuthStore.setState({
            isAuthenticated: true,
            refreshToken: res.data.refreshToken,
          });
        })
        .catch(() => {
          useAuthStore.setState({ refreshToken: null, isAuthenticated: false });
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-50">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f5f5f5',
              border: '1px solid #333',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
