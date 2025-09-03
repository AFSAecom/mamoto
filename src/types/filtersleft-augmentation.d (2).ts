// src/types/filtersleft-augmentation.d.ts

// Cette augmentation assouplit les props de FiltersLeft pour accepter
// soit un tuple [min, max], soit un objet { min, max } depuis page.tsx.
// => Corrige l'erreur Vercel: "Type 'Range' is not assignable to type '[number, number]'"

declare module "@/components/motos/FiltersLeft" {
  export type RangeTuple = [number, number];
  export type RangeObj = { min: number; max: number };
  export type AcceptableRange = RangeTuple | RangeObj;

  export interface Props {
    priceRange?: AcceptableRange;
    yearRange?: AcceptableRange;
  }
}
