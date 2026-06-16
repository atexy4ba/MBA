import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { apiFetch } from '@shared/lib/api';
import { formatPrice } from '@shared/lib/utils';
import { Button } from '@shared/components/Button';
import { Skeleton } from '@shared/components/Skeleton';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedResponse } from '@shared/types';

interface Order {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  notes: string | null;
  total: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_BADGE: Record<Order['status'], string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-charcoal-100 text-charcoal-500 border-charcoal-200 line-through',
};

function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_BADGE[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const LIMIT = 20;

export function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-orders', { page, status, search, dateFrom, dateTo }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return apiFetch<PaginatedResponse<Order>>(`/admin/orders?${params}`);
    },
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(newStatus: string) {
    setPage(1);
    setStatus(newStatus);
  }

  function handleClearFilters() {
    setStatus('');
    setSearch('');
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const hasActiveFilters = status || search || dateFrom || dateTo;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl text-charcoal-900">Commandes</h1>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72" role="search" aria-label="Rechercher une commande">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Rechercher client, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-charcoal-50/50 border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all duration-200 placeholder:text-charcoal-400"
          />
        </form>
      </div>

      {/* Filter bar */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Filtrer par statut"
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 text-charcoal-700 cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-charcoal-600 bg-white ring-1 ring-inset ring-charcoal-200 rounded-xl hover:ring-charcoal-300 hover:bg-charcoal-50/50 transition-all duration-200"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
            Date
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-accent hover:text-accent-hover font-medium"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div>
              <label className="block text-xs text-charcoal-500 mb-1">Du</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs text-charcoal-500 mb-1">Au</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-charcoal-50/80 border-b border-charcoal-100">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-100">
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))}

              {!isLoading &&
                !isError &&
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-charcoal-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-charcoal-400 text-xs">
                      #{order.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-charcoal-900">{order.customerName}</div>
                      <div className="text-xs text-charcoal-400">{order.email}</div>
                    </td>
                    <td className="px-4 py-4 text-charcoal-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-charcoal-900 tabular-nums">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate({
                            to: '/admin/commandes/$id',
                            params: { id: String(order.id) },
                          })
                        }
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Error */}
        {isError && (
          <div className="px-4 py-12 text-center">
            <p className="text-charcoal-500">
              {(error as Error)?.message || 'Erreur lors du chargement des commandes.'}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && orders.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-charcoal-900 font-medium">Aucune commande trouvée</p>
            <p className="text-sm text-charcoal-400 mt-1">
              {hasActiveFilters
                ? 'Essayez de modifier les filtres.'
                : 'Les nouvelles commandes apparaîtront ici.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && orders.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-charcoal-500">
            Page {page} sur {totalPages}
            {pagination && ` (${pagination.total} commande${pagination.total > 1 ? 's' : ''})`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-charcoal-600 bg-white ring-1 ring-inset ring-charcoal-200 rounded-xl hover:ring-charcoal-300 hover:bg-charcoal-50/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-charcoal-600 bg-white ring-1 ring-inset ring-charcoal-200 rounded-xl hover:ring-charcoal-300 hover:bg-charcoal-50/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
