import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@shared/lib/api';
import type {
  PaginatedResponse,
  ProductWithVariants,
  ProductDetailResponse,
  CategoryTree,
  OrderFormData,
} from '@shared/types';

const PRODUCTS_KEY = ['products'];
const CATEGORIES_KEY = ['categories'];

export function useProducts(filters?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined) params.set(k, String(v));
        });
      }
      return apiFetch<PaginatedResponse<ProductWithVariants>>(`/products?${params}`);
    },
  });
}

export function useInfiniteProducts(filters?: Record<string, string | number | undefined>) {
  return useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: '20' });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined) params.set(k, String(v));
        });
      }
      return apiFetch<PaginatedResponse<ProductWithVariants>>(`/products?${params}`);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiFetch<ProductDetailResponse>(`/products/${slug}`),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => apiFetch<{ data: CategoryTree[] }>('/categories'),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategoryProducts(slug: string) {
  return useInfiniteQuery({
    queryKey: ['category-products', slug],
    queryFn: ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: String(pageParam), limit: '20' });
      return apiFetch<{ data: { category: unknown; products: ProductWithVariants[] }; pagination: PaginatedResponse<unknown>['pagination'] }>(`/categories/${slug}?${params}`);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!slug,
  });
}

export function useSearch(q: string, filters?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['search', q, filters],
    queryFn: () => {
      const params = new URLSearchParams({ q });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined) params.set(k, String(v));
        });
      }
      return apiFetch<PaginatedResponse<ProductWithVariants>>(`/search?${params}`);
    },
    enabled: q.length > 0,
  });
}

export function useQuickSearch(q: string) {
  return useQuery({
    queryKey: ['quick-search', q],
    queryFn: () => {
      const params = new URLSearchParams({ q, maxResults: '5' });
      return apiFetch<PaginatedResponse<ProductWithVariants>>(`/search?${params}`);
    },
    enabled: q.length >= 2,
    staleTime: 1000 * 30,
  });
}

export function useSubmitOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderFormData) =>
      apiFetch<{ data: { orderId: number }; message: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useLogEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { event: string; productId?: number; metadata?: Record<string, unknown> }) =>
      apiFetch('/analytics', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {},
  });
}
