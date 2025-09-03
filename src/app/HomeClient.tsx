"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import MotoCard from "@/components/MotoCard";
import type { MotoCard as MotoCardType } from "@/lib/public/motos";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomeClient() {
  const [motos, setMotos] = useState<MotoCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase
          .from("vw_motos_min") // Remplace si ta vue/table a un autre nom
          .select("id,brand_name,model_name,year,price_tnd")
          .limit(12);
        if (error) throw error;
        if (!cancelled) setMotos((data ?? []) as MotoCardType[]);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || "Erreur inconnue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
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
              <MotoCard moto={m} />
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
