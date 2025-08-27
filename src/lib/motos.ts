import type { Moto } from "../types/moto";
import motos from "../../data/generated/motos.json" assert { type: "json" };

export function getAllMotos(): Moto[] {
  return (motos as unknown as Moto[]) ?? [];
}
export function findById(id: string): Moto | undefined {
  return getAllMotos().find(m => m.id === id);
}
