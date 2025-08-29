'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MotoCard from '@/components/MotoCard';
import { ArrowRight, Search, TrendingUp, Users, Award, MapPin, ChevronRight } from 'lucide-react';
import type { Moto } from '@/lib/motos';

interface HomeClientProps {
  featured: Moto[];
}

export default function HomeClient({ featured }: HomeClientProps) {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-bg via-surface to-brand-800 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/163210/motorcycles-race-helmets-motorcycle-163210.jpeg')] bg-cover bg-center opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-4 bg-brand-700 text-fg hover:bg-brand-600">
                #1 Portail moto en Tunisie
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-fg mb-6">
                Trouvez votre
                <span className="text-brand-300 block">moto idéale</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted mb-8 max-w-3xl mx-auto leading-relaxed">
                Le premier catalogue et comparateur de motos en Tunisie. 
                Découvrez plus de 1000 modèles, comparez les prix et trouvez le concessionnaire le plus proche.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="bg-brand-700 hover:bg-brand-600 text-fg px-8 py-4 text-lg" asChild>
                  <Link href="/motos">
                    <Search className="mr-2 h-5 w-5" />
                    Parcourir le catalogue
                  </Link>
                </Button>
                
                <Button size="lg" variant="outline" className="border-brand-500 text-brand-300 hover:bg-brand-700 px-8 py-4 text-lg" asChild>
                  <Link href="/motos/comparateur">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Comparateur
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Search, label: 'Modèles référencés', value: '1000+' },
              { icon: Users, label: 'Concessionnaires partenaires', value: '150+' },
              { icon: Award, label: 'Marques disponibles', value: '25+' },
              { icon: MapPin, label: 'Villes couvertes', value: '50+' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-bg border-accent text-center hover:border-brand-500 transition-colors">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 text-brand-500 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-brand-300 mb-2">{stat.value}</div>
                    <div className="text-muted">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Motos */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">
                Motos en vedette
              </h2>
              <p className="text-xl text-muted max-w-2xl mx-auto">
                Découvrez notre sélection des meilleures motos disponibles en Tunisie
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {featured.map((m, index) => (
              <motion.div
                key={m.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <MotoCard moto={m} />
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="border-accent hover:bg-accent" asChild>
              <Link href="/motos">
                Voir tous les modèles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">
              Tous nos services
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Un écosystème complet pour tous vos besoins moto
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Catalogue Neuf',
                description: 'Plus de 1000 modèles neufs de toutes les marques',
                href: '/motos',
                icon: '🏍️'
              },
              {
                title: 'Marché Occasion',
                description: 'Annonces vérifiées de motos d\'occasion',
                href: '/occasion',
                icon: '🔄'
              },
              {
                title: 'Magazine',
                description: 'Actualités, essais et comparatifs',
                href: '/mag',
                icon: '📰'
              },
              {
                title: 'Guide Pratique',
                description: 'Conseils d\'achat et d\'entretien',
                href: '/guide',
                icon: '📚'
              },
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-bg border-accent hover:border-brand-500 transition-all duration-300 group cursor-pointer">
                  <Link href={service.href}>
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-4">{service.icon}</div>
                      <h3 className="text-xl font-semibold text-fg mb-2 group-hover:text-brand-300 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-muted mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-center text-brand-300 group-hover:text-brand-200">
                        <span className="mr-2">Découvrir</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-brand-800 to-brand-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">
              Prêt à trouver votre prochaine moto ?
            </h2>
            <p className="text-xl text-brand-300 mb-8">
              Explorez notre catalogue complet et trouvez la moto qui vous correspond
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-fg text-brand-800 hover:bg-brand-100 px-8 py-4" asChild>
                <Link href="/motos">
                  Commencer ma recherche
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
