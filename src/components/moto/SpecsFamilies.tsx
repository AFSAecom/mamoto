import SpecItemRow from './SpecItemRow';
import { SpecFamily } from '@/types/moto';
import { isPresent } from '@/lib/is-present';

interface SpecsFamiliesProps {
  families: SpecFamily[];
}

export default function SpecsFamilies({ families }: SpecsFamiliesProps) {
  return (
    <div className="space-y-6">
      {families.map((family) => {
        const items = family.items.filter((it) => isPresent(it.value));
        if (!items.length) return null;
        return (
          <section key={family.group}>
            <h3 className="mb-2 text-lg font-semibold text-fg">{family.group}</h3>
            <ul className="space-y-1">
              {items.map((it) => (
                <SpecItemRow key={it.label} label={it.label} value={it.value} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
