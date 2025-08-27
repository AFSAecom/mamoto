export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  founded?: number;
  country?: string;
}

export interface Model {
  id: string;
  name: string;
  brandId: string;
  category: string;
  image: string;
  description?: string;
}

export interface EngineSpecs {
  displacement: number;
  type: string;
  power: number;
  torque: number;
}

export interface PerformanceSpecs {
  topSpeed: number;
  acceleration: number;
  weight: number;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  wheelbase: number;
}

export interface Features {
  abs: boolean;
  tcs: boolean;
  quickshifter: boolean;
  cruiseControl: boolean;
  ledLights: boolean;
}

export interface Version {
  id: string;
  modelId: string;
  name: string;
  price: number;
  engine: EngineSpecs;
  performance: PerformanceSpecs;
  dimensions: Dimensions;
  features: Features;
}

export interface Moto {
  version: Version;
  model?: Model;
  brand?: Brand;
}

export interface Filters {
  brands: string[];
  categories: string[];
  priceRange: [number, number];
  engineRange: [number, number];
  powerRange: [number, number];
  selectedBrands: string[];
  selectedCategories: string[];
}

export type FeatureValue = string | number | boolean;

export interface FeatureComparison {
  feature: string;
  values: Array<{ version: string; value: FeatureValue }>;
}

export type {
  SpecValue as MotoSpecValue,
  Specs as MotoSpecs,
  Moto as MotoData,
} from "./moto";
