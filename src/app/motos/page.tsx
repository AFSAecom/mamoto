import MotoCard from "@/components/MotoCard";
import { getPublishedMotos } from "@/lib/public/motos";

export const dynamic = "force-static";

export default async function MotosPage() {
  const motos = await getPublishedMotos();

  if (motos.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold mb-1">Motos neuves</h1>
        <p className="text-sm text-gray-500 mb-6">(0 modèles chargés)</p>
        <p>Aucun modèle trouvé.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-1">Motos neuves</h1>
      <p className="text-sm text-gray-500 mb-6">({motos.length} modèles chargés)</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {motos.map((m) => (
          <MotoCard key={m.slug} moto={m} />
        ))}
      </div>
    </main>
  );
}
