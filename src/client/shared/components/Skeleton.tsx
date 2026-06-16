export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-breathe bg-gradient-to-r from-charcoal-100 via-charcoal-100 to-charcoal-200 rounded-xl ${className}`}
      role="presentation"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="group rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="mt-3 space-y-2 px-1">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
