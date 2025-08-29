import path from "path";
import * as XLSX from "xlsx";

// Shared lightweight moto type for Excel-driven pages
export type Moto = {
  model: string;
  slug: string;
  imageUrl?: string;
  specs: { label: string; value: string }[];
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EXCEL_PATH = path.join(
  process.cwd(),
  "data",
  "excel",
  "fiche_technique_moto_30_models_version1.xlsx",
);

export async function loadMotos(): Promise<Moto[]> {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as any[][];
  if (!rows.length) return [];

  const norm = (v: unknown) =>
    v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();

  const headers = rows[0].map(norm);
  const dataRows = rows.slice(1);
  const labels = dataRows.map((r) => norm(r[0]));
  const imageRowIdx = labels.findIndex((l) => l.toLowerCase() === "image");

  const motos: Moto[] = [];

  for (let col = 1; col < headers.length; col++) {
    const model = norm(headers[col]);
    if (!model) continue;
    const slug = slugify(model);
    const image =
      imageRowIdx >= 0 ? norm(dataRows[imageRowIdx][col]) : "";
    const specs: { label: string; value: string }[] = [];

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      if (rowIdx === imageRowIdx) continue;
      const label = norm(dataRows[rowIdx][0]);
      const value = norm(dataRows[rowIdx][col]);
      if (!label || !value) continue;
      specs.push({ label, value });
    }

    motos.push({ model, slug, imageUrl: image || undefined, specs });
  }

  return motos;
}

// ---------------------------------------------------------------------------
// Legacy helpers used by other parts of the project. They rely on the
// previously generated JSON dataset. Keeping them avoids breaking unrelated
// pages while introducing the new Excel-based loader above.

import type { Moto as FullMoto } from "../types/moto";
import raw from "../../data/generated/motos.json";

const ALL: FullMoto[] = (raw as unknown as FullMoto[]) ?? [];

if (typeof window === "undefined") {
  console.log("[motos] loaded entries:", ALL.length);
}

export function getAllMotos(): FullMoto[] {
  return ALL;
}

export function findById(id: string): FullMoto | undefined {
  return ALL.find((m) => m.id === id);
}

export function findByBrand(brandSlug: string): FullMoto[] {
  return ALL.filter((m) => m.brandSlug === brandSlug);
}

// end

