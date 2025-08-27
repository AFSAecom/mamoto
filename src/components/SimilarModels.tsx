import Link from 'next/link';

interface SimilarModel {
  name: string;
  slug: string;
}

interface SimilarModelsProps {
  brand: string;
  models: SimilarModel[];
}

export default function SimilarModels({ brand, models }: SimilarModelsProps) {
  if (!models.length) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">Modèles similaires</h2>
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {models.map((m) => (
          <li key={m.slug}>
            <Link href={`/motos/${brand}/${m.slug}`}>{m.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
