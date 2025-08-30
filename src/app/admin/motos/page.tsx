import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { togglePublish, deleteMoto } from './actions';

export default async function MotosList(){
  const s=await createClient();
  const {data:rows}=await s.from('motos')
    .select('id,brand,model,year,price,is_published,main_image_url')
    .order('created_at',{ascending:false});
  return(<div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold">Motos</h1>
      <Link href="/admin/motos/new" className="border px-3 py-2 rounded">+ Nouvelle moto</Link>
    </div>
    <table className="w-full text-sm">
      <thead><tr><th>Image</th><th>Marque</th><th>Modèle</th><th>Année</th><th>Prix</th><th>Publiée</th><th>Actions</th></tr></thead>
      <tbody>
        {rows?.map((m:any)=>(
          <tr key={m.id} className="border-t">
            <td className="py-2">{m.main_image_url?<img src={m.main_image_url} alt={`${m.brand} ${m.model}`} className="h-10" />:'-'}</td>
            <td>{m.brand}</td><td>{m.model}</td><td>{m.year||'-'}</td><td>{m.price||'-'}</td>
            <td>{m.is_published?'Oui':'Non'}</td>
            <td className="py-2">
              <div className="flex gap-3">
                <Link href={`/admin/motos/${m.id}/edit`} className="underline">Éditer</Link>
                <Link href={`/admin/motos/${m.id}/specs`} className="underline">Specs</Link>
                <Link href={`/admin/motos/${m.id}/images`} className="underline">Images</Link>
                <form action={async()=>{'use server';await togglePublish(m.id,m.is_published);}}>
                  <button className="underline">{m.is_published?'Dépublier':'Publier'}</button>
                </form>
                <form action={async()=>{'use server';await deleteMoto(m.id);}}>
                  <button className="underline text-red-600">Supprimer</button>
                </form>
              </div>
            </td>
          </tr>
        ))}
        {!rows?.length&&(<tr><td colSpan={7} className="py-6 text-center">
          Aucune moto. Cliquez sur <Link href="/admin/motos/new" className="underline">+ Nouvelle moto</Link>.
        </td></tr>)}
      </tbody>
    </table>
  </div>);
}
