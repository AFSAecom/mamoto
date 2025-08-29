import { motos } from './catalogue-motos';
import type { Moto } from './types';

const normalize = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export { normalize };

export const allBrands = () => {
  const brands = Array.from(new Set(motos.map(m => m.brand).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}));
  if (brands.length === 0) {
    console.warn('Catalogue vide: vérifier la source /lib/catalogue-motos.ts ou équivalent.');
  }
  return brands;
};

export const modelsByBrand = (brand: string) => {
  const models = motos
    .filter(m => m.brand === brand)
    .map(m => ({ id: m.id, label: m.model }))
    .sort((a,b)=>a.label.localeCompare(b.label,'fr',{sensitivity:'base'}));
  if (models.length === 0) {
    console.warn('Données manquantes pour cette marque dans le catalogue central.');
  }
  return models;
};

export const byId = (id: string): Moto | undefined => motos.find(m => m.id === id);

export const getAllSpecKeys = (): string[] => {
  const set = new Set<string>();
  for (const m of motos) {
    if (m && m.specs) Object.keys(m.specs).forEach(k => set.add(k));
  }
  const preferred = [
    'price_tnd','engine_cc','power_hp','torque_nm','weight_kg',
    'consumption_l_100','abs','gearbox','seat_height_mm','fuel_tank_l','cooling'
  ];
  const presentPreferred = preferred.filter(k => set.has(k));
  const rest = [...set].filter(k => !preferred.includes(k)).sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}));
  return [...presentPreferred, ...rest];
};
