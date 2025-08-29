import "server-only";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type Moto = {
  model: string;
  slug: string;
  imageUrl?: string;
  specs: { label: string; value: string }[];
};

function slugify(str: string) {
  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let cache: Moto[] | null = null;

export async function loadMotos(): Promise<Moto[]> {
  if (cache) return cache;

  const excelDir = path.join(process.cwd(), "data", "excel");
  const file = fs
    .readdirSync(excelDir)
    .find((f) => /\.(xlsx|xls)$/i.test(f));
  if (!file) return [];

  const wb = XLSX.readFile(path.join(excelDir, file));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (!rows.length) return [];

  const header = rows[0];
  const motos: Moto[] = [];

  for (let col = 2; col < header.length; col++) {
    const model = String(header[col] ?? "").trim();
    if (!model) continue;
    const slug = slugify(model);

    let imageUrl: string | undefined;
    const specs: { label: string; value: string }[] = [];

    for (let r = 1; r < rows.length; r++) {
      const label = String(rows[r][1] ?? "").trim();
      if (!label) continue;
      const rawVal = rows[r][col];
      if (label.toLowerCase() === "image") {
        const v = String(rawVal ?? "").trim();
        if (v) imageUrl = v;
        continue;
      }
      const value = String(rawVal ?? "").trim();
      if (value) specs.push({ label, value });
    }

    motos.push({ model, slug, imageUrl, specs });
  }

  cache = motos;
  return motos;
}

