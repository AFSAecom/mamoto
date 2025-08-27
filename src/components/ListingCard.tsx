'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Eye, Heart, MapPin, Calendar, Gauge } from 'lucide-react';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    location: string;
    seller: string;
    image: string;
    description: string;
  };
  showActions?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, showActions = true }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 0,
    }).format(price).replace('TND', 'TND');
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('fr-TN').format(mileage) + ' km';
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-surface border-accent hover:border-brand-500 transition-all duration-300 overflow-hidden group">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden bg-accent relative">
          <Image
            src={listing.image}
            alt={listing.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-brand-700 text-fg">
              Occasion
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-surface/80 text-fg border-accent">
              {listing.year}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg text-fg group-hover:text-brand-300 transition-colors mb-2 line-clamp-2">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted mb-3 line-clamp-2">
            {listing.description}
          </p>

          {/* Details */}
          <div className="flex flex-wrap gap-2 text-sm text-muted mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{listing.year}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Gauge className="h-3 w-3" />
              <span>{formatMileage(listing.mileage)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>{listing.location}</span>
            </div>
          </div>

          {/* Seller info */}
          <div className="text-xs text-muted mb-3">
            Vendu par: <span className="text-brand-300">{listing.seller}</span>
          </div>

          {/* Price */}
          <div className="text-xl font-bold text-brand-300">
            {formatPrice(listing.price)}
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
                <Link href={`/occasion/${listing.id}`}>
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
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

export default ListingCard;