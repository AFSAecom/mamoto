'use client';

import { Button } from '@/components/ui/button';
import useCompare from '@/hooks/use-compare';

export default function AddToCompareButton({ id }: { id: string }) {
  const { compareMotos, addMoto } = useCompare();
  const added = compareMotos.includes(id);
  const handle = () => addMoto(id);

  return (
    <Button onClick={handle} disabled={added} aria-label="Ajouter au comparateur">
      {added ? 'Ajouté' : 'Ajouter au comparateur'}
    </Button>
  );
}

