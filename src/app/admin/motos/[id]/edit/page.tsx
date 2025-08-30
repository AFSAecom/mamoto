import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { updateMoto } from '../../actions';

export default async function EditMoto({params}:{params:{id:string}}){
  const s=await createClient();
  const {data:m}=await s.from('motos').select('*').eq('id',params.id).single();
  if(!m) return <div className="p-6">Introuvable</div>;
  return(<div className="p-6 max-w-2xl space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">Éditer : {m.brand} {m.model}</h1>
      <div className="flex gap-4">
        <Link href={`/admin/motos/${m.id}/specs`} className="underline">Specs</Link>
        <Link href={`/admin/motos/${m.id}/images`} className="underline">Images</Link>
      </div>
    </div>
    <form action={async(fd)=>{'use server';await updateMoto(m.id,fd);}} className="grid grid-cols-2 gap-3">
      <input name="brand" defaultValue={m.brand||''} className="border p-2 rounded" placeholder="Marque"/>
      <input name="model" defaultValue={m.model||''} className="border p-2 rounded" placeholder="Modèle"/>
      <input name="year"  defaultValue={m.year||''} className="border p-2 rounded" placeholder="Année" type="number"/>
      <input name="price" defaultValue={m.price||''} className="border p-2 rounded" placeholder="Prix" type="number" step="0.01"/>
      <input name="main_image_url" defaultValue={m.main_image_url||''} className="col-span-2 border p-2 rounded" placeholder="Image principale (URL)"/>
      <label className="col-span-2 flex items-center gap-2"><input type="checkbox" name="is_published" defaultChecked={m.is_published}/> Publiée</label>
      <div className="col-span-2"><button className="border px-3 py-2 rounded">Enregistrer</button></div>
    </form>
  </div>);
}
