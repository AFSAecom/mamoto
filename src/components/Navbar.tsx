'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bike, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/motos', label: 'Motos Neuves' },
    { href: '/occasion', label: 'Occasion' },
    { href: '/mag', label: 'Magazine' },
    { href: '/guide', label: 'Guide' },
    { href: '/concessionnaires', label: 'Concessionnaires' },
  ];

  return (
    <nav className="bg-bg border-b border-accent sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Bike className="h-8 w-8 text-brand-500" />
            <span className="font-bold text-xl text-fg">moto.tn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-fg hover:text-brand-300 transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Rechercher..."
                className="w-64 bg-surface border-accent text-fg placeholder:text-muted"
              />
              <Button size="sm" variant="outline" className="border-accent hover:bg-accent">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-surface border-t border-accent"
          >
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Search */}
              <div className="flex items-center space-x-2 py-2">
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="flex-1 bg-bg border-accent text-fg placeholder:text-muted"
                />
                <Button size="sm" variant="outline" className="border-accent hover:bg-accent">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Items */}
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-fg hover:text-brand-300 hover:bg-accent rounded-md transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;