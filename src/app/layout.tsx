import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "mamoto", description: "Catalogue & comparateur de motos" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-[--background] text-[--foreground] antialiased">{children}</body>
    </html>
  );
}
