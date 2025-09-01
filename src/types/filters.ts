export type Range = { min?: number; max?: number };

export type Filters = {
  price?: Range;
  year?: Range;
  brand_ids?: string[];
  specs?: Record<string, boolean | string | string[] | Range | { in: string[] }>;
};

export interface FacetDistBool {
  value: boolean;
  count: number;
}

export interface FacetDistText {
  value: string;
  count: number;
}

export interface FacetItem {
  key: string;
  label?: string | null;
  unit?: string | null;
  type: 'number' | 'boolean' | 'text' | 'enum';
  min?: number | null;
  max?: number | null;
  dist_bool?: FacetDistBool[] | null;
  dist_text?: FacetDistText[] | null;
  item_sort?: number | null;
}

export interface FacetGroup {
  group: string;
  group_label?: string | null;
  group_sort?: number | null;
  items: FacetItem[];
}
