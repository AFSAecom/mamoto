'use client';

import Image from 'next/image';
import { byId } from '@/lib/moto-data';
import { useCompare } from '@/store/useCompare';
import { Button } from '@/components/ui/button';

export default function CompareSlots() {
  const { selected, removeMoto } = useCompare();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {selected.map((id) => {
        const moto = byId(id);
        if (!moto) return null;
        return (
          <div
            key={id}
            className="border rounded p-2 flex flex-col items-center text-center"
          >
            {moto.image && (
              <Image
                src={moto.image}
                alt={moto.model}
                width={120}
                height={80}
                className="h-20 w-auto object-contain"
              />
            )}
            <div className="mt-2 text-sm font-medium">
              {moto.brand} {moto.model}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-1"
              onClick={() => removeMoto(id)}
            >
              Retirer
            </Button>
          </div>
        );
      })}
    </div>
  );
}
