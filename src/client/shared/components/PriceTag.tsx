import { formatPrice } from '@shared/lib/utils';

interface PriceTagProps {
  price: string | number;
  currency?: string;
  isQuantityPricing?: boolean;
  quantityPricingMin?: string | number;
}

export function PriceTag({ price, currency = 'DZD', isQuantityPricing, quantityPricingMin }: PriceTagProps) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-semibold text-charcoal-900">
        {formatPrice(price, currency)}
      </span>
      {isQuantityPricing && (
        <span className="text-xs text-charcoal-500">
          / unité
        </span>
      )}
      {isQuantityPricing && quantityPricingMin && (
        <span className="text-xs text-charcoal-400 ml-1">
          &agrave; partir de {quantityPricingMin} pcs
        </span>
      )}
    </div>
  );
}

export function PriceRange({ variants }: { variants: { price: string }[] }) {
  const prices = variants.map((v) => Number(v.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return <PriceTag price={min} />;
  }

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-lg font-semibold text-charcoal-900">
        {formatPrice(min)}
      </span>
      <span className="text-charcoal-400">-</span>
      <span className="text-lg font-semibold text-charcoal-900">
        {formatPrice(max)}
      </span>
      <span className="text-xs text-charcoal-500">DZD</span>
    </div>
  );
}
