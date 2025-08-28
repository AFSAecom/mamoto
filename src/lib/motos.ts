import type { Moto } from "../types/moto";
import data from "../../data/generated/motos.json" assert { type: "json" };

const ALL: Moto[] = (data as unknown as Moto[]) ?? [];

export function getAllMotos(): Moto[] {
  return ALL;
}
export function findById(id: string): Moto | undefined {
  return ALL.find((m) => m.id === id);
}
