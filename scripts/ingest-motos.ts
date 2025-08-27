// scripts/ingest-motos.ts
import fs from "fs-extra";
import path from "node:path";
import { globby } from "globby";
import * as XLSX from "xlsx";
import { z } from "zod";

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toKey(input: string): string {
  return slugify(input).replace(/-/g, "_");
}

function parseNumber(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  const s = String(val).trim().replace(",", ".");
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseBoolean(val: unknown): boolean | null {
  if (val == null) return null;
  const s = String(val).trim().toLowerCase();
  if (["yes", "oui", "true", "vrai", "1"].includes(s)) return true;
  if (["no", "non", "false", "faux", "0"].includes(s)) return false;
  return null;
}

function coerceValue(
  key: string,
  raw: unknown,
): string | number | boolean | null {
  if (raw == null || raw === "") return null;
  if (
    /_?(price|prix|capacity|weight|power|hp|kw|nm|cc|mm|cm|inch|kmh|mph|rpm|size|height|width|length|wheelbase|seat)/.test(
      key,
    )
  ) {
    const n = parseNumber(raw);
    if (n !== null) return n;
  }
  const b = parseBoolean(raw);
  if (b !== null) return b;
  return String(raw).trim();
}

const CoreSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().nullable().optional(),
  price: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

function sheetRows(sheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });
  if (!rows.length) return [];
  const header = rows[0].map((h: any) => (h == null ? "" : String(h).trim()));
  return rows.slice(1).map((arr) => {
    const obj: Record<string, unknown> = {};
    header.forEach((h, i) => {
      if (!h) return;
      obj[h] = arr[i] ?? null;
    });
    return obj;
  });
}

function pickMainSheet(wb: XLSX.WorkBook): string | null {
  if (!wb.SheetNames.length) return null;
  const priority = ["models", "modeles", "motos", "data", "sheet1"];
  const lower = wb.SheetNames.map((n) => n.toLowerCase());
  for (const p of priority) {
    const idx = lower.findIndex((n) => n.includes(p));
    if (idx >= 0) return wb.SheetNames[idx];
  }
  let best = wb.SheetNames[0],
    bestCount = -1;
  for (const name of wb.SheetNames) {
    const rows = sheetRows(wb.Sheets[name]);
    if (rows.length > bestCount) {
      best = name;
      bestCount = rows.length;
    }
  }
  return best;
}

function mergeSpecs(base: any, extraRows: Record<string, unknown>[]) {
  const brandKeys = ["brand", "marque", "make"];
  const modelKeys = ["model", "modèle", "modele"];
  const pick = (obj: Record<string, unknown>, keys: string[]) => {
    for (const k of keys) {
      const v = obj[k] ?? obj[k.toLowerCase()];
      if (v != null && v !== "") return String(v).trim();
    }
    return null;
  };
  for (const row of extraRows) {
    const b = pick(row, brandKeys);
    const m = pick(row, modelKeys);
    if (!b || !m) continue;
    if (slugify(b) === base.brandSlug && slugify(m) === base.modelSlug) {
      const keyRaw =
        row["key"] ??
        row["clé"] ??
        row["cle"] ??
        row["spec"] ??
        row["item"] ??
        null;
      const valRaw =
        row["value"] ?? row["valeur"] ?? row["val"] ?? row["data"] ?? null;
      if (keyRaw) {
        const key = toKey(String(keyRaw));
        base.specs[key] = coerceValue(key, valRaw);
        continue;
      }
      for (const [k, v] of Object.entries(row)) {
        const lk = k.toLowerCase().trim();
        if (
          ["brand", "marque", "make", "model", "modèle", "modele"].includes(lk)
        )
          continue;
        const key = toKey(k);
        base.specs[key] = coerceValue(key, v);
      }
    }
  }
}

function buildMotoFromRow(
  row: Record<string, unknown>,
  sourceFile: string,
  sheetName: string | null,
) {
  const map = new Map<string, unknown>();
  for (const [k, v] of Object.entries(row)) map.set(k.toLowerCase(), v);

  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = map.get(k);
      if (v != null && v !== "") return v;
    }
    return null;
  };

  const brand = String(get("brand", "marque", "make") ?? "").trim();
  const model = String(get("model", "modèle", "modele") ?? "").trim();
  if (!brand || !model) return null;

  const year = parseNumber(get("year", "année", "annee"));
  const price = parseNumber(get("price", "prix"));
  const category = get("category", "catégorie", "categorie");
  const imageUrl = get("image", "imageurl", "photo", "img");

  const specs: Record<string, unknown> = {};
  for (const [rawKey, rawVal] of Object.entries(row)) {
    if (!rawKey || rawVal == null || rawVal === "") continue;
    const k = rawKey.toLowerCase().trim();
    if (
      [
        "brand",
        "marque",
        "make",
        "model",
        "modèle",
        "modele",
        "year",
        "année",
        "annee",
        "price",
        "prix",
        "category",
        "catégorie",
        "categorie",
        "image",
        "imageurl",
        "photo",
        "img",
      ].includes(k)
    )
      continue;
    const key = toKey(rawKey);
    specs[key] = coerceValue(key, rawVal);
  }

  const brandSlug = slugify(brand);
  const modelSlug = slugify(model);
  const id = [brandSlug, modelSlug, year ?? ""].filter(Boolean).join("-");

  const core = {
    brand,
    model,
    year: year ?? null,
    price: price ?? null,
    category: category ? String(category) : null,
    imageUrl: imageUrl ? String(imageUrl) : null,
  };
  const ok = CoreSchema.safeParse(core);
  if (!ok.success) return null;

  return {
    id,
    brand,
    brandSlug,
    model,
    modelSlug,
    year: ok.data.year ?? null,
    price: ok.data.price ?? null,
    category: ok.data.category ?? null,
    imageUrl: ok.data.imageUrl ?? null,
    specs: specs as Record<string, string | number | boolean | null>,
    sourceFile: path.basename(sourceFile),
    sheet: sheetName,
    createdAt: new Date().toISOString(),
  };
}

async function main() {
  const inputDir = path.resolve("data/excel");
  const outDir = path.resolve("data/generated");
  await fs.ensureDir(outDir);

  const files = await globby(["*.xlsx", "*.xls"], {
    cwd: inputDir,
    absolute: true,
  });
  if (!files.length) {
    console.log(
      "Aucun Excel trouvé dans data/excel/. Place un fichier puis relance.",
    );
    return;
  }

  const all: any[] = [];
  for (const file of files) {
    const wb = XLSX.readFile(file);
    const best = pickMainSheet(wb);
    if (!best) continue;
    const rows = sheetRows(wb.Sheets[best]);

    // specs additionnelles si des onglets 'Specs*'
    const extra: Record<string, unknown>[] = [];
    wb.SheetNames.forEach((n) => {
      if (/^specs/i.test(n)) extra.push(...sheetRows(wb.Sheets[n]));
    });

    for (const row of rows) {
      const moto = buildMotoFromRow(row, file, best);
      if (!moto) continue;
      if (extra.length) mergeSpecs(moto, extra);
      all.push(moto);
    }
  }

  all.sort((a, b) => {
    if (a.brandSlug !== b.brandSlug)
      return a.brandSlug.localeCompare(b.brandSlug);
    if (a.modelSlug !== b.modelSlug)
      return a.modelSlug.localeCompare(b.modelSlug);
    return (b.year ?? 0) - (a.year ?? 0);
  });

  await fs.writeJSON(path.join(outDir, "motos.json"), all, { spaces: 2 });

  // par marque
  const byBrand = new Map<string, any[]>();
  for (const m of all) {
    if (!byBrand.has(m.brandSlug)) byBrand.set(m.brandSlug, []);
    byBrand.get(m.brandSlug)!.push(m);
  }
  for (const [slug, list] of byBrand) {
    await fs.writeJSON(path.join(outDir, `motos_${slug}.json`), list, {
      spaces: 2,
    });
  }

  console.log(
    `✅ Ingestion: ${all.length} modèles → data/generated/motos.json (+ ${byBrand.size} fichiers par marque)`,
  );
}

main().catch((e) => {
  console.error("❌ Erreur ingestion:", e);
  process.exit(1);
});
