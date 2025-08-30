import { createClient } from '@/utils/supabase/server';
import { uploadImage, setMainImage, deleteImage } from '../../actions';

export default async function ImagesPage({params}:{params:{id:string}}){
  const s=await createClient();
  const {data:imgs}=await s.from('moto_images')
    .select('id,image_url,alt,is_main').eq('moto_id',params.id)
    .order('created_at',{ascending:false});
  return(<div className="p-6 space-y-6">
    <h1 className="text-xl font-semibold">Images</h1>
    <form action={async(fd)=>{'use server';await uploadImage(params.id,fd);}} className="flex items-center gap-2">
      <input type="file" name="file" required/>
      <input type="text" name="alt" placeholder="Alt" className="border p-2 rounded"/>
      <label className="flex items-center gap-2"><input type="checkbox" name="make_main"/> Définir principale</label>
      <button className="border px-3 py-2 rounded">Uploader</button>
    </form>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {imgs?.map((im:any)=>(
        <div key={im.id} className="border rounded p-2">
          <img src={im.image_url} alt={im.alt||''} className="w-full h-32 object-cover rounded"/>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span>{im.is_main?'★ Principale':''}</span>
            <div className="flex gap-3">
              {!im.is_main&&(<form action={async()=>{'use server';await setMainImage(im.id,params.id);}}>
                <button className="underline">Définir</button></form>)}
              <form action={async()=>{'use server';await deleteImage(im.id,params.id);}}>
                <button className="underline text-red-600">Supprimer</button></form>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>);
}
