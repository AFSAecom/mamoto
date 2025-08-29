'use client';

import { SPEC_ORDER, SPEC_LABELS } from '@/lib/specs';
import { useCompare } from '@/store/useCompare';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function SpecCheckboxes() {
  const { checkedSpecs, toggleSpec } = useCompare();
  return (
    <div className="space-y-2">
      {SPEC_ORDER.map((key) => (
        <div key={key} className="flex items-center space-x-2">
          <Checkbox
            id={key}
            checked={checkedSpecs.has(key)}
            onCheckedChange={() => toggleSpec(key)}
          />
          <Label htmlFor={key}>{SPEC_LABELS[key]}</Label>
        </div>
      ))}
    </div>
  );
}
