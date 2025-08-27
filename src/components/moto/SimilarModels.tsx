import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface SimilarModelsProps {
  brand?: string;
  category?: string;
  model?: string;
}

export default async function SimilarModels({
  brand,
  category,
  model,
}: SimilarModelsProps) {
  const file = await fs.readFile(
    path.join(process.cwd(), 'data', 'motos.json'),
    'utf-8'
  );
  const motos = JSON.parse(file) as any[];

  const brandSlug = brand ? slugify(brand) : undefined;
  const categorySlug = category ? slugify(category) : undefined;
  const currentModelSlug = model ? slugify(model) : undefined;

  const list = motos
    .filter((m) => {
      const general = m['Informations générales'] || {};
      const mBrand = slugify(general['Marque'] || '');
      const mModel = slugify(general['Modèle'] || '');
      const mCategory = general['Catégorie']
        ? slugify(general['Catégorie'])
        : undefined;
      const sameCategory = categorySlug
        ? mCategory === categorySlug
        : true;
      const sameBrand = brandSlug ? mBrand === brandSlug : true;
      const same = categorySlug ? sameCategory : sameBrand;
      const notCurrent = currentModelSlug ? mModel !== currentModelSlug : true;
      return same && notCurrent;
    })
    .map((m) => {
      const general = m['Informations générales'];
      return {
        name: general['Modèle'] as string,
        slug: slugify(general['Modèle'] || ''),
        brandSlug: slugify(general['Marque'] || ''),
        brandName: general['Marque'] as string,
      };
    })
    .slice(0, 6);

  if (list.length < 3) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold text-fg">Modèles similaires</h2>
      <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {list.map((m) => (
          <li key={m.slug}>
            <Link
              href={`/motos/${m.brandSlug}/${m.slug}`}
              className="block hover:text-brand-500"
            >
              <Card className="p-4">
                <h3 className="font-semibold text-fg">
                  {m.brandName} {m.name}
                </h3>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
