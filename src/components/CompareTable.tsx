import type { Moto } from '@/lib/motos';

interface CompareTableProps {
  motos: Moto[];
}

export default function CompareTable({ motos }: CompareTableProps) {
  if (motos.length < 2) {
    return (
      <p className="text-muted">Ajoutez au moins deux modèles pour comparer.</p>
    );
  }

  const labels = Array.from(
    new Set(motos.flatMap((m) => m.specs.map((s) => s.label)))
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Spécifications</th>
            {motos.map((m) => (
              <th key={m.slug} className="p-2 text-left">
                {m.model}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => (
            <tr key={label} className="border-t border-accent">
              <th className="p-2 text-left font-medium">{label}</th>
              {motos.map((m) => {
                const spec = m.specs.find((s) => s.label === label);
                return (
                  <td key={m.slug} className="p-2">
                    {spec ? spec.value : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
