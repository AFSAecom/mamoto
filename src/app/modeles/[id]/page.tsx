import { notFound } from "next/navigation";
import { findById } from "../../../lib/motos";
import SpecsTable from "../../../../components/SpecsTable";

export default function ModelePage({ params }: { params: { id: string } }) {
  const moto = findById(params.id);
  if (!moto) return notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500">
        <a href="/motos" className="underline">← Retour aux motos</a>
      </nav>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">
          {moto.brand} {moto.model}{moto.year ? ` · ${moto.year}` : ""}
        </h1>
        {moto.price != null && <p className="mt-1">Prix: {moto.price}</p>}
      </header>
      <section>
        <h2 className="text-xl font-medium mb-3">Caractéristiques techniques</h2>
        <SpecsTable specs={moto.specs || {}} />
      </section>
    </main>
  );
}
