'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import useCompare from '@/hooks/use-compare';
import { isPresent } from '@/lib/is-present';

interface CompareButtonProps {
  modelId?: string | null;
}

export default function CompareButton({ modelId }: CompareButtonProps) {
  const { toast } = useToast();
  const { compareMotos, addMoto, removeMoto } = useCompare();

  const active = isPresent(modelId) && compareMotos.includes(modelId);

  const toggle = () => {
    if (!isPresent(modelId)) return;
    if (active) {
      removeMoto(modelId);
      toast({ title: 'Modèle retiré de la comparaison' });
    } else {
      addMoto(modelId);
      toast({ title: 'Modèle ajouté à la comparaison' });
    }
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
