import Link from 'next/link';
import { isPresent } from '@/lib/is-present';

interface SimilarModel {
  name?: string | null;
  slug?: string | null;
}

interface SimilarModelsProps {
  brand: string;
  models: SimilarModel[];
}

export default function SimilarModels({ brand, models }: SimilarModelsProps) {
  const list = models
    .filter((m) => isPresent(m.slug) && isPresent(m.name))
    .slice(0, 6) as { name: string; slug: string }[];
  if (list.length < 3) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold text-fg">Modèles similaires</h2>
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {list.map((m) => (
          <li key={m.slug}>
            <Link href={`/motos/${brand}/${m.slug}`} className="hover:text-brand-500">
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
