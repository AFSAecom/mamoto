'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

const b=(v:FormDataEntryValue|null)=>v==='on'||v==='true'||v==='1';

export async function createMoto(fd:FormData){
  const s=await createClient();
  const row={brand:String(fd.get('brand')||'').trim(),model:String(fd.get('model')||'').trim(),
    year:Number(fd.get('year')||0)||null,price:Number(fd.get('price')||0)||null,is_published:b(fd.get('is_published'))};
  const {data,error}=await s.from('motos').insert(row).select('id').single();
  if(error) throw error; redirect(`/admin/motos/${data!.id}/edit`);
}
export async function updateMoto(id:string,fd:FormData){
  const s=await createClient();
  const patch:any={brand:String(fd.get('brand')||'').trim(),model:String(fd.get('model')||'').trim(),
    year:Number(fd.get('year')||0)||null,price:Number(fd.get('price')||0)||null,
    is_published:b(fd.get('is_published')),main_image_url:String(fd.get('main_image_url')||'').trim()||null};
  const {error}=await s.from('motos').update(patch).eq('id',id);
  if(error) throw error; revalidatePath(`/admin/motos/${id}/edit`);
}
export async function togglePublish(id:string,current:boolean){
  const s=await createClient(); const {error}=await s.from('motos').update({is_published:!current}).eq('id',id);
  if(error) throw error; revalidatePath('/admin/motos');
}
export async function deleteMoto(id:string){
  const s=await createClient(); const {error}=await s.from('motos').delete().eq('id',id);
  if(error) throw error; revalidatePath('/admin/motos');
}
