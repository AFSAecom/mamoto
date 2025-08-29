'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { brands, modelsByBrand } from '@/lib/moto-data';
import { useCompare } from '@/store/useCompare';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CompareFilters() {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  const { selected, addMoto, hydrateQS } = useCompare();

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Hydrate from query string
  useEffect(() => {
    const qs = searchParams.get('m');
    if (qs) {
      hydrateQS(qs.split(','));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update query string when selection changes
  useEffect(() => {
    const qs = selected.join(',');
    const url = qs ? `${pathname}?m=${qs}` : pathname;
    router.replace(url, { scroll: false });
  }, [selected, pathname, router]);

  const modelOptions = brand ? modelsByBrand(brand) : [];

  const handleAdd = () => {
    if (model) {
      addMoto(model);
      setModel('');
    }
  };

  const disabled =
    !model || selected.length >= 4 || selected.includes(model);

  return (
    <div className="flex flex-col sm:flex-row items-end gap-2">
      <Select
        value={brand}
        onValueChange={(v) => {
          setBrand(v);
          setModel('');
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Marque" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={model}
        onValueChange={setModel}
        disabled={!brand}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Modèle" />
        </SelectTrigger>
        <SelectContent>
          {modelOptions.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAdd} disabled={disabled}>
        Ajouter
      </Button>
    </div>
  );
}

