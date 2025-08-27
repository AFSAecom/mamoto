'use client';

import React from 'react';
import CompareTable from '@/components/CompareTable';
import { Button } from '@/components/ui/button';
import { getAllMotos } from '@/lib/motos';
import useCompare from '@/hooks/use-compare';

export default function CompareClient() {
  const { compareMotos, clear } = useCompare();
  const [motos, setMotos] = React.useState(() => {
    const all = getAllMotos();
    return all.filter((m) => compareMotos.includes(m.id));
  });

  React.useEffect(() => {
    const all = getAllMotos();
    setMotos(all.filter((m) => compareMotos.includes(m.id)));
  }, [compareMotos]);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Comparateur</h1>
      {motos.length > 0 && (
        <Button onClick={clear} aria-label="Vider comparateur">
          Vider comparateur
        </Button>
      )}
      <CompareTable motos={motos} />
    </div>
  );
}

