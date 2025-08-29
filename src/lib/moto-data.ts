export type Moto = {
  id: string;
  brand: string;
  model: string;
  year?: number;
  image?: string; // ex: "/motos/mt07.png"
  specs: Record<string, any>;
};

export const motos: Moto[] = [
  {
    id: 'yamaha-mt-07-2024', // brand-model-year stable id
    brand: 'Yamaha',
    model: 'MT-07',
    year: 2024,
    image: '/motos/mt07.png',
    specs: {
      price_tnd: 34990,
      engine_cc: 689,
      power_hp: 72,
      torque_nm: 67,
      weight_kg: 184,
      abs: true,
      gearbox: '6 vitesses',
      cooling: 'liquide',
    },
  },
  {
    id: 'honda-cb500f-2024',
    brand: 'Honda',
    model: 'CB500F',
    year: 2024,
    image: '/motos/cb500f.png',
    specs: {
      price_tnd: 28990,
      engine_cc: 471,
      power_hp: 47,
      torque_nm: 43,
      weight_kg: 189,
      abs: true,
      gearbox: '6 vitesses',
      cooling: 'liquide',
    },
  },
];

export const brands = Array.from(new Set(motos.map((m) => m.brand))).sort();

export const modelsByBrand = (brand: string) =>
  motos
    .filter((m) => m.brand === brand)
    .map((m) => ({ id: m.id, label: m.model }));

export const byId = (id: string) => motos.find((m) => m.id === id);

/** Retourne toutes les clés de caractéristiques rencontrées dans motos[].specs */
export const getAllSpecKeys = (): string[] => {
  const s = new Set<string>();
  for (const m of motos) {
    Object.keys(m.specs || {}).forEach((k) => s.add(k));
  }
  // garder un ordre utile : prix et specs majeures d’abord, puis le reste alpha
  const preferred = [
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
  ];
  const rest = [...s].filter((k) => !preferred.includes(k)).sort();
  // si une clé préférée n’existe pas dans la data, on la saute automatiquement
  const existingPreferred = preferred.filter((k) => s.has(k));
  return [...existingPreferred, ...rest];
};

