'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { isPresent } from '@/lib/is-present';

interface CompareButtonProps {
  modelId?: string | null;
}

export default function CompareButton({ modelId }: CompareButtonProps) {
  const { toast } = useToast();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!isPresent(modelId)) return;
    const stored = JSON.parse(localStorage.getItem('compare-models') || '[]') as string[];
    setActive(stored.includes(modelId));
  }, [modelId]);

  const toggle = () => {
    if (!isPresent(modelId)) return;
    const stored = JSON.parse(localStorage.getItem('compare-models') || '[]') as string[];
    let updated: string[];
    if (stored.includes(modelId)) {
      updated = stored.filter((id) => id !== modelId);
      toast({ title: 'Modèle retiré de la comparaison' });
    } else {
      updated = [...stored, modelId];
      toast({ title: 'Modèle ajouté à la comparaison' });
    }
    localStorage.setItem('compare-models', JSON.stringify(updated));
    setActive(updated.includes(modelId));
  };

  return (
    <Button
      variant={active ? 'default' : 'outline'}
      onClick={toggle}
      size="sm"
      aria-pressed={active}
    >
      {active ? 'Retirer' : 'Comparer'}
    </Button>
  );
}
