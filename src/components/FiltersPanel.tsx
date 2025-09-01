'use client'

import { useState } from 'react'
import { FacetGroup, Filters, Range } from '@/types/filters'
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
    if (key === 'price' || key === 'year') {
      if (value && (value.min != null || value.max != null)) (next as any)[key] = value
      else delete (next as any)[key]
      onChange(next)
      return
    }
    if (key === 'brand_ids') {
      if (Array.isArray(value) && value.length) next.brand_ids = value
      else delete next.brand_ids
      onChange(next)
      return
    }
    const specs = { ...(next.specs ?? {}) }
    const shouldRemove =
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' &&
        !Array.isArray(value) &&
        !('min' in value && (value as any).min != null) &&
        !('max' in value && (value as any).max != null) &&
        !('in' in value && Array.isArray((value as any).in) && (value as any).in.length > 0))
    if (shouldRemove) delete specs[key]
    else specs[key] = value
    next.specs = specs
    onChange(next)
  }

  const renderNumber = (
    itemKey: string,
    unit?: string | null,
    min?: number | null,
    max?: number | null
  ) => {
    const range =
      (itemKey === 'price' || itemKey === 'year'
        ? (filters as any)[itemKey]
        : filters.specs?.[itemKey]) as Range | undefined
    const value: [number, number] = [
      range?.min ?? (min ?? 0),
      range?.max ?? (max ?? 0),
    ]
    return (
      <div className="space-y-2">
        <Slider
          min={min ?? 0}
          max={max ?? 0}
          step={1}
          value={value}
          onValueChange={v =>
            updateFilter(
              itemKey,
              min != null && max != null && v[0] === min && v[1] === max
                ? undefined
                : { min: parseFloat(String(v[0])), max: parseFloat(String(v[1])) }
            )
          }
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {value[0]} {unit}
          </span>
          <span>
            {value[1]} {unit}
          </span>
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
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState(false)
    const filtered =
      options?.filter(o => o.value.toLowerCase().includes(search.toLowerCase())) || []
    const display = expanded ? filtered : filtered.slice(0, 10)
    const toggle = (val: string, chk: boolean) => {
      const next = chk
        ? [...selected, val]
        : selected.filter(v => v !== val)
      updateFilter(itemKey, next)
    }
    return (
      <div className="space-y-2">
        {options && options.length > 10 && (
          <Input
            placeholder="Recherche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        )}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {display.map(o => (
            <Label key={o.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(o.value)}
                onCheckedChange={chk => toggle(o.value, !!chk)}
              />
              {o.value} ({o.count})
            </Label>
          ))}
        </div>
        {filtered.length > 10 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? 'Voir moins' : 'Voir plus'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {facets.map(group => (
        <div key={group.group} className="space-y-4">
          <h4 className="font-semibold">{group.group_label ?? group.group}</h4>
          {group.items.map(item => (
            <div key={item.key} className="space-y-2">
              <Label className="text-sm font-medium">
                {item.label || item.key}
              </Label>
              {item.type === 'number' &&
                renderNumber(item.key, item.unit, item.min, item.max)}
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
