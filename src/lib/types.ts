export type Moto = {
  id: string;              // stable: `${brand-normalized}-${model-normalized}-${year?}`
  brand: string;
  model: string;
  year?: number;
  image?: string;          // "/motos/xxx.png"
  specs: Record<string, any>;
};
