"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
// ✅ Import the *component value* from components, but alias to avoid any type-name collision
import MotoCardView from "../../components/MotoCard";

type MotoRow = {
  id: string;
  brand_name: string;
  model_name: string;
  year: number | null;
  price_tnd: number | null;
};

// Re-expose as `MotoCard` in local scope so existing JSX `<MotoCard .../>` keeps working
const MotoCard = (props: { moto: MotoRow }) => <MotoCardView {...props} />;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomeClient() {
  const [motos, setMotos] = useState<MotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      // ✅ Requête simple: prendre 12 motos "featured" si la vue existe sinon fallback sur table
      try {
        // Essayez d'abord la RPC de recherche si elle existe pour rester cohérent
        const { data, error } = await supabase
          .from("vw_motos_min") // fallback courant: une vue de listing minimal, sinon changez le nom ci-dessous
          .select("id,brand_name,model_name,year,price_tnd")
          .limit(12);
        if (error) throw error;
        if (!cancelled) setMotos((data ?? []) as MotoRow[]);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = True;
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold mb-4">Nouveautés</h2>
      {err && <div className="mb-4 p-3 border bg-red-50 text-red-700 rounded">Erreur: {err}</div>}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {(loading ? Array.from({ length: 8 }).map((_, i) => ({ id: `skeleton-${i}`, brand_name: "", model_name: "", year: null, price_tnd: null })) : motos).map((m, index) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {loading ? (
              <div className="h-64 bg-gray-100 rounded animate-pulse" />
            ) : (
              // ⚠️ Conserve exactement le tag attendu dans les logs: <MotoCard moto={m} />
              <MotoCard moto={m} />
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
