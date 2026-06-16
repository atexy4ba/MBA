import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

let refreshPromise: Promise<boolean> | null = null;

function refreshTokenOnce(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import('@client/feature/auth/stores');
      await useAuthStore.getState().refresh();
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${url}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    });
  } catch {
    throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
  }

  if (res.status === 401 && !url.startsWith('/admin/refresh') && !url.startsWith('/admin/login')) {
    const refreshed = await refreshTokenOnce();
    if (refreshed) {
      const retryRes = await fetch(`/api/v1${url}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        ...init,
      }).catch(() => null);
      if (!retryRes) {
        throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
      }
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}));
        const message = body?.error?.message || `Erreur serveur (${retryRes.status})`;
        throw new Error(message);
      }
      return retryRes.json();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    if (!body) {
      throw new Error(`Erreur serveur (${res.status}). Vérifiez que le backend est démarré.`);
    }
    const message = body?.error?.message || `Erreur serveur (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}
