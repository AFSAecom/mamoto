import type { MotoCard } from '@/lib/public/motos';

interface CompareTableProps {
  motos: MotoCard[];
}

export default function CompareTable({ motos }: CompareTableProps) {
  if (motos.length < 2) {
    return (
      <p className="text-muted">Ajoutez au moins deux modèles pour comparer.</p>
    );
  }

  const fmtPrice = (v: number | null) =>
    v != null ? v.toLocaleString('fr-TN') + ' TND' : '—';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Spécifications</th>
            {motos.map((m) => (
              <th key={m.slug ?? m.id} className="p-2 text-left">
                {m.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-accent">
            <th className="p-2 text-left font-medium">Année</th>
            {motos.map((m) => (
              <td key={(m.slug ?? m.id) + '_year'} className="p-2">
                {m.year ?? '—'}
              </td>
            ))}
          </tr>
          <tr className="border-t border-accent">
            <th className="p-2 text-left font-medium">Prix (TND)</th>
            {motos.map((m) => (
              <td key={(m.slug ?? m.id) + '_price'} className="p-2">
                {fmtPrice(m.price)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
