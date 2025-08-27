'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Eye, Heart, TrendingUp } from 'lucide-react';

interface MotoCardProps {
  version: {
    id: string;
    modelId: string;
    name: string;
    price: number;
    engine: {
      displacement: number;
      power: number;
    };
    performance: {
      topSpeed: number;
      weight: number;
    };
  };
  model?: {
    name: string;
    brandId: string;
    category: string;
    image: string;
  };
  brand?: {
    name: string;
  };
  showActions?: boolean;
}

const MotoCard: React.FC<MotoCardProps> = ({ 
  version, 
  model, 
  brand, 
  showActions = true 
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price).replace('TND', 'TND');
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-surface border-accent hover:border-brand-500 transition-all duration-300 overflow-hidden group">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-accent">
          {model?.image && (
            <img
              src={model.image}
              alt={version.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute top-3 left-3">
            {model?.category && (
              <Badge variant="secondary" className="bg-brand-700 text-fg">
                {model.category}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Brand and Model */}
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-fg group-hover:text-brand-300 transition-colors">
              {brand?.name} {model?.name}
            </h3>
            <p className="text-sm text-muted">{version.name}</p>
          </div>

          {/* Specs */}
          <div className="flex justify-between text-sm text-muted mb-3">
            <span>{version.engine.displacement}cc</span>
            <span>{version.engine.power}ch</span>
            <span>{version.performance.weight}kg</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-brand-300">
              {formatPrice(version.price)}
            </div>
            <div className="text-sm text-muted">
              {version.performance.topSpeed} km/h
            </div>
          </div>
        </CardContent>

        {showActions && (
          <CardFooter className="p-4 pt-0">
            <div className="flex space-x-2 w-full">
              <Button
                size="sm"
                className="flex-1 bg-brand-700 hover:bg-brand-600 text-fg"
                asChild
              >
                <Link href={`/motos/${model?.brandId}/${model?.name?.toLowerCase()}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  Voir détails
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-accent hover:bg-accent"
              >
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-accent hover:bg-accent"
                asChild
              >
                <Link href="/motos/comparateur">
                  <TrendingUp className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default MotoCard;