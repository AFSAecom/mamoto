import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import MotoSpecs from "@/components/MotoSpecs";
import { ensureSpecGroups, MotoSpecGroup } from "@/lib/specs";

type Moto = {
  id: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  price_tnd?: number | null;
  display_image?: string | null;
  specs?: any; // jsonb
};

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey, {
    global: { headers: { "X-Client-Info": "mamoto-frontend" } },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export default async function MotoPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServer();

  // Récupère la moto + specs JSONB
  const { data: moto, error } = await supabase
    .from("motos")
    .select("id, brand, model, year, price_tnd, display_image, specs")
    .eq("id", params.id)
    .single<Moto>();

  if (error || !moto) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">Moto introuvable</h1>
        <p className="text-sm text-gray-600">{error?.message ?? "Aucune donnée."}</p>
      </div>
    );
  }

  const groups: MotoSpecGroup[] = ensureSpecGroups(moto.specs);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-4">
        {moto.display_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={moto.display_image} alt={`${moto.brand} ${moto.model}`} className="w-40 h-28 object-cover rounded-xl border" />
        ) : null}
        <div>
          <h1 className="text-2xl font-bold">
            {moto.brand ?? ""} {moto.model ?? ""} {moto.year ? `(${moto.year})` : ""}
          </h1>
          {typeof moto.price_tnd === "number" && (
            <div className="text-sm text-gray-700 mt-1">
              Prix: {new Intl.NumberFormat("fr-TN").format(moto.price_tnd)} TND
            </div>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Caractéristiques détaillées</h2>
        <MotoSpecs groups={groups} />
      </section>
    </div>
  );
}
