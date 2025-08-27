import { Metadata } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PriceBadge from '@/components/PriceBadge';
import SimilarModels from '@/components/SimilarModels';

interface PageProps {
  params: { brand: string; model: string; variant?: string[] };
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function getMotos() {
  const file = await fs.readFile(
    path.join(process.cwd(), 'data', 'motos.json'),
    'utf-8'
  );
  return JSON.parse(file) as any[];
}

export async function generateStaticParams() {
  const motos = await getMotos();
  return motos.map((m) => {
    const general = m['Informations générales'] || {};
    const brand = slugify(general['Marque'] || '');
    const model = slugify(general['Modèle'] || '');
    const version = general['Version'];
    const variant = version ? [slugify(version)] : undefined;
    return { brand, model, variant };
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const motos = await getMotos();
  const moto = motos.find((m) => {
    const general = m['Informations générales'] || {};
    const brand = slugify(general['Marque'] || '');
    const model = slugify(general['Modèle'] || '');
    const version = general['Version'] ? slugify(general['Version']) : undefined;
    return (
      brand === params.brand &&
      model === params.model &&
      (params.variant ? version === params.variant[0] : true)
    );
  });

  if (!moto) {
    return { title: 'Moto' };
  }

  const brandName = moto['Informations générales']['Marque'];
  const modelName = moto['Informations générales']['Modèle'];

  return {
    title: `${brandName} ${modelName}`,
    description: `Fiche technique de ${modelName} par ${brandName}.`,
  };
}

export default async function MotoPage({ params }: PageProps) {
  const motos = await getMotos();
  const moto = motos.find((m) => {
    const general = m['Informations générales'] || {};
    const brand = slugify(general['Marque'] || '');
    const model = slugify(general['Modèle'] || '');
    const version = general['Version'] ? slugify(general['Version']) : undefined;
    return (
      brand === params.brand &&
      model === params.model &&
      (params.variant ? version === params.variant[0] : version === undefined)
    );
  });

  if (!moto) notFound();

  const general = moto['Informations générales'];
  const brandName = general['Marque'];
  const modelName = general['Modèle'];
  const version = general['Version'];
  const priceStr = general['Prix (TND)'];
  const priceTND = priceStr ? parseInt(priceStr.replace(/\s/g, ''), 10) : undefined;

  const similarModels = motos
    .filter(
      (m) =>
        m !== moto &&
        m['Informations générales']['Marque'] === brandName
    )
    .map((m) => ({
      name: m['Informations générales']['Modèle'],
      slug: slugify(m['Informations générales']['Modèle']),
    }));

  const jsonLd =
    priceTND !== undefined
      ? {
          '@context': 'https://schema.org',
          '@type': ['Product', 'Vehicle'],
          name: `${brandName} ${modelName}`,
          brand: brandName,
          model: modelName,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'TND',
            price: priceTND,
          },
        }
      : null;

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/motos">Motos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/motos/${params.brand}`}>{brandName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{modelName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold">
          {brandName} {modelName} {version && <span>{version}</span>}
        </h1>
        {priceTND !== undefined && <PriceBadge price={priceTND} />}
        <div className="flex gap-4">
          <Button>Comparer</Button>
          <Button variant="outline" asChild>
            <a href="#fiche-technique">Fiche technique</a>
          </Button>
        </div>
        <div className="aspect-video w-full bg-muted" />
      </section>

      <Tabs defaultValue="specs">
        <TabsList>
          <TabsTrigger value="specs">Fiche technique</TabsTrigger>
          <TabsTrigger value="gallery">Galerie</TabsTrigger>
        </TabsList>
        <TabsContent value="specs">
          <section id="fiche-technique" className="space-y-6">
            {Object.entries(moto)
              .filter(([k]) => k !== 'name' && k !== 'Informations générales')
              .map(([section, specs]) => (
                <div key={section} className="space-y-2">
                  <h3 className="text-lg font-semibold">{section}</h3>
                  <dl className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    {Object.entries(specs as Record<string, string>).map(([k, v]) => (
                      <Fragment key={k}>
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </Fragment>
                    ))}
                  </dl>
                </div>
              ))}
          </section>
        </TabsContent>
        <TabsContent value="gallery">
          <div className="aspect-video w-full bg-muted" />
        </TabsContent>
      </Tabs>

      <SimilarModels brand={params.brand} models={similarModels} />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </div>
  );
}
