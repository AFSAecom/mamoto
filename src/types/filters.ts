export type Range = { min?: number; max?: number };

export type Filters = {
  price?: Range;
  year?: Range;
  brand_ids?: string[];
  specs?: Record<string, boolean | string | string[] | Range | { in: string[] }>;
};

export interface FacetDistribution<T = string | boolean> {
  value: T;
  count: number;
}

export interface FacetItem {
  key: string;
  label: string;
  unit?: string;
  type: 'number' | 'boolean' | 'text' | 'enum';
  min?: number;
  max?: number;
  dist_bool?: FacetDistribution<boolean>[];
  dist_text?: FacetDistribution<string>[];
  item_sort?: number;
}

export interface FacetGroup {
  key: string;
  label: string;
  items: FacetItem[];
  group_sort?: number;
}
