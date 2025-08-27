export type SpecValue = string | number | boolean;

export interface SpecItem {
  label: string;
  value: SpecValue;
}

export interface SpecFamily {
  group: string;
  items: SpecItem[];
}

export interface MotoVariant {
  id: string;
  name: string;
  price?: number;
  specs: SpecFamily[];
}

export interface MotoModel {
  id: string;
  name: string;
  brandId: string;
  category: string;
  image: string;
  description?: string;
  gallery?: string[];
  variant?: MotoVariant[];
}

