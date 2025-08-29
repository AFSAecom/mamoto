import { getAllSpecKeys } from './catalog-helpers';

export const SPEC_KEYS = getAllSpecKeys();

const LABEL_OVERRIDES: Record<string, string> = {
  price_tnd: 'Prix (TND)',
  engine_cc: 'Cylindrée (cc)',
  power_hp: 'Puissance (ch)',
  torque_nm: 'Couple (Nm)',
  weight_kg: 'Poids (kg)',
  consumption_l_100: 'Conso (L/100km)',
  abs: 'ABS',
  gearbox: 'Boîte',
  seat_height_mm: 'Hauteur de selle (mm)',
  fuel_tank_l: 'Réservoir (L)',
  cooling: 'Refroidissement',
};

const prettify = (k: string) =>
  LABEL_OVERRIDES[k] ??
  k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const SPEC_LABELS: Record<string, string> = Object.fromEntries(
  SPEC_KEYS.map((k) => [k, prettify(k)])
);

