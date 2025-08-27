'use client';

import modelsData from '@/data/models.json';
import { Button } from '@/components/ui/button';
import useCompare from '@/hooks/use-compare';
import type { Model } from '@/types';

const models = modelsData as Model[];

export default function ComparateurPage() {
  const { compareMotos, removeMoto } = useCompare();
  const selectedModels = models.filter((m) => compareMotos.includes(m.id));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-fg">Comparateur</h1>
      {selectedModels.length === 0 ? (
        <p className="mt-4 text-muted">
          Aucun modèle sélectionné pour comparaison.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {selectedModels.map((model) => (
            <li key={model.id} className="flex items-center gap-2">
              <span className="text-fg">{model.name}</span>
              <Button size="sm" variant="ghost" onClick={() => removeMoto(model.id)}>
                Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
