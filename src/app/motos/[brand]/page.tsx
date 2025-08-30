import Image from "next/image";
import { notFound } from "next/navigation";
import { getMotoFullByIdentifier } from "@/lib/public/motos";

interface PageProps {
  params: { brand: string };
}

export default async function MotoPage({ params }: PageProps) {
  const data = await getMotoFullByIdentifier(params.brand);
  if (!data) return notFound();
  const { moto, images, specs } = data;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-semibold">{moto.model}</h1>
      {images.length > 0 && (
        <div className="relative w-full h-64">
          <Image src={images[0].image_url} alt={images[0].alt ?? moto.model ?? ''} fill className="object-cover" />
        </div>
      )}
      <ul className="bg-[#132E35] text-white divide-y divide-[#AFB3B7]">
        {specs.map((s) => (
          <li key={s.id} className="flex justify-between px-4 py-2">
            <span>{s.key_name}</span>
            <span className="font-medium">
              {s.value_text}
              {s.unit ? ` ${s.unit}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}

