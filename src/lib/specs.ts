export const SPEC_ORDER = [
  'price_tnd',
  'engine_cc',
  'power_hp',
  'torque_nm',
  'weight_kg',
  'consumption_l_100',
  'abs',
  'gearbox',
  'seat_height_mm',
  'fuel_tank_l',
  'cooling',
] as const;

export const SPEC_LABELS: Record<string, string> = {
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
