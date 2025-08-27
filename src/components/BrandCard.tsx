import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BrandCardProps {
  name: string;
  count: number;
  href: string;
}

export default function BrandCard({ name, count, href }: BrandCardProps) {
  return (
    <Link href={href} aria-label={`Voir les modèles ${name}`}>
      <Card className="hover:border-brand-500 transition-colors">
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          {count} modèle{count > 1 ? 's' : ''}
        </CardContent>
      </Card>
    </Link>
  );
}
