'use client';

import { FacetGroup, Filters, Range } from '@/types/filters';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

interface FiltersPanelProps {
  facets: FacetGroup[];
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
}

export default function FiltersPanel({ facets, filters, onChange, onReset }: FiltersPanelProps) {
  const current = useMemo(() => filters, [filters]);

  const update = (key: string, value: any) => {
    const next: Filters = { ...current };
    if (key === 'price' || key === 'year') {
      if (!value || (value.min === undefined && value.max === undefined)) delete (next as any)[key];
      else (next as any)[key] = value;
    } else if (key === 'brand_ids') {
      if (!value || value.length === 0) delete next.brand_ids;
      else next.brand_ids = value;
    } else {
      next.specs = { ...(next.specs || {}) };
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete next.specs[key];
        if (Object.keys(next.specs).length === 0) delete next.specs;
      } else {
        next.specs[key] = value;
      }
    }
    onChange(next);
  };

  const renderNumber = (item: any) => {
    const range = (current as any)[item.key] as Range | undefined;
    const min = range?.min ?? item.min;
    const max = range?.max ?? item.max;
    return (
      <div className="space-y-2" key={item.key}>
        <Slider
          value={[min ?? 0, max ?? 0]}
          min={item.min}
          max={item.max}
          step={1}
          onValueChange={(v) => update(item.key, { min: v[0], max: v[1] })}
          aria-label={`${item.label} ${item.unit ?? ''}`}
        />
        <div className="flex gap-2">
          <Input
            type="number"
            value={min ?? ''}
            onChange={(e) => update(item.key, { min: Number(e.target.value), max })}
            aria-label={`Min ${item.label}`}
          />
          <Input
            type="number"
            value={max ?? ''}
            onChange={(e) => update(item.key, { min, max: Number(e.target.value) })}
            aria-label={`Max ${item.label}`}
          />
          {item.unit && <span className="self-center text-sm opacity-70">{item.unit}</span>}
        </div>
      </div>
    );
  };

  const renderBoolean = (item: any) => {
    const value = (current.specs as any)?.[item.key];
    return (
      <ToggleGroup
        type="single"
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onValueChange={(val) => update(item.key, val === '' ? undefined : val === 'true')}
        className="flex gap-1"
      >
        <ToggleGroupItem value="" aria-label={`Tous ${item.label}`}>Tous</ToggleGroupItem>
        <ToggleGroupItem value="true" aria-label={`${item.label} Oui`}>Oui</ToggleGroupItem>
        <ToggleGroupItem value="false" aria-label={`${item.label} Non`}>Non</ToggleGroupItem>
      </ToggleGroup>
    );
  };

  const renderEnum = (item: any) => {
    const selected = (() => {
      if (item.key === 'brand_ids') return current.brand_ids || [];
      const spec = current.specs?.[item.key];
      if (Array.isArray(spec)) return spec;
      if (spec && typeof spec === 'object' && 'in' in spec) return spec.in as string[];
      return [];
    })();

    const toggle = (val: string, checked: boolean) => {
      const next = checked ? [...selected, val] : selected.filter((v) => v !== val);
      if (item.key === 'brand_ids') update(item.key, next);
      else update(item.key, next.length ? { in: next } : undefined);
    };

    return (
      <div className="space-y-1">
        {item.dist_text?.map((d: any) => (
          <label key={d.value} className="flex items-center gap-2">
            <Checkbox
              checked={selected.includes(d.value)}
              onCheckedChange={(c) => toggle(d.value, !!c)}
            />
            <span className="text-sm">{d.value}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filtres</h3>
        <Button variant="ghost" onClick={onReset} className="text-sm">Réinitialiser</Button>
      </div>
      {facets.map((group) => (
        <div key={group.key} className="space-y-2">
          <h4 className="font-medium text-sm">{group.label}</h4>
          {group.items.map((item) => (
            <div key={item.key} className="space-y-2">
              <label className="text-sm font-medium">{item.label}</label>
              {item.type === 'number'
                ? renderNumber(item)
                : item.type === 'boolean'
                ? renderBoolean(item)
                : renderEnum(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
