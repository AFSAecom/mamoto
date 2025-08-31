import { createClient } from '@/utils/supabase/server';

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: motos } = await supabase
    .from('motos')
    .select('id, brand, model, year, price');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <div className="flex gap-3 mb-4">
        <button className="border px-3 py-2 rounded">Ajouter moto</button>
        <button className="border px-3 py-2 rounded">Gérer Specs</button>
        <button className="border px-3 py-2 rounded">Gérer Images</button>
      </div>

      <h2 className="text-lg font-medium">Liste des motos</h2>
      <ul className="list-disc pl-5">
        {motos?.map((moto: any) => (
          <li key={moto.id}>
            {moto.brand} {moto.model} ({moto.year}) - {moto.price} TND
          </li>
        ))}
      </ul>
    </div>
  );
}
