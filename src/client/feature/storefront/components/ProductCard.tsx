import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import type { ProductWithVariants } from '@client/shared/types';
import { PriceRange } from '@client/shared/components/PriceTag';
import { StockBadge } from '@client/shared/components/Badge';
import { cn } from '@client/shared/lib/utils';

interface ProductCardProps {
  product: ProductWithVariants;
}

const COLOR_MAP: Record<string, string> = {
  noir: '#1a1a1a',
  black: '#1a1a1a',
  blanc: '#f5f5f5',
  white: '#f5f5f5',
  rouge: '#D32F2F',
  red: '#D32F2F',
  bleu: '#1E3A5F',
  blue: '#1E3A5F',
  vert: '#2E7D32',
  green: '#2E7D32',
  beige: '#D2B48C',
  gris: '#808080',
  gray: '#808080',
  grey: '#808080',
  marine: '#1B1B5A',
  navy: '#1B1B5A',
  bordeaux: '#800020',
  burgundy: '#800020',
  rose: '#F8B4C8',
  pink: '#F8B4C8',
  jaune: '#EAB308',
  yellow: '#EAB308',
  orange: '#EA580C',
  violet: '#7C3AED',
  purple: '#7C3AED',
  marron: '#78350F',
  brown: '#78350F',
  doré: '#D4AF37',
  gold: '#D4AF37',
  argent: '#C0C0C0',
  silver: '#C0C0C0',
  ivoire: '#FFFFF0',
  ivory: '#FFFFF0',
  camel: '#C19A6B',
  kaki: '#6B7B3A',
  khaki: '#6B7B3A',
  taupe: '#8B7D6B',
  moutarde: '#D4A017',
  mustard: '#D4A017',
  écru: '#F5F0E1',
  ecru: '#F5F0E1',
};

function resolveColor(value: string): string {
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
    return value;
  }
  return COLOR_MAP[value.toLowerCase()] ?? '#9ca3af';
}

export function ProductCard({ product }: ProductCardProps) {
  const lowestStock = useMemo(
    () =>
      product.variants.length > 0
        ? Math.min(...product.variants.map((v) => v.stock))
        : Infinity,
    [product.variants],
  );

  const secondaryImage = useMemo(() => {
    if (!product.imageUrl) return null;
    const alt = product.variants.find(
      (v) => v.imageUrl && v.imageUrl !== product.imageUrl,
    );
    return alt?.imageUrl ?? null;
  }, [product.variants, product.imageUrl]);

  const uniqueColors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color))],
    [product.variants],
  );

  const hasTransition = secondaryImage !== null;

  return (
    <Link
      to="/fr/products/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative overflow-hidden bg-charcoal-50 aspect-[3/4]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
              hasTransition && 'group-hover:opacity-0',
            )}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-charcoal-300 text-sm font-body">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}

        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            loading="lazy"
          />
        )}

        {lowestStock < 5 && (
          <div className="absolute top-2 left-2 z-10">
            <StockBadge stock={lowestStock} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span
            className="w-full inline-flex items-center justify-center gap-2 bg-accent text-white font-medium tracking-tight rounded-lg py-2.5 px-4 text-sm hover:bg-accent-hover transition-colors duration-150"
          >
            <ShoppingCart className="w-4 h-4" />
            Voir le produit
          </span>
        </div>
      </div>

      {uniqueColors.length > 0 && (
        <div className="flex gap-1.5 mt-3" aria-label="Couleurs disponibles">
          {uniqueColors.slice(0, 6).map((color) => (
            <span
              key={color}
              className="w-4 h-4 rounded-full border border-charcoal-200 shrink-0"
              style={{ backgroundColor: resolveColor(color) }}
              title={color}
            />
          ))}
          {uniqueColors.length > 6 && (
            <span className="text-xs text-charcoal-500 leading-4 font-body">
              +{uniqueColors.length - 6}
            </span>
          )}
        </div>
      )}

      <h3 className="mt-2 font-heading text-sm text-charcoal-900 line-clamp-1">
        {product.name}
      </h3>

      {product.variants.length > 0 && (
        <div className="mt-1">
          <PriceRange variants={product.variants} />
        </div>
      )}
    </Link>
  );
}
