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
    <li className="flex items-center justify-between py-1">
      <span className="text-sm text-muted">{label}</span>
      <div className="flex flex-wrap justify-end gap-1">
        {parts.length > 1 ? (
          parts.map((p) => (
            <Badge key={p} variant="secondary" className="bg-accent text-fg">
              {p}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-fg">{parts[0]}</span>
        )}
      </div>
    </li>
  );
}
