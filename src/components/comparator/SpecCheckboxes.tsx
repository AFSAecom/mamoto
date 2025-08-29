"use client";

import { useEffect } from "react";
import { SPEC_KEYS, SPEC_LABELS } from "@/lib/specs";
import { useCompare } from "@/store/useCompare";

const DEFAULT_KEYS = [
  "price_tnd",
  "engine_cc",
  "power_hp",
  "torque_nm",
  "weight_kg",
  "abs",
];

export default function SpecCheckboxes() {
  const checked = useCompare((s) => s.checkedSpecs);
  const toggle = useCompare((s) => s.toggleSpec);

  // si rien de coché au premier rendu, cocher un set par défaut (clé par clé)
  useEffect(() => {
    if (checked.size === 0) {
      DEFAULT_KEYS.forEach((k) => toggle(k));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allChecked = SPEC_KEYS.every((k) => checked.has(k));
  const onToggleAll = () => {
    if (allChecked) {
      // tout décocher
      SPEC_KEYS.forEach((k) => {
        if (checked.has(k)) toggle(k);
      });
    } else {
      // tout cocher
      SPEC_KEYS.forEach((k) => {
        if (!checked.has(k)) toggle(k);
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-2 border-b">
        <h2 className="font-semibold">Caractéristiques</h2>
        <button className="text-sm underline" onClick={onToggleAll}>
          {allChecked ? "Tout décocher" : "Tout cocher"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-auto pr-1">
        {SPEC_KEYS.map((key) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={checked.has(key)}
              onChange={() => toggle(key)}
            />
            <span>{SPEC_LABELS[key] ?? key}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

