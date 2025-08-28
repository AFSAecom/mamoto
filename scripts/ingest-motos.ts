// scripts/ingest-motos.ts
import fs from "fs-extra";
import path from "node:path";
import { globby } from "globby";
import * as XLSX from "xlsx";

type SpecValue = string | number | boolean | null;
type Specs = Record<string, SpecValue>;
type Moto = {
  id: string;
  brand: string; brandSlug: string;
  model: string; modelSlug: string;
  year?: number | null;
  price?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  specs: Specs;
  sourceFile: string;
  sheet?: string | null;
  createdAt: string;
};

function slugify(s: string): string {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function toKey(h: string): string {
  return slugify(h).replace(/-/g,"_");
}
function num(s: unknown): number | null {
  if (s == null || s === "") return null;
  if (typeof s === "number" && Number.isFinite(s)) return s;
  const m = String(s).replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function bool(s: unknown): boolean | null {
  if (s == null) return null;
  const v = String(s).trim().toLowerCase();
  if (["yes","true","1","oui","vrai"].includes(v)) return true;
  if (["no","false","0","non","faux"].includes(v)) return false;
  return null;
}
// heuristique: nombres pour clés “numériques”
function coerce(key: string, v: unknown): SpecValue {
  if (v == null || v === "") return null;
  if (/_?(price|prix|power|hp|kw|nm|cc|mm|cm|inch|kg|kmh|mph|rpm|capacity|weight|torque|seat|height|width|length|wheelbase)/.test(key)) {
    const n = num(v); if (n != null) return n;
  }
  const b = bool(v); if (b != null) return b;
  const s = String(v).trim();
  // “1103cc” → 1103 si court
  if (s.length <= 12) {
    const n2 = num(s); if (n2 != null) return n2;
  }
  return s;
}

function readRows(ws: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!rows.length) return [];
  const header = rows[0].map((h: any) => (h == null ? "" : String(h).trim()));
  return rows.slice(1).map((arr) => {
    const o: Record<string, unknown> = {};
    header.forEach((h, i) => { if (h) o[h] = arr[i] ?? null; });
    return o;
  });
}

function pickMainSheet(wb: XLSX.WorkBook): string | null {
  if (!wb.SheetNames.length) return null;
  const prio = ["models","modeles","motos","data","sheet1"];
  const L = wb.SheetNames.map(n => n.toLowerCase());
  for (const p of prio) {
    const i = L.findIndex(n => n.includes(p));
    if (i >= 0) return wb.SheetNames[i];
  }
  // fallback: plus grande
  let best = wb.SheetNames[0], count = -1;
  for (const n of wb.SheetNames) {
    const c = readRows(wb.Sheets[n]).length;
    if (c > count) { best = n; count = c; }
  }
  return best;
}

type KeyMap = { brand?: string; model?: string; year?: string; price?: string; category?: string; image?: string; key?: string; value?: string; };
function mapColumns(cols: string[]): KeyMap {
  const lower = (x: string) => x.toLowerCase();
  const get = (...names: string[]) => cols.find(c => names.some(n => lower(c).includes(n)));
  return {
    brand: get("brand","marque","make"),
    model: get("model","modèle","modele"),
    year: get("year","année","annee"),
    price: get("price","prix"),
    category: get("category","catégorie","categorie"),
    image: get("image","imageurl","photo","img"),
    key: get("key","clé","cle","spec","item","caracteristique","caractéristique"),
    value: get("value","valeur","val","data"),
  };
}

function idFor(brand: string, model: string, year: number | null): string {
  return [slugify(brand), slugify(model), year ?? ""].filter(Boolean).join("-");
}

async function main() {
  const inDir = path.resolve("data/excel");
  const outDir = path.resolve("data/generated");
  await fs.ensureDir(outDir);

  const files = await globby(["*.xlsx","*.xls"], { cwd: inDir, absolute: true });
  if (!files.length) {
    console.log("Aucun Excel dans data/excel/");
    return;
  }

  // Registre par id
  const byId = new Map<string, Moto>();

  for (const file of files) {
    const wb = XLSX.readFile(file);
    const main = pickMainSheet(wb);
    const sheets = wb.SheetNames;
    for (const name of sheets) {
      const ws = wb.Sheets[name];
      const rows = readRows(ws);
      if (!rows.length) continue;

      const cols = Object.keys(rows[0] ?? {});
      const m = mapColumns(cols);

      // MODE LONG (clé/valeur) si on a brand+model+(key,value)
      const isLong = !!(m.brand && m.model && m.key && m.value);

      for (const row of rows) {
        const brand = String(row[m.brand ?? ""] ?? "").trim();
        const model = String(row[m.model ?? ""] ?? "").trim();
        if (!brand || !model) continue;

        const year = m.year ? num(row[m.year]) : null;
        const price = m.price ? num(row[m.price]) : null;
        const category = m.category ? String(row[m.category] ?? "").trim() || null : null;
        const imageUrl = m.image ? String(row[m.image] ?? "").trim() || null : null;

        const _id = idFor(brand, model, year ?? null);
        if (!byId.has(_id)) {
          byId.set(_id, {
            id: _id,
            brand, brandSlug: slugify(brand),
            model, modelSlug: slugify(model),
            year: year ?? null,
            price: price ?? null,
            category,
            imageUrl,
            specs: {},
            sourceFile: path.basename(file),
            sheet: name,
            createdAt: new Date().toISOString(),
          });
        }
        const moto = byId.get(_id)!;

        if (isLong) {
          // ex: Brand | Model | Year | Key | Value (plusieurs lignes par modèle)
          const kRaw = String(row[m.key!]).trim();
          const vRaw = row[m.value!];
          if (kRaw) {
            const k = toKey(kRaw);
            moto.specs[k] = coerce(k, vRaw);
          }
        } else {
          // MODE LARGE: toutes les colonnes sauf cœur → specs
          for (const [col, v] of Object.entries(row)) {
            if (!col || v == null || v === "") continue;
            const lc = col.toLowerCase().trim();
            const isCore = [m.brand, m.model, m.year, m.price, m.category, m.image]
              .filter(Boolean)
              .some((c) => c && c.toLowerCase().trim() === lc);
            if (isCore) continue;
            const k = toKey(col);
            moto.specs[k] = coerce(k, v);
          }
        }

        // garde les infos “cœur” non vides (si vues sur une autre ligne/feuille)
        if (price != null) moto.price = price;
        if (category && !moto.category) moto.category = category;
        if (imageUrl && !moto.imageUrl) moto.imageUrl = imageUrl;
      }
    }
  }

  // Sort et écriture
  const all = Array.from(byId.values()).sort((a, b) => {
    if (a.brandSlug !== b.brandSlug) return a.brandSlug.localeCompare(b.brandSlug);
    if (a.modelSlug !== b.modelSlug) return a.modelSlug.localeCompare(b.modelSlug);
    return (b.year ?? 0) - (a.year ?? 0);
  });

  await fs.writeJson(path.join(outDir, "motos.json"), all, { spaces: 2 });

  // par marque
  const per = new Map<string, Moto[]>();
  for (const m of all) {
    if (!per.has(m.brandSlug)) per.set(m.brandSlug, []);
    per.get(m.brandSlug)!.push(m);
  }
  for (const [slug, list] of per) {
    await fs.writeJson(path.join(outDir, `motos_${slug}.json`), list, { spaces: 2 });
  }

  console.log(`✅ Ingestion v2: ${all.length} modèles, specs fusionnées (LARGE+LONG) → data/generated/`);
}

main().catch((e) => { console.error("❌ Erreur ingestion v2:", e); process.exit(1); });

