import { Badge } from '@/components/ui/badge';

interface PriceBadgeProps {
  price: number;
}

export default function PriceBadge({ price }: PriceBadgeProps) {
  const formatted = new Intl.NumberFormat('fr-TN').format(price);
  return <Badge className="text-base px-4 py-1">{formatted} TND</Badge>;
}
