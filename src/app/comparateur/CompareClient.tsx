'use client';

import React from 'react';
import CompareTable from '@/components/CompareTable';
import { Button } from '@/components/ui/button';
import useCompare from '@/hooks/use-compare';
import type { MotoCard } from '@/lib/public/motos';

interface CompareClientProps {
  motos: MotoCard[];
}

export default function CompareClient({ motos }: CompareClientProps) {
  const { compareMotos, clear } = useCompare();
  const [selected, setSelected] = React.useState(() =>
    motos.filter((m) => m.slug && compareMotos.includes(m.slug))
  );

  React.useEffect(() => {
    setSelected(motos.filter((m) => m.slug && compareMotos.includes(m.slug)));
  }, [compareMotos, motos]);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Comparateur</h1>
      {selected.length > 0 && (
        <Button onClick={clear} aria-label="Vider comparateur">
          Vider comparateur
        </Button>
      )}
      <CompareTable motos={selected} />
    </div>
  );
}

