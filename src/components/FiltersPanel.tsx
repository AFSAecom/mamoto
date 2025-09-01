'use client'

import { FacetGroup } from '@/types/filters'
import { Filters, Range } from '@/hooks/useMotoSearch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface FiltersPanelProps {
  facets: FacetGroup[]
  filters: Filters
  onChange: (next: Filters) => void
}

export function FiltersPanel({ facets, filters, onChange }: FiltersPanelProps) {
  const updateFilter = (key: string, value: any) => {
    const next: Filters = { ...filters }
    if (key === 'price' || key === 'year' || key === 'brand_ids') {
      if (
        value === undefined ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && 'min' in value && 'max' in value && value.min === undefined && value.max === undefined)
      ) {
        delete (next as any)[key]
      } else {
        ;(next as any)[key] = value
      }
    } else {
      const specs = { ...(next.specs || {}) }
      if (
        value === undefined ||
        (typeof value === 'string' && value === '') ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && 'in' in value && (value.in?.length ?? 0) === 0) ||
        (typeof value === 'object' && !('in' in value) && (value as Range).min === undefined && (value as Range).max === undefined)
      ) {
        delete specs[key]
      } else {
        specs[key] = value
      }
      if (Object.keys(specs).length === 0) delete next.specs
      else next.specs = specs
    }
    onChange(next)
  }

  const renderNumber = (itemKey: string, item: any) => {
    const range =
      (itemKey === 'price' || itemKey === 'year'
        ? (filters as any)[itemKey]
        : filters.specs?.[itemKey]) as Range | undefined
    const sliderValue: [number, number] = [
      range?.min ?? (item.min ?? 0),
      range?.max ?? (item.max ?? 0),
    ]
    const handleInput = (type: 'min' | 'max', val: string) => {
      const num = val === '' ? undefined : parseFloat(val)
      const next: Range = { ...range, [type]: num }
      updateFilter(itemKey, next)
    }
    return (
      <div className="space-y-2">
        <Slider
          min={item.min ?? 0}
          max={item.max ?? 0}
          step={1}
          value={sliderValue}
          aria-label={`${item.label} ${item.unit ?? ''}`}
          onValueChange={v => updateFilter(itemKey, { min: v[0], max: v[1] })}
        />
        <div className="flex gap-2">
          <Input
            type="number"
            aria-label={`${item.label} min`}
            value={range?.min ?? ''}
            onChange={e => handleInput('min', e.target.value)}
          />
          <Input
            type="number"
            aria-label={`${item.label} max`}
            value={range?.max ?? ''}
            onChange={e => handleInput('max', e.target.value)}
          />
        </div>
      </div>
    )
  }

  const renderBoolean = (itemKey: string) => {
    const current =
      (itemKey === 'price' || itemKey === 'year'
        ? undefined
        : (filters.specs?.[itemKey] as boolean | undefined)) ?? undefined
    const value = current === undefined ? 'all' : current ? 'true' : 'false'
    return (
      <RadioGroup
        value={value}
        onValueChange={v =>
          updateFilter(itemKey, v === 'all' ? undefined : v === 'true')
        }
        className="flex gap-4"
      >
        <Label className="flex items-center gap-2">
          <RadioGroupItem value="all" /> Tous
        </Label>
        <Label className="flex items-center gap-2">
          <RadioGroupItem value="true" /> Oui
        </Label>
        <Label className="flex items-center gap-2">
          <RadioGroupItem value="false" /> Non
        </Label>
      </RadioGroup>
    )
  }

  const renderEnum = (
    itemKey: string,
    options: { value: string; count: number }[] | null | undefined
  ) => {
    const selected: string[] =
      (itemKey === 'brand_ids'
        ? filters.brand_ids
        : (filters.specs?.[itemKey] as string[] | undefined)) ?? []
    const toggle = (val: string, chk: boolean) => {
      const next = chk
        ? [...selected, val]
        : selected.filter(v => v !== val)
      updateFilter(itemKey, next)
    }
    return (
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {options?.map(o => (
          <Label key={o.value} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(o.value)}
              onCheckedChange={chk => toggle(o.value, !!chk)}
            />
            {o.value} ({o.count})
          </Label>
        ))}
      </div>
    )
  }

  if (facets.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Aucune facette disponible
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange({})}
        className="mb-2"
      >
        Réinitialiser tout
      </Button>
      {facets.map(group => (
        <div key={group.group} className="space-y-4">
          <h4 className="font-semibold">{group.group_label ?? group.group}</h4>
          {group.items.map(item => (
            <div key={item.key} className="space-y-2">
              <Label className="text-sm font-medium">
                {item.label || item.key}
              </Label>
              {item.type === 'number' && renderNumber(item.key, item)}
              {item.type === 'boolean' && renderBoolean(item.key)}
              {(item.type === 'enum' || item.type === 'text') &&
                renderEnum(item.key, item.dist_text)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default FiltersPanel
