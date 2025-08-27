import path from "node:path";
import { ensureDir, writeJSON } from "fs-extra";
import { globby } from "globby";
import * as XLSX from "xlsx";
import type { Moto, SpecValue, Specs } from "../src/types/moto";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function snakeCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.toLowerCase())
    .join("_");
}

async function readExcelFiles(): Promise<Moto[]> {
  const files = await globby("data/excel/**/*.{xlsx,xls}");
  if (!files.length) {
    console.log("No Excel files found in data/excel.");
    return [];
  }

  const motos: Moto[] = [];

  for (const file of files) {
    const workbook = XLSX.readFile(file);
    const sheetNames = workbook.SheetNames;
    let bestSheetName = sheetNames[0];
    let bestRows: any[] = [];

    for (const name of sheetNames) {
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
        defval: null,
      });
      if (rows.length > bestRows.length) {
        bestRows = rows;
        bestSheetName = name;
      }
    }

    for (const row of bestRows) {
      const normalized: Record<string, SpecValue> = {};
      for (const [key, value] of Object.entries(row)) {
        normalized[snakeCase(key)] = value as SpecValue;
      }

      const brand = String(normalized["brand"] ?? "").trim();
      const model = String(normalized["model"] ?? "").trim();

      const moto: Moto = {
        id:
          String(normalized["id"]) ||
          slugify(`${brand}-${model}-${Date.now()}`),
        brand,
        brandSlug: slugify(brand),
        model,
        modelSlug: slugify(model),
        year:
          normalized["year"] !== null && normalized["year"] !== undefined
            ? Number(normalized["year"])
            : undefined,
        price:
          normalized["price"] !== null && normalized["price"] !== undefined
            ? Number(normalized["price"])
            : undefined,
        category: normalized["category"]?.toString(),
        imageUrl: (normalized["image_url"] || normalized["image"])?.toString(),
        specs: {},
        sourceFile: path.basename(file),
        sheet: bestSheetName,
        createdAt: new Date().toISOString(),
      };

      const baseKeys = new Set([
        "id",
        "brand",
        "brand_slug",
        "model",
        "model_slug",
        "year",
        "price",
        "category",
        "image_url",
        "image",
        "sourcefile",
        "sheet",
        "createdat",
      ]);

      const specs: Specs = {};
      for (const [key, value] of Object.entries(normalized)) {
        if (!baseKeys.has(key)) {
          specs[key] = value;
        }
      }
      moto.specs = specs;
      motos.push(moto);
    }
  }

  return motos;
}

async function writeOutputs(motos: Moto[]) {
  await ensureDir("data/generated");
  await writeJSON("data/generated/motos.json", motos, { spaces: 2 });

  const byBrand: Record<string, Moto[]> = {};
  for (const moto of motos) {
    if (!byBrand[moto.brandSlug]) {
      byBrand[moto.brandSlug] = [];
    }
    byBrand[moto.brandSlug].push(moto);
  }

  for (const [slug, list] of Object.entries(byBrand)) {
    await writeJSON(`data/generated/motos_${slug}.json`, list, { spaces: 2 });
  }
}

async function main() {
  const motos = await readExcelFiles();
  if (!motos.length) return;

  await writeOutputs(motos);
  console.log(`Generated ${motos.length} motos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
