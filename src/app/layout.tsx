import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Lora, Fira_Code } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FavoritesProvider } from '@/hooks/use-favorites';
import { Toaster } from '@/components/ui/toaster';

const geistSans = GeistSans({ subsets: ['latin'], variable: '--font-sans' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'moto.tn - Le portail moto en Tunisie',
  description: 'Découvrez, comparez et trouvez votre moto idéale en Tunisie. Catalogue complet, comparateur intelligent, occasion et magazine spécialisé.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${lora.variable} ${firaCode.variable} font-sans`}>
        <FavoritesProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster />
        </FavoritesProvider>
      </body>
    </html>
  );
}
