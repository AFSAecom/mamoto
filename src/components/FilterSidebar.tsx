'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Filters } from '@/types';

interface FilterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
}) => {
  const [openSections, setOpenSections] = useState({
    brand: true,
    category: true,
    price: true,
    engine: false,
    power: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newSelectedBrands = checked
      ? [...filters.selectedBrands, brand]
      : filters.selectedBrands.filter(b => b !== brand);
    
    onFiltersChange({
      ...filters,
      selectedBrands: newSelectedBrands,
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newSelectedCategories = checked
      ? [...filters.selectedCategories, category]
      : filters.selectedCategories.filter(c => c !== category);
    
    onFiltersChange({
      ...filters,
      selectedCategories: newSelectedCategories,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      ...filters,
      selectedBrands: [],
      selectedCategories: [],
      priceRange: [0, 100000],
      engineRange: [50, 2000],
      powerRange: [10, 250],
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-brand-500" />
          <h3 className="font-semibold text-lg text-fg">Filtres</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted hover:text-fg"
        >
          Effacer tout
        </Button>
      </div>

      {/* Brand Filter */}
      <Card className="bg-bg border-accent">
        <Collapsible
          open={openSections.brand}
          onOpenChange={() => toggleSection('brand')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-surface/50">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Marque</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.brand ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {filters.brands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={brand}
                    checked={filters.selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => handleBrandChange(brand, !!checked)}
                  />
                  <Label htmlFor={brand} className="text-sm font-medium text-fg cursor-pointer">
                    {brand}
                  </Label>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Category Filter */}
      <Card className="bg-bg border-accent">
        <Collapsible
          open={openSections.category}
          onOpenChange={() => toggleSection('category')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-surface/50">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Catégorie</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.category ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              {filters.categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={filters.selectedCategories.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                  />
                  <Label htmlFor={category} className="text-sm font-medium text-fg cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Price Range */}
      <Card className="bg-bg border-accent">
        <Collapsible
          open={openSections.price}
          onOpenChange={() => toggleSection('price')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-surface/50">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Prix (TND)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.price ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
                max={100000}
                min={0}
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted">
                <span>{filters.priceRange[0].toLocaleString()} TND</span>
                <span>{filters.priceRange[1].toLocaleString()} TND</span>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Engine Displacement */}
      <Card className="bg-bg border-accent">
        <Collapsible
          open={openSections.engine}
          onOpenChange={() => toggleSection('engine')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-surface/50">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Cylindrée (cc)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.engine ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Slider
                value={filters.engineRange}
                onValueChange={(value) => onFiltersChange({ ...filters, engineRange: value as [number, number] })}
                max={2000}
                min={50}
                step={50}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted">
                <span>{filters.engineRange[0]} cc</span>
                <span>{filters.engineRange[1]} cc</span>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Power Range */}
      <Card className="bg-bg border-accent">
        <Collapsible
          open={openSections.power}
          onOpenChange={() => toggleSection('power')}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-surface/50">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Puissance (ch)</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.power ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <Slider
                value={filters.powerRange}
                onValueChange={(value) => onFiltersChange({ ...filters, powerRange: value as [number, number] })}
                max={250}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted">
                <span>{filters.powerRange[0]} ch</span>
                <span>{filters.powerRange[1]} ch</span>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <Button
        onClick={onToggle}
        className="md:hidden fixed bottom-4 right-4 z-40 bg-brand-700 hover:bg-brand-600 shadow-lg"
        size="lg"
      >
        <Filter className="h-5 w-5 mr-2" />
        Filtres
      </Button>

      {/* Mobile Filter Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-50"
            onClick={onToggle}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-bg border-l border-accent overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-fg">Filtres</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="text-muted hover:text-fg"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <FilterContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 bg-surface border border-accent rounded-lg p-6 h-fit sticky top-24">
        <FilterContent />
      </div>
    </>
  );
};

export default FilterSidebar;
