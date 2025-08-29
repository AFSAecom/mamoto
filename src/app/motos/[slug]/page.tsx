import Image from "next/image";
import { notFound } from "next/navigation";
import { loadMotos } from "@/lib/motos";

interface PageProps {
  params: { slug: string };
}

export default async function MotoPage({ params }: PageProps) {
  const motos = await loadMotos();
  const moto = motos.find((m) => m.slug === params.slug);
  if (!moto) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-semibold">{moto.model}</h1>
      <Image
        src={moto.imageUrl || "/images/placeholder.jpg"}
        alt={moto.model}
        width={800}
        height={600}
        className="w-full h-auto object-cover rounded"
      />
      <ul className="divide-y divide-[#AFB3B7]">
        {moto.specs.map((spec) => (
          <li
            key={spec.label}
            className="flex justify-between bg-[#132E35] text-white px-4 py-2"
          >
            <span>{spec.label}</span>
            <span>{spec.value}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

