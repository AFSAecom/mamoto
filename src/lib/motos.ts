import type { Moto } from "@/types/moto";
import motos from "../../data/generated/motos.json" assert { type: "json" };

export function getAllMotos(): Moto[] {
  return (motos as unknown as Moto[]) ?? [];
}

export function findById(id: string): Moto | undefined {
  return getAllMotos().find((m) => m.id === id);
}

export function findByBrand(brandSlug: string): Moto[] {
  return getAllMotos().filter((m) => m.brandSlug === brandSlug);
}

export function searchMotos(q: string): Moto[] {
  const s = q?.toLowerCase().trim() ?? "";
  if (!s) return getAllMotos();
  return getAllMotos().filter((m) =>
    m.brand.toLowerCase().includes(s) ||
    m.model.toLowerCase().includes(s) ||
    Object.entries(m.specs || {}).some(([k, v]) =>
      `${k} ${v ?? ""}`.toLowerCase().includes(s),
    ),
  );
}
