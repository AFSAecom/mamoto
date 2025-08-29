"use client";

import { byId } from "@/lib/catalog-helpers";
import { useCompare } from "@/store/useCompare";

export default function CompareSlots() {
  const selected = useCompare((s) => s.selected);
  const remove = useCompare((s) => s.removeMoto);

  if (selected.length === 0) {
    return (
      <div className="border rounded p-4 text-sm text-gray-600">
        Choisissez jusqu’à 4 motos via les filtres ci-dessus.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {selected.map((id) => {
        const m = byId(id);
        if (!m) return null;
        const src = m.image && m.image.startsWith("/") ? m.image : "/motos/placeholder.png";
        return (
          <div key={id} className="border rounded p-3 flex items-center gap-3">
            <img
              src={src}
              alt={`${m.brand} ${m.model}`}
              width={72}
              height={48}
              className="object-contain"
            />
            <div className="flex-1">
              <div className="font-medium">
                {m.brand} {m.model}
                {m.year ? ` ${m.year}` : ""}
              </div>
            </div>
            <button
              className="text-red-600 underline text-sm"
              onClick={() => remove(id)}
            >
              Retirer
            </button>
          </div>
        );
      })}
    </div>
  );
}

