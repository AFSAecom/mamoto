'use client';

import { useCompare } from '@/store/useCompare';
import { byId } from '@/lib/moto-data';
import { SPEC_ORDER, SPEC_LABELS } from '@/lib/specs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

function formatValue(key: string, value: any) {
  if (value === undefined || value === null || value === '') return '—';
  if (key === 'price_tnd' && typeof value === 'number') {
    return value.toLocaleString('fr-TN') + ' TND';
  }
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  return String(value);
}

export default function CompareTable() {
  const { selected, checkedSpecs } = useCompare();
  const motos = selected.map((id) => byId(id)).filter(Boolean);
  const specs = SPEC_ORDER.filter((s) => checkedSpecs.has(s));

  if (motos.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-40">Caractéristique</TableHead>
          {motos.map((m) => (
            <TableHead key={m!.id}>
              {m!.brand} {m!.model}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {specs.map((spec) => (
          <TableRow key={spec}>
            <TableCell className="font-medium">
              {SPEC_LABELS[spec]}
            </TableCell>
            {motos.map((m) => (
              <TableCell key={m!.id}>
                {formatValue(spec, m!.specs[spec])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
