import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import SpecsTable from '@/components/SpecsTable';
import { Button } from '@/components/ui/button';
import useCompare from '@/hooks/use-compare';
import { findById } from '@/lib/motos';

interface PageProps {
  params: { id: string };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const moto = findById(params.id);
  if (!moto) return { title: 'Modèle' };
  const title = `${moto.brand} ${moto.model}${moto.year ? ` ${moto.year}` : ''}`;
  return {
    title,
    description: `Fiche technique de ${title}`,
  };
}

export default function ModelePage({ params }: PageProps) {
  const moto = findById(params.id);
  if (!moto) notFound();
  const title = `${moto.brand} ${moto.model}${moto.year ? ` ${moto.year}` : ''}`;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {moto.imageUrl && (
        <Image
          src={moto.imageUrl}
          alt={title}
          width={600}
          height={400}
          className="w-full h-auto"
        />
      )}
      {moto.price && (
        <p className="font-medium">Prix: {moto.price} TND</p>
      )}
      <SpecsTable specs={moto.specs} />
      <AddToCompareButton id={moto.id} />
      <Button asChild variant="link">
        <Link href="/comparateur">Voir le comparateur</Link>
      </Button>
    </div>
  );
}

function AddToCompareButton({ id }: { id: string }) {
  'use client';
  const { compareMotos, addMoto } = useCompare();
  const added = compareMotos.includes(id);
  const handle = () => addMoto(id);

  return (
    <Button onClick={handle} disabled={added} aria-label="Ajouter au comparateur">
      {added ? 'Ajouté' : 'Ajouter au comparateur'}
    </Button>
  );
}
