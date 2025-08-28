import fs from "fs-extra";
import path from "node:path";
import { globby } from "globby";
import * as XLSX from "xlsx";

type SpecValue = string | number | boolean | null;
type Specs = Record<string, SpecValue>;
type Moto = {
  id: string;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  year?: number | null;
  price?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  specs: Specs;
  sourceFile: string;
  sheet?: string | null;
  createdAt: string;
};

const ALIAS: Record<string, string> = {
  // alias fréquents (fr/en) → clé canonique (facultatif, étendre si besoin)
  cylindree: "displacement_cc",
  cylindrée: "displacement_cc",
  engine: "engine",
  puissance: "horsepower_hp",
  horsepower: "horsepower_hp",
  "puissance (ch)": "horsepower_hp",
  couple: "torque_nm",
  torque: "torque_nm",
  poids: "weight_kg",
  "poids (kg)": "weight_kg",
  reservoir: "tank_l",
  réservoir: "tank_l",
  "fuel tank": "tank_l",
  boite: "transmission",
  boîte: "transmission",
  transmission: "transmission",
  "hauteur de selle": "seat_height_mm",
  empattement: "wheelbase_mm",
  abs: "abs",
  tcs: "tcs",
  refroidissement: "cooling",
};

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function toKey(h: string): string {
  const base = slugify(h).replace(/-/g, "_");
  return ALIAS[base] ?? base;
}
function num(s: unknown): number | null {
  if (s == null || s === "") return null;
  if (typeof s === "number" && Number.isFinite(s)) return s;
  const m = String(s)
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function bool(s: unknown): boolean | null {
  if (s == null) return null;
  const v = String(s).trim().toLowerCase();
  if (["yes", "true", "1", "oui", "vrai"].includes(v)) return true;
  if (["no", "false", "0", "non", "faux"].includes(v)) return false;
  return null;
}
function coerce(key: string, v: unknown): SpecValue {
  if (v == null || v === "") return null;
  if (
    /_?(price|prix|hp|kw|nm|cc|mm|cm|inch|kg|kmh|mph|rpm|capacity|weight|torque|seat|height|width|length|wheelbase|tank)/.test(
      key,
    )
  ) {
    const n = num(v);
    if (n != null) return n;
  }
  const b = bool(v);
  if (b != null) return b;
  const s = String(v).trim();
  if (s.length <= 14) {
    const n2 = num(s);
    if (n2 != null) return n2;
  }
  return s;
}

function rows(ws: XLSX.WorkSheet): Record<string, unknown>[] {
  const A: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!A.length) return [];
  const H = A[0].map((h: any) => (h == null ? "" : String(h).trim()));
  return A.slice(1).map((arr) => {
    const o: Record<string, unknown> = {};
    H.forEach((h, i) => {
      if (h) o[h] = arr[i] ?? null;
    });
    return o;
  });
}

function mapColumns(cols: string[]) {
  const lower = (x: string) => x.toLowerCase();
  const get = (...names: string[]) =>
    cols.find((c) => names.some((n) => lower(c).includes(n)));
  return {
    brand: get("brand", "marque", "make"),
    model: get("model", "modèle", "modele"),
    year: get("year", "année", "annee"),
    price: get("price", "prix"),
    category: get("category", "catégorie", "categorie"),
    image: get("image", "imageurl", "photo", "img"),
    key: get(
      "key",
      "clé",
      "cle",
      "spec",
      "item",
      "caracteristique",
      "caractéristique",
    ),
    value: get("value", "valeur", "val", "data"),
  };
}

function makeId(brand: string, model: string, year: number | null) {
  return [slugify(brand), slugify(model), year ?? ""].filter(Boolean).join("-");
}

async function main() {
  const inDir = path.resolve("data/excel");
  const outDir = path.resolve("data/generated");
  await fs.ensureDir(outDir);

  const files = await globby(["*.xlsx", "*.xls"], {
    cwd: inDir,
    absolute: true,
  });
  if (!files.length) {
    console.log("Aucun Excel dans data/excel/");
    return;
  }

  const byId = new Map<string, Moto>();

  for (const file of files) {
    const wb = XLSX.readFile(file);
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const R = rows(ws);
      if (!R.length) continue;

      const cols = Object.keys(R[0] ?? {});
      const m = mapColumns(cols);
      const isLong = !!(m.brand && m.model && m.key && m.value);

      for (const r of R) {
        const brand = String(r[m.brand ?? ""] ?? "").trim();
        const model = String(r[m.model ?? ""] ?? "").trim();
        if (!brand || !model) continue;

        const year = m.year ? num(r[m.year]) : null;
        const price = m.price ? num(r[m.price]) : null;
        const category = m.category
          ? String(r[m.category] ?? "").trim() || null
          : null;
        const imageUrl = m.image
          ? String(r[m.image] ?? "").trim() || null
          : null;

        const id = makeId(brand, model, year ?? null);
        if (!byId.has(id)) {
          byId.set(id, {
            id,
            brand,
            brandSlug: slugify(brand),
            model,
            modelSlug: slugify(model),
            year: year ?? null,
            price: price ?? null,
            category,
            imageUrl,
            specs: {},
            sourceFile: path.basename(file),
            sheet: sheetName,
            createdAt: new Date().toISOString(),
          });
        }
        const moto = byId.get(id)!;

        if (isLong) {
          const kRaw = String(r[m.key!]).trim();
          const vRaw = r[m.value!];
          if (kRaw) {
            const k = toKey(kRaw);
            moto.specs[k] = coerce(k, vRaw);
          }
        } else {
          // LARGE: toutes les colonnes non “cœur” → specs
          for (const [col, v] of Object.entries(r)) {
            if (!col || v == null || v === "") continue;
            const lc = col.toLowerCase().trim();
            const isCore = [
              m.brand,
              m.model,
              m.year,
              m.price,
              m.category,
              m.image,
            ]
              .filter(Boolean)
              .some((c) => c && c.toLowerCase().trim() === lc);
            if (isCore) continue;
            const k = toKey(col);
            moto.specs[k] = coerce(k, v);
          }
        }

        // enrichir cœur si vu ailleurs
        if (price != null) moto.price = price;
        if (category && !moto.category) moto.category = category;
        if (imageUrl && !moto.imageUrl) moto.imageUrl = imageUrl;
      }
    }
  }

  const all = Array.from(byId.values()).sort((a, b) => {
    if (a.brandSlug !== b.brandSlug)
      return a.brandSlug.localeCompare(b.brandSlug);
    if (a.modelSlug !== b.modelSlug)
      return a.modelSlug.localeCompare(b.modelSlug);
    return (b.year ?? 0) - (a.year ?? 0);
  });

  await fs.writeJson(path.join(outDir, "motos.json"), all, { spaces: 2 });

  const perBrand = new Map<string, Moto[]>();
  for (const m of all) {
    const k = m.brandSlug;
    if (!perBrand.has(k)) perBrand.set(k, []);
    perBrand.get(k)!.push(m);
  }
  for (const [slug, list] of perBrand) {
    await fs.writeJson(path.join(outDir, `motos_${slug}.json`), list, {
      spaces: 2,
    });
  }

  console.log(
    `✅ Ingestion v3: ${all.length} modèles, specs fusionnées (tous onglets + large/long)`,
  );
}

main().catch((e) => {
  console.error("❌ Erreur ingestion:", e);
  process.exit(1);
});
