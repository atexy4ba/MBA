export function formatPrice(price: string | number, currency = 'DZD'): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `${num.toLocaleString('fr-FR')} ${currency}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
