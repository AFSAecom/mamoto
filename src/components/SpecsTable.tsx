import type { SpecValue } from '@/types/moto';

interface SpecsTableProps {
  specs: Record<string, SpecValue>;
}

function formatKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SpecsTable({ specs }: SpecsTableProps) {
  const entries = Object.entries(specs);

  return (
    <table className="min-w-full text-sm">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border-b border-accent">
            <th className="p-2 text-left font-medium">{formatKey(key)}</th>
            <td className="p-2">{value === null ? '—' : String(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
