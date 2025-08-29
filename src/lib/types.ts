export type Moto = {
  id: string; // stable: `${brand_slug}-${model_slug}-${year?}`
  brand: string;
  brand_slug: string;
  model: string;
  model_slug: string;
  year?: number;
  image?: string; // "/motos/xxx.png"
  listing: "neuve" | "occasion";
  specs: Record<string, any>;
};
