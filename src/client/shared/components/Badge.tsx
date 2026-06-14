export function Badge({ children, color = 'charcoal' }: { children: React.ReactNode; color?: 'red' | 'charcoal' | 'green' }) {
  const colors = {
    red: 'bg-red-50 text-red-700 border-red-200',
    charcoal: 'bg-charcoal-50 text-charcoal-700 border-charcoal-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <Badge color="red">Rupture de stock</Badge>;
  }
  if (stock < 5) {
    return <Badge color="red">Plus que {stock}</Badge>;
  }
  return null;
}
