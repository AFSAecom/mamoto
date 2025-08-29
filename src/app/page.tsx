import MotoCard from "@/components/MotoCard";
import { loadMotos } from "@/lib/motos";

export default async function Home() {
  const motos = await loadMotos();
  const featured = motos.slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section>
        <h2 className="text-3xl font-semibold mb-6">Motos en vedette</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((m) => (
            <li key={m.slug}>
              <MotoCard moto={m} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

