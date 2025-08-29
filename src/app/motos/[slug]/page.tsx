import Image from "next/image";
import { notFound } from "next/navigation";
import { loadMotos } from "@/lib/motos";

interface PageProps {
  params: { slug: string };
}

export default async function MotoPage({ params }: PageProps) {
  const motos = await loadMotos();
  const moto = motos.find((m) => m.slug === params.slug);
  if (!moto) return notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-semibold">{moto.model}</h1>
      {moto.imageUrl && (
        <div className="relative w-full h-64">
          <Image src={moto.imageUrl} alt={moto.model} fill className="object-cover" />
        </div>
      )}
      <ul className="bg-[#132E35] text-white divide-y divide-[#AFB3B7]">
        {moto.specs.map((s, i) => (
          <li key={i} className="flex justify-between px-4 py-2">
            <span>{s.label}</span>
            <span className="font-medium">{s.value}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

