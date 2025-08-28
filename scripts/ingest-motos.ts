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

const ALIAS: Record<string,string> = {
  "cylindree": "displacement_cc", "cylindrée": "displacement_cc",
  "puissance": "horsepower_hp", "puissance_ch": "horsepower_hp", "horsepower": "horsepower_hp",
  "couple": "torque_nm", "poids": "weight_kg", "réservoir": "tank_l", "reservoir": "tank_l",
  "boite": "transmission", "boîte": "transmission", "empattement": "wheelbase_mm",
  "hauteur_de_selle": "seat_height_mm", "refroidissement": "cooling", "abs":"abs","tcs":"tcs"
};

function slugify(s: string): string {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function toKey(...parts: (string|number|null|undefined)[]): string {
  const base = parts.filter(Boolean).map(p => String(p).trim().toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"_")).join("_");
  return ALIAS[base] ?? base;
}
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const m = String(v).replace(/\s/g,"").replace(",",".").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function bool(v: unknown): boolean | null {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (["yes","true","1","oui","vrai"].includes(s)) return true;
  if (["no","false","0","non","faux"].includes(s)) return false;
  return null;
}
function coerce(key: string, v: unknown): SpecValue {
  if (v == null || v === "") return null;
  // num heuristics for typical keys
  if (/_?(price|prix|hp|kw|nm|cc|mm|cm|inch|kg|kmh|mph|rpm|capacity|weight|torque|seat|height|width|length|wheelbase|tank)/.test(key)) {
    const n = num(v); if (n != null) return n;
  }
  const b = bool(v); if (b != null) return b;
  const s = String(v).trim();
  if (s.length <= 14) { const n2 = num(s); if (n2 != null) return n2; }
  return s;
}

function readRows(ws: XLSX.WorkSheet): any[][] {
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
}

function mapCols(arr: any[]): string[] {
  return (arr || []).map(x => (x == null ? "" : String(x).trim()));
}

function isPivotHeader(header: string[]): boolean {
  const norm = (s:string)=> s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"");
  return header.length >= 4
    && norm(header[0]) === "categorie"
    && norm(header[1]).startsWith("sous-caracteristique");
}

function makeId(brand:string, model:string, year:number|null){
  return [slugify(brand), slugify(model), year ?? ""].filter(Boolean).join("-");
}

function ingestPivot(arr: any[][], fileName: string, sheetName: string, out: Map<string, Moto>) {
  const header = mapCols(arr[0]);
  // indices
  const idxCat = 0, idxSub = 1;
  for (let col = 2; col < header.length; col++) {
    const colName = header[col]; if (!colName) continue;

    // lookup core from "Informations générales"
    let brand = "", model = "", category: string|null = null, imageUrl: string|null = null;
    let year: number|null = null, price: number|null = null;

    // scan rows to find core rows
    for (let r = 1; r < arr.length; r++) {
      const cat = arr[r][idxCat], sub = arr[r][idxSub], val = arr[r][col];
      const catS = String(cat ?? "").trim();
      const subS = String(sub ?? "").trim();
      if (catS === "Informations générales") {
        if (subS === "Marque") brand = String(val ?? "").trim();
        else if (subS === "Modèle") model = String(val ?? "").trim();
        else if (subS === "Année") { const n = num(val); if (n != null) year = n; }
        else if (subS === "Prix (TND)") { const n = num(val); if (n != null) price = n; }
        else if (subS === "Segment" || subS === "Catégorie") category = String(val ?? "").trim() || null;
      }
    }
    if (!brand || !model) continue;

    const id = makeId(brand, model, year);
    if (!out.has(id)) {
      out.set(id, {
        id, brand, brandSlug: slugify(brand),
        model, modelSlug: slugify(model),
        year, price, category, imageUrl,
        specs: {},
        sourceFile: fileName, sheet: sheetName,
        createdAt: new Date().toISOString(),
      });
    }
    const moto = out.get(id)!;

    // now collect ALL specs for this model
    for (let r = 1; r < arr.length; r++) {
      const cat = arr[r][idxCat], sub = arr[r][idxSub], val = arr[r][col];
      const catS = String(cat ?? "").trim();
      const subS = String(sub ?? "").trim();
      // skip core rows already mapped
      if (catS === "Informations générales" && ["Marque","Modèle","Année","Prix (TND)","Segment","Catégorie"].includes(subS)) continue;
      const key = toKey(catS, subS);
      moto.specs[key] = coerce(key, val);
    }
  }
}

function ingestLarge(rows: Record<string, unknown>[], fileName: string, sheetName: string, out: Map<string, Moto>) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const lower = (s:string)=> s.toLowerCase();
  const get = (...names:string[]) => cols.find(c => names.some(n => lower(c).includes(n)));
  const m = {
    brand: get("brand","marque","make"),
    model: get("model","modèle","modele"),
    year: get("year","année","annee"),
    price: get("price","prix"),
    category: get("category","catégorie","categorie"),
    image: get("image","imageurl","photo","img"),
  };
  for (const row of rows) {
    const brand = String(row[m.brand ?? ""] ?? "").trim();
    const model = String(row[m.model ?? ""] ?? "").trim();
    if (!brand || !model) continue;
    const year = m.year ? num(row[m.year as string]) : null;
    const price = m.price ? num(row[m.price as string]) : null;
    const category = m.category ? (String(row[m.category as string] ?? "").trim() || null) : null;
    const imageUrl = m.image ? (String(row[m.image as string] ?? "").trim() || null) : null;

    const id = makeId(brand, model, year);
    if (!out.has(id)) {
      out.set(id, {
        id, brand, brandSlug: slugify(brand),
        model, modelSlug: slugify(model),
        year, price, category, imageUrl,
        specs: {}, sourceFile: fileName, sheet: sheetName,
        createdAt: new Date().toISOString(),
      });
    }
    const moto = out.get(id)!;

    for (const [col, v] of Object.entries(row)) {
      if (!col || v == null || v === "") continue;
      const lc = col.toLowerCase().trim();
      const isCore = [m.brand,m.model,m.year,m.price,m.category,m.image]
        .filter(Boolean).some(c => c && c.toLowerCase().trim() === lc);
      if (isCore) continue;
      const key = toKey(col);
      moto.specs[key] = coerce(key, v);
    }
  }
}

async function main(){
  const inDir = path.resolve("data/excel");
  const outDir = path.resolve("data/generated");
  await fs.ensureDir(outDir);

  const files = await globby(["*.xlsx","*.xls"], { cwd: inDir, absolute: true });
  if (!files.length) { console.log("Aucun Excel dans data/excel/"); return; }

  const byId = new Map<string, Moto>();

  for (const file of files) {
    const wb = XLSX.readFile(file);
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const arr = readRows(ws);
      if (!arr.length) continue;
      const header = mapCols(arr[0]);

      if (isPivotHeader(header)) {
        // PIVOT Catégorie / Sous-caractéristique → dé-pivoter
        ingestPivot(arr, path.basename(file), sheetName, byId);
      } else {
        // fallback: format LARGE (1 ligne = 1 modèle)
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null }) as Record<string, unknown>[];
        ingestLarge(rows, path.basename(file), sheetName, byId);
      }
    }
  }

  const all = Array.from(byId.values()).sort((a,b)=>{
    if (a.brandSlug !== b.brandSlug) return a.brandSlug.localeCompare(b.brandSlug);
    if (a.modelSlug !== b.modelSlug) return a.modelSlug.localeCompare(b.modelSlug);
    return (b.year ?? 0) - (a.year ?? 0);
  });

  await fs.writeJSON(path.join(outDir,"motos.json"), all, { spaces: 2 });

  // par marque
  const per = new Map<string, Moto[]>();
  for (const m of all) {
    if (!per.has(m.brandSlug)) per.set(m.brandSlug, []);
    per.get(m.brandSlug)!.push(m);
  }
  for (const [slug, list] of per) {
    await fs.writeJSON(path.join(outDir,`motos_${slug}.json`), list, { spaces: 2 });
  }

  // petit résumé pour debug
  const sample = all.slice(0, 3).map(m => ({ id: m.id, brand: m.brand, model: m.model, specs: Object.keys(m.specs).length }));
  console.log(`✅ Ingestion pivot: ${all.length} modèles`);
  console.log("Exemples:", sample);
}

main().catch(e=>{ console.error("❌ Erreur ingestion:", e); process.exit(1); });
