import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { isPresent } from '../src/lib/is-present';

interface MotoModel {
  name: string;
  [category: string]: any;
}

const workbook = XLSX.readFile(path.join(__dirname, '../data/excel/fiche_technique_moto_30_models_version1.xlsx'));
const sheet = workbook.Sheets['Bloc 1'];
const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];

const header = rows[0];
const motos: MotoModel[] = [];

for (let col = 2; col < header.length; col++) {
  const name = header[col];
  if (!isPresent(name)) continue;
  const moto: MotoModel = { name };
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length <= col) continue;
    const category = row[0];
    const sub = row[1];
    const value = row[col];
    if (!isPresent(category) || !isPresent(sub) || !isPresent(value)) continue;
    if (!moto[category]) moto[category] = {};
    moto[category][sub] = value;
  }
  motos.push(moto);
}

motos.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(path.join(__dirname, '../data/motos.json'), JSON.stringify(motos, null, 2));
console.log(`Saved ${motos.length} motos.`);
