// Type augmentation so page.tsx can pass priceRange & yearRange to FiltersLeft
// without touching the existing implementation.
declare module "@/components/motos/FiltersLeft" {
  import * as React from "react";
  type Range = [number, number];
  export interface FiltersLeftProps {
    brands: any[];
    initialF?: string;
    initialFilters?: any;
    specSchema?: any;
    priceRange?: Range;
    yearRange?: Range;
  }
  const FiltersLeft: React.FC<FiltersLeftProps>;
  export default FiltersLeft;
}
