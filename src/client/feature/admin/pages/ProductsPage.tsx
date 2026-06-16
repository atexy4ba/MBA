import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import { apiFetch } from '@shared/lib/api';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { toast } from 'sonner';
import type { Product, Category, PaginatedResponse } from '@shared/types';

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  archived: 'Archivé',
};

const LIMIT = 20;

export function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch<{ data: Category[] }>('/admin/categories'),
    staleTime: 1000 * 60 * 10,
  });

  const filters: Record<string, string | number | undefined> = {
    page,
    limit: LIMIT,
    ...(search ? { search } : {}),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined) params.set(k, String(v));
      });
      return apiFetch<PaginatedResponse<Product>>(`/admin/products?${params}`);
    },
  });

  const products = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  const archiveMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Produit archivé');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    setCategoryId(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    setStatusFilter(e.target.value);
  };

  const categories = categoriesData?.data ?? [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl text-charcoal-900">Produits</h1>
        <Button onClick={() => navigate({ to: '/admin/produits/new' })}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un produit
        </Button>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryId}
          onChange={handleCategoryChange}
          className="px-4 py-2.5 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-charcoal-700"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-4 py-2.5 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-charcoal-700"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="archived">Archivé</option>
        </select>
      </form>

      {/* Error */}
      {isError && (
        <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 mb-6">
          {(error as Error)?.message || 'Erreur lors du chargement des produits.'}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 overflow-hidden">
          <div className="divide-y divide-charcoal-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && products.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-charcoal-200">
          <p className="text-charcoal-500 text-sm">Aucun produit</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && products.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-charcoal-50/80 border-b border-charcoal-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Catégorie</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Prix</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal-600">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-charcoal-600">Statut</th>
                  <th className="text-right px-4 py-3 font-medium text-charcoal-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-charcoal-50/50 transition-colors">
                    <td className="px-4 py-3 text-charcoal-900 font-medium max-w-[200px] truncate">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-charcoal-500 font-mono text-xs max-w-[150px] truncate">
                      {product.slug}
                    </td>
                    <td className="px-4 py-3 text-charcoal-600">
                      {product.categoryId}
                    </td>
                    <td className="px-4 py-3 text-charcoal-500">—</td>
                    <td className="px-4 py-3 text-charcoal-500">—</td>
                    <td className="px-4 py-3">
                      <Badge color={product.status === 'active' ? 'green' : 'charcoal'}>
                        {STATUS_LABELS[product.status] ?? product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/produits/$id/edit"
                          params={{ id: String(product.id) }}
                          className="text-sm text-charcoal-600 hover:text-accent transition-colors font-medium"
                        >
                          Modifier
                        </Link>
                        {product.status === 'active' && (
                          <button
                            onClick={() => {
                              if (confirm('Archiver ce produit ?')) {
                                archiveMutation.mutate(product.id);
                              }
                            }}
                            disabled={archiveMutation.isPending}
                            className="text-sm text-charcoal-400 hover:text-red-600 transition-colors"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-charcoal-200 bg-charcoal-50">
              <p className="text-xs text-charcoal-500">
                {pagination?.total ?? 0} résultat{(pagination?.total ?? 0) !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="text-charcoal-400 text-xs">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                          p === page
                            ? 'bg-charcoal-900 text-white'
                            : 'text-charcoal-600 hover:bg-charcoal-200'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
