'use client';

import React from 'react';
import Link from 'next/link';
import { Bike, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-accent mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Bike className="h-8 w-8 text-brand-500" />
              <span className="font-bold text-xl text-fg">moto.tn</span>
            </Link>
            <p className="text-muted mb-4">
              Le premier portail moto en Tunisie. Découvrez, comparez et trouvez votre moto idéale
              parmi les meilleures marques et modèles disponibles sur le marché tunisien.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-muted">
                <Mail className="h-4 w-4" />
                <span className="text-sm">contact@moto.tn</span>
              </div>
              <div className="flex items-center space-x-2 text-muted">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+216 70 123 456</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-fg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/motos" className="text-muted hover:text-brand-300 transition-colors">
                  Motos Neuves
                </Link>
              </li>
              <li>
                <Link href="/occasion" className="text-muted hover:text-brand-300 transition-colors">
                  Occasion
                </Link>
              </li>
              <li>
                <Link href="/motos/comparateur" className="text-muted hover:text-brand-300 transition-colors">
                  Comparateur
                </Link>
              </li>
              <li>
                <Link href="/mag" className="text-muted hover:text-brand-300 transition-colors">
                  Magazine
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-fg mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/guide" className="text-muted hover:text-brand-300 transition-colors">
                  Guide d'achat
                </Link>
              </li>
              <li>
                <Link href="/concessionnaires" className="text-muted hover:text-brand-300 transition-colors">
                  Concessionnaires
                </Link>
              </li>
              <li>
                <Link href="/financement" className="text-muted hover:text-brand-300 transition-colors">
                  Financement
                </Link>
              </li>
              <li>
                <Link href="/assurance" className="text-muted hover:text-brand-300 transition-colors">
                  Assurance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-accent mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted text-sm">
            © {currentYear} moto.tn. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/mentions-legales" className="text-muted hover:text-brand-300 text-sm transition-colors">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="text-muted hover:text-brand-300 text-sm transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="text-muted hover:text-brand-300 text-sm transition-colors">
              Conditions d'utilisation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
