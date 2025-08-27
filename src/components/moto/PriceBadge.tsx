import { Badge } from '@/components/ui/badge';
import { isPresent } from '@/lib/is-present';

interface PriceBadgeProps {
  price?: number | null;
}

export default function PriceBadge({ price }: PriceBadgeProps) {
  if (!isPresent(price)) return null;
  const formatted = new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace('TND', 'TND');

  return <Badge className="text-base px-4 py-1">{formatted}</Badge>;
}
