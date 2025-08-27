export type SpecValue = string | number | boolean | null;

export type Specs = Record<string, SpecValue>;

export interface Moto {
  id: string;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  year?: number;
  price?: number;
  category?: string;
  imageUrl?: string;
  specs: Specs;
  sourceFile: string;
  sheet?: string;
  createdAt: string;
}
