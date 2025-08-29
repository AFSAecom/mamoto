"use client";

import { byId } from "@/lib/catalog-helpers";
import { SPEC_LABELS } from "@/lib/specs";
import { useCompare } from "@/store/useCompare";

const fmtPrice = (v: any) => {
  const n = Number(v);
  if (Number.isFinite(n)) {
    return n.toLocaleString("fr-TN") + " TND";
  }
  return "—";
};

const cellValue = (val: any, key: string) => {
  if (val === undefined || val === null || val === "") return "—";
  if (key === "price_tnd") return fmtPrice(val);
  if (typeof val === "boolean") return val ? "Oui" : "Non";
  return String(val);
};

export default function CompareTable() {
  const selected = useCompare((s) => s.selected);
  const checked = useCompare((s) => s.checkedSpecs);

  const keys = Array.from(checked);

  if (selected.length === 0 || keys.length === 0) return null;

  const motos = selected.map((id) => byId(id)).filter(Boolean);

  return (
    <div className="overflow-auto">
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="text-left p-2 border-b w-56">Caractéristique</th>
            {motos.map((m) => (
              <th key={m!.id} className="text-left p-2 border-b min-w-[180px]">
                {m!.brand} {m!.model}
                {m!.year ? ` ${m!.year}` : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k} className="border-b">
              <td className="p-2 font-medium w-56">{SPEC_LABELS[k] ?? k}</td>
              {motos.map((m) => (
                <td key={m!.id + "_" + k} className="p-2">
                  {cellValue(m!.specs?.[k], k)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

