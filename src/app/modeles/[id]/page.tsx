import { notFound } from "next/navigation";
import { findById } from "../../../lib/motos.server";
import SpecsTable from "../../../components/SpecsTable";

export const dynamic = "force-static";

export default function ModelePage({ params }: { params: { id: string } }) {
  const moto = findById(params.id);
  if (!moto) return notFound();
  const { brand, model, year, price, category, imageUrl, specs } = moto;
  const specCount = specs ? Object.keys(specs).length : 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500">
        <a href="/motos" className="underline">← Retour aux motos</a>
      </nav>
      <header className="mb-6">
        <div className="aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-4">
          {imageUrl ? (
            <img src={imageUrl} alt={`${brand} ${model}`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center text-gray-400">Image à venir</div>
          )}
        </div>
        <h1 className="text-3xl font-semibold">
          {brand} {model}{year ? ` · ${year}` : ""}
        </h1>
        <div className="mt-2 space-y-1">
          {price != null && <p><span className="text-gray-500">Prix:</span> {price}</p>}
          {category && <p><span className="text-gray-500">Catégorie:</span> {category}</p>}
        </div>
        <p className="text-sm text-gray-500 mt-2">{specCount} caractéristiques techniques</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Caractéristiques techniques</h2>
        <SpecsTable specs={specs || {}} />
      </section>
    </main>
  );
}

