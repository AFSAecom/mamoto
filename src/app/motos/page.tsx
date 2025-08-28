import Link from "next/link";
import { loadAllMotos } from "../../lib/motos.server";

export const dynamic = "force-static";

export default function MotosPage() {
  const all = loadAllMotos();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-1">Motos neuves</h1>
      <p className="text-sm text-gray-500 mb-6">({all.length} modèles chargés)</p>
      {all.length === 0 ? (
        <p>Aucun modèle trouvé. Vérifie data/excel/ et/ou la génération du JSON.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((m) => (
            <li key={m.id} className="rounded-xl border p-4 hover:shadow">
              <Link href={`/modeles/${m.id}`} className="block">
                <div className="text-sm text-gray-500">{m.brand}</div>
                <div className="text-lg font-medium">
                  {m.model}{m.year ? ` · ${m.year}` : ""}
                </div>
                {m.price != null && <div className="mt-1">Prix: {m.price}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

