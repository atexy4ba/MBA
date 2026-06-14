import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import { apiFetch } from '@shared/lib/api';
import { formatPrice } from '@shared/lib/utils';
import { Button } from '@shared/components/Button';
import { Skeleton } from '@shared/components/Skeleton';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

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
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: number;
  variantId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  productName: string;
  productSlug: string;
  color: string;
  size: string;
  sku: string;
}

interface StatusHistory {
  id: number;
  orderId: number;
  status: string;
  note: string | null;
  changedBy: string;
  createdAt: string;
}

interface OrderDetail {
  order: Order;
  items: OrderItem[];
  statusHistory: StatusHistory[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-red-50 text-accent border-red-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-charcoal-100 text-charcoal-500 border-charcoal-200',
};

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: Package,
  cancelled: XCircle,
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'shipped', 'delivered', 'cancelled'],
  confirmed: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['cancelled'],
  cancelled: ['confirmed'],
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${STATUS_BADGE[status] || STATUS_BADGE.pending}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-charcoal-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="bg-white border border-charcoal-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-charcoal-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams({ from: '/admin-layout/admin/commandes/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => apiFetch<{ data: OrderDetail }>(`/admin/orders/${id}`),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (body: { status: string; note?: string }) =>
      apiFetch(`/admin/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Statut mis à jour');
      setNewStatus('');
      setStatusNote('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    },
  });

  if (isLoading) {
    return (
      <div>
        <OrderDetailSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-charcoal-500 mb-4">
          {(error as Error)?.message || 'Commande introuvable.'}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const { order, items, statusHistory } = data.data;
  const currentStatus = order.status;
  const availableStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
  const orderTotal = items.reduce(
    (sum, item) => sum + parseFloat(item.unitPrice) * item.quantity,
    0,
  );

  function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newStatus) return;
    statusMutation.mutate({
      status: newStatus,
      note: statusNote.trim() || undefined,
    });
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/admin/commandes' })}
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux commandes
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl text-charcoal-900">
            #{order.id}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-charcoal-400">
          Créée le{' '}
          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <div className="bg-white border border-charcoal-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-charcoal-100">
              <h2 className="font-medium text-charcoal-900">Articles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-charcoal-50 border-b border-charcoal-100">
                    <th className="text-left px-5 py-3 font-medium text-charcoal-500">Produit</th>
                    <th className="text-left px-5 py-3 font-medium text-charcoal-500">Variante</th>
                    <th className="text-left px-5 py-3 font-medium text-charcoal-500">SKU</th>
                    <th className="text-center px-5 py-3 font-medium text-charcoal-500">Qté</th>
                    <th className="text-right px-5 py-3 font-medium text-charcoal-500">Prix unit.</th>
                    <th className="text-right px-5 py-3 font-medium text-charcoal-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3.5 font-medium text-charcoal-900">
                        {item.productName}
                      </td>
                      <td className="px-5 py-3.5 text-charcoal-500">
                        {item.color}
                        {item.size && ` / ${item.size}`}
                      </td>
                      <td className="px-5 py-3.5 text-charcoal-400 font-mono text-xs">
                        {item.sku}
                      </td>
                      <td className="px-5 py-3.5 text-center text-charcoal-900">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-right text-charcoal-600 tabular-nums">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-charcoal-900 tabular-nums">
                        {formatPrice(
                          parseFloat(item.unitPrice) * item.quantity,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-charcoal-200 bg-charcoal-50 flex justify-between items-center">
              <span className="text-sm font-medium text-charcoal-700">Total commande</span>
              <span className="text-lg font-bold text-charcoal-900 tabular-nums">
                {formatPrice(orderTotal)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white border border-charcoal-200 rounded-xl p-5">
              <h2 className="font-medium text-charcoal-900 mb-2">Notes</h2>
              <p className="text-sm text-charcoal-600 whitespace-pre-wrap">
                {order.notes}
              </p>
            </div>
          )}

          {/* Status timeline */}
          <div className="bg-white border border-charcoal-200 rounded-xl p-5">
            <h2 className="font-medium text-charcoal-900 mb-4">
              Historique des statuts
            </h2>
            {statusHistory.length === 0 ? (
              <p className="text-sm text-charcoal-400">
                Aucun historique disponible.
              </p>
            ) : (
              <div className="relative">
                {statusHistory.map((entry, index) => {
                  const Icon = STATUS_ICON[entry.status] || Clock;
                  const isLast = index === statusHistory.length - 1;

                  return (
                    <div key={entry.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${
                            index === 0
                              ? 'bg-accent border-accent text-white'
                              : 'bg-charcoal-100 border-charcoal-200 text-charcoal-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 flex-1 bg-charcoal-200 my-1" />
                        )}
                      </div>
                      <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-charcoal-900">
                            {STATUS_LABELS[entry.status] || entry.status}
                          </span>
                          <span className="text-xs text-charcoal-400">
                            {new Date(entry.createdAt).toLocaleDateString(
                              'fr-FR',
                              {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-charcoal-500 mt-1">
                            {entry.note}
                          </p>
                        )}
                        <p className="text-xs text-charcoal-400 mt-0.5">
                          Par {entry.changedBy}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white border border-charcoal-200 rounded-xl p-5">
            <h2 className="font-medium text-charcoal-900 mb-3">Client</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-charcoal-400 block text-xs">Nom</span>
                <span className="text-charcoal-900 font-medium">
                  {order.customerName}
                </span>
              </div>
              <div>
                <span className="text-charcoal-400 block text-xs">Email</span>
                <span className="text-charcoal-900">{order.email}</span>
              </div>
              <div>
                <span className="text-charcoal-400 block text-xs">Téléphone</span>
                <span className="text-charcoal-900">{order.phone}</span>
              </div>
              <div>
                <span className="text-charcoal-400 block text-xs">Adresse</span>
                <span className="text-charcoal-900">
                  {order.address}
                  <br />
                  {order.zip} {order.city}
                  {order.country && order.country !== 'Algeria' && (
                    <>
                      <br />
                      {order.country}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Change status */}
          {availableStatuses.length > 0 && (
            <div className="bg-white border border-charcoal-200 rounded-xl p-5">
              <h2 className="font-medium text-charcoal-900 mb-3">
                Changer le statut
              </h2>
              <form onSubmit={handleStatusUpdate} className="space-y-3">
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="appearance-none w-full pl-3 pr-8 py-2.5 text-sm bg-white border-2 border-charcoal-200 rounded-lg focus:outline-none focus:border-accent transition-colors text-charcoal-700 cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      Sélectionner un statut
                    </option>
                    {availableStatuses.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal-400 pointer-events-none" />
                </div>
                <textarea
                  placeholder="Note (optionnel)"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-charcoal-200 rounded-lg focus:outline-none focus:border-accent transition-colors placeholder:text-charcoal-400 resize-none"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={statusMutation.isPending || !newStatus}
                >
                  {statusMutation.isPending ? 'Mise à jour...' : 'Mettre à jour'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
