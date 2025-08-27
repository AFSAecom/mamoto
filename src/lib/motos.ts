import motosData from "../../data/generated/motos.json" assert { type: "json" };
import type { Moto } from "@/types/moto";

// The generated JSON may not be type-safe by default. Cast through unknown
// to satisfy TypeScript while trusting the data shape at runtime.
const motos = motosData as unknown as Moto[];

export function getAllMotos(): Moto[] {
  return motos;
}

export function findByBrand(brandSlug: string): Moto[] {
  return motos.filter((moto) => moto.brandSlug === brandSlug);
}

export function findById(id: string): Moto | undefined {
  return motos.find((moto) => moto.id === id);
}

export function search(query: string): Moto[] {
  if (!query) return motos;
  const lowerQuery = query.toLowerCase();

  return motos.filter((moto) => {
    if (moto.brand.toLowerCase().includes(lowerQuery)) return true;
    if (moto.model.toLowerCase().includes(lowerQuery)) return true;
    return Object.entries(moto.specs).some(([key, value]) => {
      if (key.toLowerCase().includes(lowerQuery)) return true;
      if (value === undefined || value === null) return false;
      return String(value).toLowerCase().includes(lowerQuery);
    });
  });
}
