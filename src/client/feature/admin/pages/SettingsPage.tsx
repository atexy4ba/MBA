import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, GripVertical } from 'lucide-react';
import { apiFetch } from '@shared/lib/api';
import { Button } from '@shared/components/Button';
import { Input } from '@shared/components/Input';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { toast } from 'sonner';

interface OrderFormField {
  id: number;
  label: string;
  fieldType: string;
  required: boolean;
  sortOrder: number;
  options: string[] | null;
  isActive: boolean;
}

interface LocalField {
  key: string;
  id?: number;
  label: string;
  fieldType: string;
  required: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface SettingsData {
  settings: Record<string, string>;
  orderFormFields: OrderFormField[];
}

type Tab = 'store' | 'fields';

const STORE_SETTINGS_FIELDS = [
  { key: 'store_name', label: 'Nom de la boutique', placeholder: 'Made By Algerians' },
  { key: 'contact_email', label: 'Email de contact', placeholder: 'contact@madebyalgerians.com', type: 'email' },
  { key: 'currency', label: 'Devise', placeholder: 'DZD' },
  { key: 'phone', label: 'Téléphone', placeholder: '+213...', type: 'tel' },
  { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
  { key: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'dropdown', label: 'Liste déroulante' },
  { value: 'checkbox', label: 'Case à cocher' },
];

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="bg-white p-6 rounded-xl border border-charcoal-200 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('store');

  const [storeForm, setStoreForm] = useState<Record<string, string>>({});
  const [storeSaving, setStoreSaving] = useState(false);

  const [fields, setFields] = useState<LocalField[]>([]);
  const [fieldsSaving, setFieldsSaving] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => apiFetch<{ data: SettingsData }>('/admin/settings'),
  });

  useEffect(() => {
    if (data?.data) {
      const defaults: Record<string, string> = {};
      for (const field of STORE_SETTINGS_FIELDS) {
        defaults[field.key] = data.data.settings[field.key] ?? '';
      }
      defaults['currency'] = data.data.settings['currency'] ?? 'DZD';
      setStoreForm(defaults);

      setFields(
        data.data.orderFormFields.map((f) => ({
          key: crypto.randomUUID(),
          id: f.id,
          label: f.label,
          fieldType: f.fieldType,
          required: f.required,
          sortOrder: f.sortOrder,
          isActive: f.isActive,
        })),
      );
    }
  }, [data]);

  const handleStoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreSaving(true);
    try {
      const body: Record<string, string> = {};
      for (const field of STORE_SETTINGS_FIELDS) {
        body[field.key] = storeForm[field.key] ?? '';
      }
      await apiFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Paramètres enregistrés');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setStoreSaving(false);
    }
  };

  const handleFieldsSave = async () => {
    setFieldsSaving(true);
    const sorted = fields.map((f, i) => ({ ...f, sortOrder: i }));
    setFields(sorted);
    try {
      const body = {
        fields: sorted.map(({ key, ...rest }) => rest),
      };
      await apiFetch('/admin/settings/order-form-fields', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Champs du formulaire enregistrés');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setFieldsSaving(false);
    }
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        label: '',
        fieldType: 'text',
        required: true,
        sortOrder: prev.length,
        isActive: true,
      },
    ]);
  };

  const removeField = (key: string) => {
    setFields((prev) => prev.filter((f) => f.key !== key));
  };

  const updateField = (key: string, field: Partial<LocalField>) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...field } : f)),
    );
  };

  const toggleFieldActive = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, isActive: !f.isActive } : f)),
    );
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((f, i) => ({ ...f, sortOrder: i }));
    });
  };

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <div className="p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
        {(error as Error)?.message || 'Erreur lors du chargement des paramètres.'}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl text-charcoal-900 mb-6">Paramètres</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-charcoal-200">
        <button
          onClick={() => setTab('store')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
            tab === 'store'
              ? 'border-accent text-accent'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
          }`}
        >
          Informations boutique
        </button>
        <button
          onClick={() => setTab('fields')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
            tab === 'fields'
              ? 'border-accent text-accent'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
          }`}
        >
          Champs du formulaire de commande
        </button>
      </div>

      {/* Tab: Store info */}
      {tab === 'store' && (
        <form onSubmit={handleStoreSave} className="bg-white p-6 rounded-xl border border-charcoal-200 space-y-4">
          <h2 className="font-heading text-lg text-charcoal-900 mb-2">Informations boutique</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STORE_SETTINGS_FIELDS.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type ?? 'text'}
                value={storeForm[field.key] ?? ''}
                onChange={(e) =>
                  setStoreForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
              />
            ))}
          </div>

          <Button type="submit" disabled={storeSaving}>
            {storeSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      )}

      {/* Tab: Order form fields */}
      {tab === 'fields' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-charcoal-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-charcoal-900">Champs du formulaire de commande</h2>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-3 w-3 mr-1" />
                Ajouter un champ
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-charcoal-500 text-center py-8">Aucun champ défini</p>
            )}

            {fields.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-charcoal-50 border-b border-charcoal-200">
                      <th className="w-8 px-2 py-2" />
                      <th className="text-left px-2 py-2 font-medium text-charcoal-600">Label</th>
                      <th className="text-left px-2 py-2 font-medium text-charcoal-600">Type</th>
                      <th className="text-center px-2 py-2 font-medium text-charcoal-600">Requis</th>
                      <th className="text-center px-2 py-2 font-medium text-charcoal-600">Actif</th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-100">
                    {fields.map((field, index) => (
                      <tr key={field.key}>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveField(index, -1)}
                              disabled={index === 0}
                              className="text-charcoal-300 hover:text-charcoal-600 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <svg className="h-3 w-3 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveField(index, 1)}
                              disabled={index === fields.length - 1}
                              className="text-charcoal-300 hover:text-charcoal-600 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                            </button>
                            <GripVertical className="h-4 w-4 text-charcoal-300 ml-0.5" />
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(field.key, { label: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent"
                            placeholder="Label du champ"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={field.fieldType}
                            onChange={(e) => updateField(field.key, { fieldType: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-charcoal-200 rounded focus:outline-none focus:border-accent text-charcoal-700"
                          >
                            {FIELD_TYPES.map((ft) => (
                              <option key={ft.value} value={ft.value}>
                                {ft.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.key, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-charcoal-300 text-accent focus:ring-accent"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleFieldActive(field.key)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              field.isActive ? 'bg-accent' : 'bg-charcoal-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                                field.isActive ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => removeField(field.key)}
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
          </div>

          <Button onClick={handleFieldsSave} disabled={fieldsSaving}>
            {fieldsSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  );
}
