import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { apiFetch } from '@shared/lib/api';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { toast } from 'sonner';
import type { Category } from '@shared/types';

interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
}

function buildTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<number, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const c of categories) {
    map.set(c.id, { category: c, children: [] });
  }

  for (const c of categories) {
    const node = map.get(c.id)!;
    if (c.parentId !== null && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

interface CategoryFormData {
  name: string;
  slug: string;
  parentId: string;
  imageUrl: string;
  sortOrder: string;
}

const emptyForm: CategoryFormData = {
  name: '',
  slug: '',
  parentId: '',
  imageUrl: '',
  sortOrder: '0',
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch<{ data: Category[] }>('/admin/categories'),
  });

  const categories = data?.data ?? [];
  const tree = buildTree(categories);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Catégorie créée');
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      apiFetch(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Catégorie mise à jour');
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/categories/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Catégorie désactivée');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setFormError('');
  };

  const openEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId !== null ? String(cat.parentId) : '',
      imageUrl: cat.imageUrl ?? '',
      sortOrder: String(cat.sortOrder),
    });
    setEditingId(cat.id);
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.slug.trim()) {
      setFormError('Le nom et le slug sont requis');
      return;
    }

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      parentId: form.parentId ? Number(form.parentId) : null,
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getParentName = (parentId: number | null) => {
    if (parentId === null) return '—';
    const parent = categories.find((c) => c.id === parentId);
    return parent?.name ?? '—';
  };

  const renderNode = (node: CategoryTreeNode, depth: number) => {
    const cat = node.category;
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(cat.id);

    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-3 px-4 py-3 hover:bg-charcoal-50/50 transition-colors"
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(cat.id)}
              className="p-0.5 text-charcoal-400 hover:text-charcoal-700 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-charcoal-900 truncate">{cat.name}</span>
              <span className="text-xs text-charcoal-400 font-mono truncate hidden sm:inline">
                /{cat.slug}
              </span>
            </div>
          </div>

          <div className="hidden md:block flex-1 text-sm text-charcoal-500">
            {getParentName(cat.parentId)}
          </div>

          <Badge color={cat.isActive ? 'green' : 'charcoal'}>
            {cat.isActive ? 'Actif' : 'Inactif'}
          </Badge>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openEdit(cat)}
              className="p-1.5 text-charcoal-400 hover:text-accent transition-colors rounded-lg hover:bg-charcoal-100"
              title="Modifier"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            {cat.isActive && (
              <button
                onClick={() => {
                  if (confirm(`Désactiver la catégorie "${cat.name}" ?`)) {
                    deactivateMutation.mutate(cat.id);
                  }
                }}
                disabled={deactivateMutation.isPending}
                className="p-1.5 text-charcoal-400 hover:text-red-600 transition-colors rounded-lg hover:bg-charcoal-100"
                title="Désactiver"
              >
                <Archive className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="divide-y divide-charcoal-100">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-heading text-2xl text-charcoal-900">Catégories</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une catégorie
        </Button>
      </div>

      {/* Error */}
      {isError && (
        <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 mb-6">
          {(error as Error)?.message || 'Erreur lors du chargement des catégories.'}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-charcoal-200">
          <div className="divide-y divide-charcoal-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-charcoal-200 mb-6">
          <h2 className="font-heading text-lg text-charcoal-900 mb-4">
            {editingId !== null ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>

          {formError && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nom"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom de la catégorie"
                required
              />
              <Input
                label="Slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="slug-de-la-categorie"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-charcoal-700">Catégorie parente</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-white border-2 border-charcoal-200 rounded-lg focus:outline-none focus:border-accent text-charcoal-700"
                >
                  <option value="">Aucune (racine)</option>
                  {categories
                    .filter((c) => c.parentId === null && c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <Input
                label="Ordre"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>

            <Input
              label="URL de l'image"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
            />

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Enregistrement...'
                  : editingId !== null
                    ? 'Mettre à jour'
                    : 'Créer'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories tree */}
      {!isLoading && !isError && tree.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-charcoal-200">
          <p className="text-charcoal-500 text-sm">Aucune catégorie</p>
        </div>
      )}

      {!isLoading && !isError && tree.length > 0 && (
        <div className="bg-white rounded-xl border border-charcoal-200 overflow-hidden">
          <div className="divide-y divide-charcoal-100">
            {tree.map((node) => renderNode(node, 0))}
          </div>
        </div>
      )}
    </div>
  );
}
