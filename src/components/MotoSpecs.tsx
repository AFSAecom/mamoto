"use client";
import * as React from "react";

export type MotoSpecItem = {
  key: string;
  label?: string | null;
  unit?: string | null;
  value_text?: string | null;
  value_number?: number | null;
  value_json?: any | null;
};

export type MotoSpecGroup = {
  group: string;
  items: MotoSpecItem[];
};

function formatValue(item: MotoSpecItem): string {
  if (item?.value_text !== null && item?.value_text !== undefined && item.value_text !== "") {
    return item.value_text;
  }
  if (item?.value_number !== null && item?.value_number !== undefined) {
    // Nombre lisible (ex: 70 000 -> "70,000")
    try {
      return new Intl.NumberFormat().format(item.value_number);
    } catch {
      return String(item.value_number);
    }
  }
  if (item?.value_json !== null && item?.value_json !== undefined) {
    try {
      const txt = typeof item.value_json === "string" ? item.value_json : JSON.stringify(item.value_json);
      return txt.length > 120 ? txt.slice(0, 117) + "..." : txt;
    } catch {
      return "—";
    }
  }
  return "—";
}

export default function MotoSpecs({ groups }: { groups: MotoSpecGroup[] }) {
  if (!groups || groups.length === 0) {
    return <div className="text-sm text-gray-500">Aucune caractéristique détaillée.</div>;
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.group} className="border rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-3">{g.group}</h3>
          {(!g.items || g.items.length === 0) ? (
            <div className="text-sm text-gray-500">Aucun détail dans ce groupe.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {g.items.map((it) => {
                const val = formatValue(it);
                const unit = it?.unit ? ` ${it.unit}` : "";
                return (
                  <div key={`${g.group}-${it.key}`} className="flex justify-between items-start rounded-xl border p-3">
                    <div className="text-sm text-gray-600">{it.label || it.key}</div>
                    <div className="text-sm font-medium">
                      {val}{unit}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
