export interface MotoCard {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  image_path: string | null;
  slug: string | null;
}

export interface MotoImage {
  path: string | null;
  alt: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
}

export interface MotoGroupItem {
  key: string | null;
  value: string | null;
  unit: string | null;
}

export interface MotoGroup {
  group: string | null;
  items: MotoGroupItem[];
}

export interface MotoFull {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  images?: MotoImage[];
  groups?: MotoGroup[];
  slug?: string | null;
}
