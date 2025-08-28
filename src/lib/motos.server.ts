import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type SpecValue = string | number | boolean | null;
export type Specs = Record<string, SpecValue>;
export type Moto = {
  id: string;
  brand: string; brandSlug: string;
  model: string; modelSlug: string;
  year?: number | null;
  price?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  specs: Specs;
  sourceFile?: string; sheet?: string | null;
  createdAt?: string;
};

const ROOT = process.cwd();

function toImageUrl(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  // enlever "public/" si présent
  let v = s.replace(/^public\//i, "");
  // URL absolue → garder
  if (/^https?:\/\//i.test(v)) return v;
  // déjà un chemin absolu → garder
  if (v.startsWith("/")) return v;
  // sinon, supposé être un nom de fichier sous /motos/
  if (!v.startsWith("motos/")) v = "motos/" + v;
  return "/" + v;
}

function slugify(s: string) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function toKey(...parts: (string|number|null|undefined)[]) {
  return parts
    .filter(Boolean)
    .map(p => String(p).trim().toLowerCase()
      .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9]+/g,"_"))
    .join("_");
}
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const m = String(v).replace(/\s/g,"").replace(",",".").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}
function bool(v: unknown): boolean | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (["yes","true","1","oui","vrai"].includes(s)) return true;
  if (["no","false","0","non","faux"].includes(s)) return false;
  return null;
}
function coerce(key: string, v: unknown): SpecValue {
  if (v == null || v === "") return null;
  if (/_?(price|prix|hp|kw|nm|cc|mm|cm|inch|kg|kmh|mph|rpm|capacity|weight|torque|seat|height|width|length|wheelbase|tank)/.test(key)) {
    const n = num(v); if (n != null) return n;
  }
  const b = bool(v); if (b != null) return b;
  const s = String(v).trim();
  if (s.length <= 14) { const n2 = num(s); if (n2 != null) return n2; }
  return s;
}

function safeReadJSON(...parts: string[]) {
  try {
    const p = path.join(ROOT, ...parts);
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      if (Array.isArray(data) && data.length) return data as Moto[];
    }
  } catch {}
  return null;
}

function makeId(brand: string, model: string, year: number | null) {
  return [slugify(brand), slugify(model), year ?? ""].filter(Boolean).join("-");
}

function ingestPivotInto(all: Moto[], arr: any[][], fileName: string, sheetName: string) {
  const header = (arr[0] || []).map((h:any)=>String(h??"").trim());
  const idxCat = 0, idxSub = 1;
  // pour chaque colonne modèle
  for (let col = 2; col < header.length; col++) {
    const colName = header[col]; if (!colName) continue;
    let brand = "", model = "", category: string|null = null;
    let year: number|null = null, price: number|null = null;
    let imageUrl: string | null = null;

    for (let r = 1; r < arr.length; r++) {
      const cat = String(arr[r][idxCat] ?? "").trim();
      const sub = String(arr[r][idxSub] ?? "").trim();
      const val = arr[r][col];
      if (cat === "Informations générales") {
        const key = sub.toLowerCase();
        if (sub === "Marque") brand = String(val ?? "").trim();
        else if (sub === "Modèle") model = String(val ?? "").trim();
        else if (sub === "Année") { const n = num(val); if (n != null) year = n; }
        else if (sub === "Prix (TND)") { const n = num(val); if (n != null) price = n; }
        else if (sub === "Segment" || sub === "Catégorie") category = String(val ?? "").trim() || null;
        if (key === "image" || key === "images" || key === "photo" || key === "photos") {
          imageUrl = toImageUrl(val);
        }
      }
    }
    if (!brand || !model) continue;

    const id = makeId(brand, model, year);
    let moto = all.find(m => m.id === id);
    if (!moto) {
      moto = {
        id, brand, brandSlug: slugify(brand),
        model, modelSlug: slugify(model),
        year, price, category, imageUrl: null,
        specs: {}, sourceFile: fileName, sheet: sheetName,
        createdAt: new Date().toISOString(),
      };
      all.push(moto);
    }
    if (imageUrl) moto.imageUrl = imageUrl;
    for (let r = 1; r < arr.length; r++) {
      const cat = String(arr[r][idxCat] ?? "").trim();
      const sub = String(arr[r][idxSub] ?? "").trim();
      const val = arr[r][col];
      if (cat === "Informations générales" && ["Marque","Modèle","Année","Prix (TND)","Segment","Catégorie"].includes(sub)) continue;
      const key = toKey(cat, sub);
      moto.specs[key] = coerce(key, val);
      if (!moto.imageUrl && typeof val === "string" && /\.(png|jpe?g|webp|gif|svg)$/i.test(val.trim())) {
        moto.imageUrl = toImageUrl(val);
      }
    }
  }
}

function ingestLargeInto(all: Moto[], rows: Record<string, unknown>[], fileName: string, sheetName: string) {
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
    image: get("image","images","photo","photos"),
  };
  for (const row of rows) {
    const brand = String(row[m.brand ?? ""] ?? "").trim();
    const model = String(row[m.model ?? ""] ?? "").trim();
    if (!brand || !model) continue;
    const year = m.year ? num(row[m.year as string]) : null;
    const price = m.price ? num(row[m.price as string]) : null;
    const category = m.category ? (String(row[m.category as string] ?? "").trim() || null) : null;
    const imageUrl = m.image ? toImageUrl(row[m.image as string]) : null;

    const id = makeId(brand, model, year);
    let moto = all.find(m => m.id === id);
    if (!moto) {
      moto = {
        id, brand, brandSlug: slugify(brand),
        model, modelSlug: slugify(model),
        year, price, category, imageUrl, specs: {},
        sourceFile: fileName, sheet: sheetName, createdAt: new Date().toISOString()
      };
      all.push(moto);
    }
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

export function loadAllMotos(): Moto[] {
  // 1) Essayer le JSON généré
  const fromJson = safeReadJSON("data","generated","motos.json");
  if (fromJson) return fromJson;

  // 2) Fallback: lire l'Excel et générer le JSON
  const excelDir = path.join(ROOT, "data", "excel");
  const files = fs.existsSync(excelDir)
    ? fs.readdirSync(excelDir).filter(f => /\.(xlsx|xls)$/i.test(f))
    : [];
  const all: Moto[] = [];
  for (const file of files) {
    const full = path.join(excelDir, file);
    const wb = XLSX.readFile(full);
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
      if (!arr.length) continue;
      const header = (arr[0]||[]).map((h:any)=>String(h??"").trim());
      const isPivot = header.length >= 4
        && header[0].toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"")==="categorie"
        && header[1].toLowerCase().includes("sous");
      if (isPivot) {
        ingestPivotInto(all, arr, path.basename(file), sheetName);
      } else {
        const rows = XLSX.utils.sheet_to_json(ws, { defval: null }) as Record<string, unknown>[];
        ingestLargeInto(all, rows, path.basename(file), sheetName);
      }
    }
  }
  // écrire le JSON pour les prochains builds
  if (all.length) {
    const outDir = path.join(ROOT, "data", "generated");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "motos.json"), JSON.stringify(all, null, 2), "utf8");
  }
  // trier
  return all.sort((a,b)=>{
    if (a.brandSlug !== b.brandSlug) return a.brandSlug.localeCompare(b.brandSlug);
    if (a.modelSlug !== b.modelSlug) return a.modelSlug.localeCompare(b.modelSlug);
    return (b.year ?? 0) - (a.year ?? 0);
  });
}

export function findById(id: string): Moto | undefined {
  return loadAllMotos().find(m => m.id === id);
}

