import { Badge } from '@/components/ui/badge';
import { isPresent, tokens } from '@/lib/is-present';
import type { SpecValue } from '@/types/moto';

interface SpecItemRowProps {
  label: string;
  value?: SpecValue | null;
}

export default function SpecItemRow({ label, value }: SpecItemRowProps) {
  if (!isPresent(value)) return null;
  const parts =
    typeof value === 'string'
      ? tokens(value)
      : typeof value === 'boolean'
        ? [value ? 'Oui' : 'Non']
        : [String(value)];
  return (
    <li className="flex items-center justify-between py-1 px-2 bg-[var(--characteristics-bg)] text-white">
      <span className="text-sm">{label}</span>
      <div className="flex flex-wrap justify-end gap-1">
        {parts.length > 1 ? (
          parts.map((p) => <Badge key={p}>{p}</Badge>)
        ) : (
          <span className="text-sm">{parts[0]}</span>
        )}
      </div>
    </li>
  );
}
