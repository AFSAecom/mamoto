import MotoCard from "@/components/MotoCard";
import { loadMotos } from "@/lib/motos";

export const dynamic = "force-static";

export default async function MotosPage() {
  const motos = await loadMotos();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-1">Motos neuves</h1>
      <p className="text-sm text-gray-500 mb-6">({motos.length} modèles chargés)</p>
      {motos.length === 0 ? (
        <p>Aucun modèle trouvé.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {motos.map((m) => (
            <li key={m.slug}>
              <MotoCard moto={m} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

