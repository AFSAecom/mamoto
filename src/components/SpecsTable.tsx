type Props = { specs: Record<string, unknown> };
function humanize(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
export default function SpecsTable({ specs }: Props) {
  const entries = Object.entries(specs || {});
  if (!entries.length) return <p>Pas de caractéristiques disponibles.</p>;
  return (
    <table className="w-full border-separate border-spacing-y-1">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="bg-white/60">
            <th className="text-left font-medium pr-4 py-2">{humanize(k)}</th>
            <td className="py-2">{String(v ?? "—")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
