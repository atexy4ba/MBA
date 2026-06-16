import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { TrendingUp, Clock, AlertTriangle, ShoppingBag, Package } from 'lucide-react';
import { Skeleton } from '@shared/components/Skeleton';
import { formatPrice } from '@shared/lib/utils';
import { apiFetch } from '@shared/lib/api';

interface RecentOrder {
  id: number;
  customerName: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

interface LowStockVariant {
  id: number;
  productName: string;
  color: string;
  size: string;
  stock: number;
}

interface AnalyticsData {
  pendingOrders: number;
  todayOrders: number;
  totalRevenue: number;
  outOfStock: number;
  recentOrders: RecentOrder[];
  lowStockVariants: LowStockVariant[];
}

interface AnalyticsResponse {
  data: AnalyticsData;
}

const STATUS_LABELS: Record<RecentOrder['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<RecentOrder['status'], string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-charcoal-100 text-charcoal-500 border-charcoal-200 line-through',
};

function StatusBadge({ status }: { status: RecentOrder['status'] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<AnalyticsResponse>({
    queryKey: ['admin-analytics'],
    queryFn: () => apiFetch<AnalyticsResponse>('/admin/analytics'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="font-heading text-xl text-charcoal-900 mb-2">Erreur de chargement</h2>
        <p className="text-sm text-charcoal-500 mb-6 max-w-sm">
          {error instanceof Error ? error.message : 'Impossible de charger les données du tableau de bord.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-lg border-2 border-charcoal-900 text-charcoal-900 hover:bg-charcoal-50 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const analytics = data?.data;
  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-12 w-12 text-charcoal-300 mb-4" />
        <h2 className="font-heading text-xl text-charcoal-900 mb-2">Aucune donnée</h2>
        <p className="text-sm text-charcoal-500">
          Les statistiques apparaîtront ici une fois les premières commandes passées.
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Aujourd'hui",
      value: analytics.todayOrders,
      icon: ShoppingBag,
      borderColor: 'border-l-green-500',
      bgIcon: 'bg-green-50 text-green-600',
    },
    {
      label: 'En attente',
      value: analytics.pendingOrders,
      icon: Clock,
      borderColor: 'border-l-accent',
      bgIcon: 'bg-red-50 text-accent',
    },
    {
      label: 'Rupture de stock',
      value: analytics.outOfStock,
      icon: AlertTriangle,
      borderColor: 'border-l-charcoal-700',
      bgIcon: 'bg-charcoal-100 text-charcoal-700',
    },
    {
      label: 'Revenu total',
      value: formatPrice(analytics.totalRevenue),
      icon: TrendingUp,
      borderColor: 'border-l-charcoal-700',
      bgIcon: 'bg-charcoal-900 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, borderColor, bgIcon }) => (
          <article
            key={label}
            className={`bg-white rounded-xl border border-charcoal-200 border-l-4 ${borderColor} p-5 flex items-start gap-4`}
            aria-label={`${label}: ${value}`}
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${bgIcon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-charcoal-400 uppercase tracking-wider mb-1">
                {label}
              </p>
              <p className="font-heading text-2xl text-charcoal-900 truncate">
                {value}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-charcoal-200 p-6">
        <h2 className="font-heading text-lg text-charcoal-900 mb-4">Commandes récentes</h2>
        {analytics.recentOrders.length === 0 ? (
          <p className="text-sm text-charcoal-400 py-6 text-center">Aucune commande récente.</p>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {analytics.recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-charcoal-100 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-charcoal-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal-900 truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-charcoal-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-charcoal-200 p-6">
          <h2 className="font-heading text-lg text-charcoal-900 mb-4">Produits en alerte</h2>
          {analytics.lowStockVariants.length === 0 ? (
            <p className="text-sm text-charcoal-400 py-6 text-center">
              Tous les produits sont en stock.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-200">
                    <th className="text-left text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3 pr-4">
                      Produit
                    </th>
                    <th className="text-left text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3 pr-4">
                      Variante
                    </th>
                    <th className="text-right text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {analytics.lowStockVariants.map((v) => (
                    <tr key={v.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-charcoal-900 truncate max-w-[180px]">
                          {v.productName}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-charcoal-500">
                        {v.color} / {v.size}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
                            v.stock === 0
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {v.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-charcoal-200 p-6">
          <h2 className="font-heading text-lg text-charcoal-900 mb-4">Dernières commandes</h2>
          {analytics.recentOrders.length === 0 ? (
            <p className="text-sm text-charcoal-400 py-6 text-center">
              Aucune commande pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-200">
                    <th className="text-left text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3 pr-4">
                      N°
                    </th>
                    <th className="text-left text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3 pr-4">
                      Client
                    </th>
                    <th className="text-left text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3 pr-4">
                      Date
                    </th>
                    <th className="text-right text-xs font-medium text-charcoal-400 uppercase tracking-wider py-3">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {analytics.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-charcoal-50/50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          to="/admin/commandes/$id"
                          params={{ id: String(order.id) }}
                          className="font-mono text-xs text-charcoal-400 hover:text-accent transition-colors"
                        >
                          #{order.id}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-charcoal-900 truncate max-w-[140px]">
                          {order.customerName}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-charcoal-500 text-xs whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 text-right">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
