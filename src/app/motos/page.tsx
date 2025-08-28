"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getAllMotos } from "../../lib/motos";

export default function MotosPage() {
  const [q, setQ] = useState("");
  const all = useMemo(() => getAllMotos(), []);
  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return all;
    return all.filter(m =>
      m.brand.toLowerCase().includes(s) ||
      m.model.toLowerCase().includes(s)
    );
  }, [q, all]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">Motos neuves</h1>
      <p className="text-sm text-gray-500 mb-4">({all.length} modèles chargés)</p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher marque ou modèle…"
        className="w-full mb-6 rounded-md border px-3 py-2"
        aria-label="Recherche"
      />
      {list.length === 0 ? (
        <p>Aucun modèle trouvé.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
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

