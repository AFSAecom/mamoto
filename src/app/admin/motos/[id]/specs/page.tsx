import { createClient } from '@/utils/supabase/server';
import { addSpec, deleteSpec } from '../../actions';

export default async function SpecsPage({params}:{params:{id:string}}){
  const s=await createClient();
  const {data:specs}=await s.from('moto_specs')
    .select('id,category,subcategory,key_name,value_text,unit,sort_order')
    .eq('moto_id',params.id).order('sort_order',{ascending:true});
  return(<div className="p-6">
    <h1 className="text-xl font-semibold mb-4">Caractéristiques</h1>
    <form action={async(fd)=>{'use server';await addSpec(params.id,fd);}} className="grid grid-cols-6 gap-2 mb-6">
      <input name="category" className="border p-2 rounded" placeholder="Catégorie"/>
      <input name="subcategory" className="border p-2 rounded" placeholder="Sous-catégorie"/>
      <input name="key_name" className="border p-2 rounded" placeholder="Nom" required/>
      <input name="value_text" className="border p-2 rounded" placeholder="Valeur" required/>
      <input name="unit" className="border p-2 rounded" placeholder="Unité"/>
      <input name="sort_order" type="number" className="border p-2 rounded" placeholder="Ordre"/>
      <div className="col-span-6"><button className="border px-3 py-2 rounded">+ Ajouter</button></div>
    </form>
    <table className="w-full text-sm">
      <thead><tr><th>Cat.</th><th>Sous-cat.</th><th>Nom</th><th>Valeur</th><th>Unité</th><th>Ordre</th><th>Actions</th></tr></thead>
      <tbody>{specs?.map((sp:any)=>(
        <tr key={sp.id} className="border-t">
          <td>{sp.category||'-'}</td><td>{sp.subcategory||'-'}</td>
          <td>{sp.key_name}</td><td>{sp.value_text}</td><td>{sp.unit||'-'}</td><td>{sp.sort_order||0}</td>
          <td className="py-2">
            <form action={async()=>{'use server';await deleteSpec(sp.id,params.id);}}>
              <button className="underline text-red-600">Supprimer</button>
            </form>
          </td>
        </tr>))}</tbody>
    </table>
  </div>);
}
