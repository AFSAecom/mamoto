import type { Moto } from "../types/moto";
// IMPORTANT: chemin relatif vers data/generated
import raw from "../../data/generated/motos.json";

const ALL: Moto[] = (raw as unknown as Moto[]) ?? [];

// Petit garde-fou : si 0 ou trop peu d’entrées, log pour diagnostiquer
if (typeof window === "undefined") {
  console.log("[motos] loaded entries:", ALL.length);
}

export function getAllMotos(): Moto[] {
  return ALL;
}
export function findById(id: string): Moto | undefined {
  return ALL.find((m) => m.id === id);
}

export function findByBrand(brandSlug: string): Moto[] {
  return ALL.filter((m) => m.brandSlug === brandSlug);
}

