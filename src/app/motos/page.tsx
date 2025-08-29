import MotoCard from "@/components/MotoCard";
import { getAllMotos } from "@/lib/motos";

export const dynamic = "force-static";

export default function MotosPage() {
  const all = getAllMotos();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-1">Motos neuves</h1>
      <p className="text-sm text-gray-500 mb-6">({all.length} modèles chargés)</p>
      {all.length === 0 ? (
        <p>Aucun modèle trouvé.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((m) => (
            <MotoCard key={m.id} moto={m} />
          ))}
        </div>
      )}
    </main>
  );
}
