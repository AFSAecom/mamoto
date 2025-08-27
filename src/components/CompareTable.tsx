import type { Moto, SpecValue } from '@/types/moto';

interface CompareTableProps {
  motos: Moto[];
}

function formatKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CompareTable({ motos }: CompareTableProps) {
  if (motos.length < 2) {
    return (
      <p className="text-muted">Ajoutez au moins deux modèles pour comparer.</p>
    );
  }

  const specKeys = Array.from(
    new Set(motos.flatMap((m) => Object.keys(m.specs)))
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Spécifications</th>
            {motos.map((m) => (
              <th key={m.id} className="p-2 text-left">
                {m.brand} {m.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specKeys.map((key) => (
            <tr key={key} className="border-t border-accent">
              <th className="p-2 text-left font-medium">{formatKey(key)}</th>
              {motos.map((m) => (
                <td key={m.id} className="p-2">
                  {renderValue(m.specs[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderValue(value: SpecValue | undefined) {
  if (value === undefined || value === null) return '—';
  return String(value);
}
