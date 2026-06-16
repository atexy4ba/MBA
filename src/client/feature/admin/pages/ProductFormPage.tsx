import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { apiFetch } from '@shared/lib/api';
import { Button } from '@shared/components/Button';
import { Input, Textarea } from '@shared/components/Input';
import { Skeleton } from '@shared/components/Skeleton';
import { toast } from 'sonner';
import { slugify } from '@shared/lib/utils';
import type { Category, Variant, PricingTier } from '@shared/types';

interface VariantRow {
  key: string;
  color: string;
  size: string;
  price: number;
  stock: number;
  sku: string;
  id?: number;
}

interface TierRow {
  key: string;
  minQuantity: number;
  price: number;
}

function SkeletonForm() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function ProductFormPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const id = params.id ? Number(params.id) : undefined;
  const isEditing = id !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isQuantityPricing, setIsQuantityPricing] = useState(false);

  const [colorsInput, setColorsInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [tiers, setTiers] = useState<TierRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiFetch<{ data: Category[] }>('/admin/categories'),
    staleTime: 1000 * 60 * 10,
  });

  const {
    data: productData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () =>
      apiFetch<{
        data: {
          id: number;
          name: string;
          slug: string;
          description: string;
          categoryId: number;
          isQuantityPricing: boolean;
          variants: Variant[];
          pricingTiers: PricingTier[];
        };
      }>(`/admin/products/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (productData?.data) {
      const p = productData.data;
      setName(p.name);
      setSlug(p.slug);
      setSlugManual(true);
      setDescription(p.description);
      setCategoryId(String(p.categoryId));
      setIsQuantityPricing(p.isQuantityPricing);

      setVariants(
        p.variants.map((v) => ({
          key: `${v.color}-${v.size}-${v.id ?? crypto.randomUUID()}`,
          color: v.color,
          size: v.size,
          price: Number(v.price),
          stock: v.stock,
          sku: v.sku,
          id: v.id,
        })),
      );

      if (p.pricingTiers) {
        setTiers(
          p.pricingTiers.map((t) => ({
            key: crypto.randomUUID(),
            minQuantity: t.minQuantity,
            price: Number(t.price),
          })),
        );
      }
    }
  }, [productData]);

  const generateSlug = useCallback(
    (value: string) => {
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual],
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    generateSlug(val);
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManual(true);
    setSlug(e.target.value);
  };

  const generateMatrix = () => {
    const colors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const sizes = sizesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (colors.length === 0 || sizes.length === 0) {
      toast.error('Veuillez renseigner au moins une couleur et une taille');
      return;
    }

    const newVariants: VariantRow[] = [];
    for (const color of colors) {
      for (const size of sizes) {
        newVariants.push({
          key: crypto.randomUUID(),
          color,
          size,
          price: 0,
          stock: 0,
          sku: '',
        });
      }
    }
    setVariants(newVariants);
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      { key: crypto.randomUUID(), color: '', size: '', price: 0, stock: 0, sku: '' },
    ]);
  };

  const removeVariantRow = (key: string) => {
    setVariants((prev) => prev.filter((v) => v.key !== key));
  };

  const updateVariant = (key: string, field: keyof VariantRow, value: string | number) => {
    setVariants((prev) =>
      prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)),
    );
  };

  const addTier = () => {
    setTiers((prev) => [...prev, { key: crypto.randomUUID(), minQuantity: 1, price: 0 }]);
  };

  const removeTier = (key: string) => {
    setTiers((prev) => prev.filter((t) => t.key !== key));
  };

  const updateTier = (key: string, field: keyof TierRow, value: number) => {
    setTiers((prev) =>
      prev.map((t) => (t.key === key ? { ...t, [field]: value } : t)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Le nom est requis');
      return;
    }
    if (!slug.trim()) {
      setFormError('Le slug est requis');
      return;
    }
    if (!categoryId) {
      setFormError('La catégorie est requise');
      return;
    }
    if (variants.length === 0) {
      setFormError('Au moins une variante est requise');
      return;
    }
    for (const v of variants) {
      if (!v.color.trim() || !v.size.trim() || !v.sku.trim()) {
        setFormError('Toutes les variantes doivent avoir une couleur, une taille et un SKU');
        return;
      }
      if (v.price <= 0) {
        setFormError('Toutes les variantes doivent avoir un prix supérieur à 0');
        return;
      }
    }
    if (isQuantityPricing && tiers.length > 0) {
      for (const t of tiers) {
        if (t.minQuantity <= 0 || t.price <= 0) {
          setFormError('Les paliers de prix doivent avoir une quantité min et un prix valides');
          return;
        }
      }
    }

    setSubmitting(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      categoryId: Number(categoryId),
      isQuantityPricing,
      variants: variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        color: v.color.trim(),
        size: v.size.trim(),
        price: Number(v.price),
        stock: Number(v.stock),
        sku: v.sku.trim(),
      })),
      ...(isQuantityPricing && tiers.length > 0
        ? {
            pricingTiers: tiers.map((t) => ({
              minQuantity: Number(t.minQuantity),
              price: Number(t.price),
            })),
          }
        : {}),
    };

    try {
      if (isEditing) {
        await apiFetch(`/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Produit mis à jour');
      } else {
        await apiFetch('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Produit créé');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate({ to: '/admin/produits' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditing && isLoading) {
    return <SkeletonForm />;
  }

  if (isEditing && isError) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
        {(error as Error)?.message || 'Produit introuvable.'}
      </div>
    );
  }

  const categories = categoriesData?.data ?? [];

  return (
    <div>
      <h1 className="font-heading text-2xl text-charcoal-900 mb-6">
        {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
      </h1>

      {formError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 mb-6">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <div className="bg-white p-6 rounded-xl border border-charcoal-200 space-y-4">
          <h2 className="font-heading text-lg text-charcoal-900">Informations générales</h2>

          <Input
            label="Nom"
            value={name}
            onChange={handleNameChange}
            placeholder="Nom du produit"
            required
          />

          <Input
            label="Slug"
            value={slug}
            onChange={handleSlugChange}
            placeholder="slug-du-produit"
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description du produit..."
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-charcoal-700">Catégorie</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border-2 border-charcoal-200 rounded-lg focus:outline-none focus:border-accent text-charcoal-700"
              required
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isQuantityPricing}
              onChange={(e) => setIsQuantityPricing(e.target.checked)}
              className="w-4 h-4 rounded border-charcoal-300 text-accent focus:ring-accent"
            />
            <span className="text-sm font-medium text-charcoal-700">Prix par quantité</span>
          </label>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-xl border border-charcoal-200">
          <h2 className="font-heading text-lg text-charcoal-900 mb-4">Images</h2>
          <div className="p-8 border-2 border-dashed border-charcoal-200 rounded-lg text-center">
            <p className="text-sm text-charcoal-500">Images gérées via Cloudinary</p>
            <p className="text-xs text-charcoal-400 mt-1">
              L&apos;import d&apos;images sera disponible prochainement
            </p>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white p-6 rounded-xl border border-charcoal-200 space-y-4">
          <h2 className="font-heading text-lg text-charcoal-900">Variantes</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label="Couleurs"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Noir, Blanc, Rouge"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Tailles"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                placeholder="S, M, L, XL"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={generateMatrix}>
                Générer la matrice
              </Button>
            </div>
          </div>

          {variants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-charcoal-50 border-b border-charcoal-200">
                    <th className="text-left px-3 py-2 font-medium text-charcoal-600">Couleur</th>
                    <th className="text-left px-3 py-2 font-medium text-charcoal-600">Taille</th>
                    <th className="text-left px-3 py-2 font-medium text-charcoal-600">Prix</th>
                    <th className="text-left px-3 py-2 font-medium text-charcoal-600">Stock</th>
                    <th className="text-left px-3 py-2 font-medium text-charcoal-600">SKU</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {variants.map((v) => (
                    <tr key={v.key}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.color}
                          onChange={(e) => updateVariant(v.key, 'color', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                          placeholder="Couleur"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => updateVariant(v.key, 'size', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                          placeholder="Taille"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.price || ''}
                          onChange={(e) => updateVariant(v.key, 'price', Number(e.target.value))}
                          className="w-24 px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                          min={0}
                          step={0.01}
                          inputMode="decimal"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={v.stock || ''}
                          onChange={(e) => updateVariant(v.key, 'stock', Number(e.target.value))}
                          className="w-20 px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                          min={0}
                          step={1}
                          inputMode="numeric"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => updateVariant(v.key, 'sku', e.target.value)}
                          className="w-36 px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeVariantRow(v.key)}
                          className="p-1 text-charcoal-400 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Button type="button" variant="ghost" size="sm" onClick={addVariantRow}>
            <Plus className="h-3 w-3 mr-1" />
            Ajouter une variante
          </Button>
        </div>

        {/* Quantity pricing tiers */}
        {isQuantityPricing && (
          <div className="bg-white p-6 rounded-xl border border-charcoal-200 space-y-4">
            <h2 className="font-heading text-lg text-charcoal-900">Paliers de prix par quantité</h2>

            {tiers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-charcoal-50 border-b border-charcoal-200">
                      <th className="text-left px-3 py-2 font-medium text-charcoal-600">Quantité min</th>
                      <th className="text-left px-3 py-2 font-medium text-charcoal-600">Prix</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-100">
                    {tiers.map((t) => (
                      <tr key={t.key}>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={t.minQuantity || ''}
                            onChange={(e) => updateTier(t.key, 'minQuantity', Number(e.target.value))}
                            className="w-24 px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                            min={1}
                            step={1}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={t.price || ''}
                            onChange={(e) => updateTier(t.key, 'price', Number(e.target.value))}
                            className="w-24 px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                            min={0}
                            step={0.01}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeTier(t.key)}
                            className="p-1 text-charcoal-400 hover:text-red-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={addTier}>
              <Plus className="h-3 w-3 mr-1" />
              Ajouter un palier
            </Button>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le produit'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate({ to: '/admin/produits' })}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
