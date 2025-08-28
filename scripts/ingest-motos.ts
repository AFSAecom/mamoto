// scripts/ingest-motos.ts
// Lit les fichiers Excel de data/excel/ et génère des JSON "dé-pivotés"
// dans data/generated/.

import * as fs from "node:fs/promises";
import path from "node:path";
import { globby } from "globby";
import * as XLSX from "xlsx";

type SpecValue = string | number | boolean | null;

interface Moto {
  id: string;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  year: number | null;
  price: number | null;
  category: string | null;
  specs: Record<string, SpecValue>;
  sourceFile: string;
  sheet: string;
  createdAt: string;
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeKey(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseNumber(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function parseBoolean(v: unknown): boolean | null {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (["yes", "true", "1", "oui", "vrai"].includes(s)) return true;
  if (["no", "false", "0", "non", "faux"].includes(s)) return false;
  return null;
}

function parseValue(v: unknown): SpecValue {
  const b = parseBoolean(v);
  if (b != null) return b;
  const n = parseNumber(v);
  if (n != null) return n;
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

async function ingest(): Promise<void> {
  const inDir = path.resolve("data/excel");
  const outDir = path.resolve("data/generated");
  await fs.mkdir(outDir, { recursive: true });

  const files = await globby(["*.xlsx", "*.xls"], {
    cwd: inDir,
    absolute: true,
  });

  const motos = new Map<string, Moto>();

  for (const file of files) {
    const buf = await fs.readFile(file);
    const wb = XLSX.read(buf, { type: "buffer" });
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: null,
      }) as any[][];
      if (!rows.length) continue;

      const header = rows[0].map((c) => (c == null ? "" : String(c).trim()));
      const isPivot =
        header.length >= 3 &&
        normalizeKey(header[0]) === "categorie" &&
        normalizeKey(header[1]).startsWith("sous-caracteristique");
      if (!isPivot) continue;

      for (let col = 2; col < header.length; col++) {
        const colName = header[col];
        if (!colName) continue;

        let brand = "";
        let model = "";
        let category: string | null = null;
        let year: number | null = null;
        let price: number | null = null;
        const specs: Record<string, SpecValue> = {};

        for (let r = 1; r < rows.length; r++) {
          const cat = rows[r][0];
          const sub = rows[r][1];
          const val = rows[r][col];
          const catS = String(cat ?? "").trim();
          const subS = String(sub ?? "").trim();

          if (catS === "Informations générales") {
            if (subS === "Marque") brand = String(val ?? "").trim();
            else if (subS === "Modèle") model = String(val ?? "").trim();
            else if (subS === "Année") year = parseNumber(val);
            else if (subS === "Prix (TND)" || subS === "Prix")
              price = parseNumber(val);
            else if (subS === "Segment" || subS === "Catégorie")
              category = String(val ?? "").trim() || null;
          } else {
            const key = normalizeKey(`${catS}_${subS}`);
            specs[key] = parseValue(val);
          }
        }

        if (!brand || !model) continue;

        const id = [slugify(brand), slugify(model), year || ""]
          .filter(Boolean)
          .join("-");

        motos.set(id, {
          id,
          brand,
          brandSlug: slugify(brand),
          model,
          modelSlug: slugify(model),
          year,
          price,
          category,
          specs,
          sourceFile: path.basename(file),
          sheet: sheetName,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  const all = Array.from(motos.values()).sort((a, b) => {
    if (a.brandSlug !== b.brandSlug)
      return a.brandSlug.localeCompare(b.brandSlug);
    if (a.modelSlug !== b.modelSlug)
      return a.modelSlug.localeCompare(b.modelSlug);
    return (b.year ?? 0) - (a.year ?? 0);
  });

  await fs.writeFile(
    path.join(outDir, "motos.json"),
    JSON.stringify(all, null, 2),
  );

  const perBrand: Record<string, Moto[]> = {};
  for (const m of all) {
    if (!perBrand[m.brandSlug]) perBrand[m.brandSlug] = [];
    perBrand[m.brandSlug].push(m);
  }
  for (const [slug, list] of Object.entries(perBrand)) {
    await fs.writeFile(
      path.join(outDir, `motos_${slug}.json`),
      JSON.stringify(list, null, 2),
    );
  }

  console.log(`✅ Ingestion: ${all.length} modèles`);
}

ingest().catch((err) => {
  console.error("❌ Erreur ingestion:", err);
  process.exit(1);
});

