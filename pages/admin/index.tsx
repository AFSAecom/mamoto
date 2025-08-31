import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [motos, setMotos] = useState<any[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc("me_is_admin");
      if (error || !isAdmin) {
        router.push("/");
        return;
      }

      const { data: motosData } = await supabase
        .from("motos")
        .select("id, brand, model, year, price");
      setMotos(motosData || []);
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  if (loading) return <p>Chargement...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>
      <div style={{ marginBottom: "15px" }}>
        <button>Ajouter moto</button>
        <button>Gérer Specs</button>
        <button>Gérer Images</button>
      </div>

      <h2>Liste des motos</h2>
      <ul>
        {motos.map((moto) => (
          <li key={moto.id}>
            {moto.brand} {moto.model} ({moto.year}) - {moto.price} TND
          </li>
        ))}
      </ul>
    </div>
  );
}
