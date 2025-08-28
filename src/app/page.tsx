import Link from "next/link";
import { loadAllMotos } from "./../lib/motos.server";

export const dynamic = "force-static";

export default function Home() {
  const all = loadAllMotos();
  const featured = all.slice(0, 12);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-1">Bienvenue sur moto.tn</h1>
      <p className="text-sm text-gray-500 mb-6">({all.length} modèles au catalogue)</p>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((m) => (
          <li key={m.id} className="rounded-xl border overflow-hidden hover:shadow">
            <Link href={`/modeles/${m.id}`} className="block">
              <div className="aspect-[16/9] bg-gray-100">
                {m.imageUrl ? (
                  <img src={m.imageUrl} alt={`${m.brand} ${m.model}`} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-gray-400 text-sm">Image à venir</div>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-500">{m.brand}</div>
                <div className="text-lg font-medium">
                  {m.model}{m.year ? ` · ${m.year}` : ""}
                </div>
                {m.price != null && <div className="mt-1">Prix: {m.price}</div>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

