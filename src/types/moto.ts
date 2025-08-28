export type SpecValue = string | number | boolean | null;
export type Specs = Record<string, SpecValue>;

export interface Moto {
  id: string;
  brand: string; brandSlug: string;
  model: string; modelSlug: string;
  year?: number | null;
  price?: number | null;
  category?: string | null;
  imageUrl?: string | null;
  specs: Specs;
  sourceFile: string;
  sheet?: string | null;
  createdAt: string;
}
