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

// Normalise et filtre le JSON, évite les null/undefined bizarres
export function ensureSpecGroups(raw: any): MotoSpecGroup[] {
  if (!raw) return [];
  let arr: any[] = Array.isArray(raw) ? raw : [];
  return arr.map((g) => {
    const group = (g?.group ?? "").toString() || "Caractéristiques";
    const itemsIn = Array.isArray(g?.items) ? g.items : [];
    const items = itemsIn
      .map((it: any) => ({
        key: (it?.key ?? "").toString() || "unknown",
        label: it?.label ?? null,
        unit: it?.unit ?? null,
        value_text: it?.value_text ?? null,
        value_number: typeof it?.value_number === "number" ? it.value_number : (it?.value_number ?? null),
        value_json: it?.value_json ?? null,
      }))
      .filter((it: MotoSpecItem) => !!it.key);
    return { group, items };
  });
}
