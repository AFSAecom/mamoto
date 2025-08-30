'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
const b=(v:FormDataEntryValue|null)=>v==='on'||v==='true'||v==='1';

export async function createMoto(fd:FormData){ const s=await createClient();
  const row={brand:String(fd.get('brand')||'').trim(),model:String(fd.get('model')||'').trim(),
    year:Number(fd.get('year')||0)||null,price:Number(fd.get('price')||0)||null,is_published:b(fd.get('is_published'))};
  const {data,error}=await s.from('motos').insert(row).select('id').single();
  if(error) throw error; redirect(`/admin/motos/${data!.id}/edit`); }

export async function updateMoto(id:string,fd:FormData){ const s=await createClient();
  const patch:any={brand:String(fd.get('brand')||'').trim(),model:String(fd.get('model')||'').trim(),
    year:Number(fd.get('year')||0)||null,price:Number(fd.get('price')||0)||null,
    is_published:b(fd.get('is_published')),main_image_url:String(fd.get('main_image_url')||'').trim()||null};
  const {error}=await s.from('motos').update(patch).eq('id',id);
  if(error) throw error; revalidatePath(`/admin/motos/${id}/edit`); }

export async function togglePublish(id:string,current:boolean){ const s=await createClient();
  const {error}=await s.from('motos').update({is_published:!current}).eq('id',id);
  if(error) throw error; revalidatePath('/admin/motos'); }

export async function deleteMoto(id:string){ const s=await createClient();
  const {error}=await s.from('motos').delete().eq('id',id);
  if(error) throw error; revalidatePath('/admin/motos'); }

/* SPECS */
export async function addSpec(motoId:string,fd:FormData){ const s=await createClient();
  const row={moto_id:motoId,category:String(fd.get('category')||'').trim()||null,
    subcategory:String(fd.get('subcategory')||'').trim()||null,key_name:String(fd.get('key_name')||'').trim(),
    value_text:String(fd.get('value_text')||'').trim(),unit:String(fd.get('unit')||'').trim()||null,
    sort_order:Number(fd.get('sort_order')||0)||0};
  const {error}=await s.from('moto_specs').insert(row); if(error) throw error;
  revalidatePath(`/admin/motos/${motoId}/specs`); }

export async function deleteSpec(specId:string,motoId:string){ const s=await createClient();
  const {error}=await s.from('moto_specs').delete().eq('id',specId); if(error) throw error;
  revalidatePath(`/admin/motos/${motoId}/specs`); }

/* IMAGES */
export async function uploadImage(motoId:string,fd:FormData){
  const s=await createClient();
  const file=fd.get('file') as File|null;
  const alt=String(fd.get('alt')||'').trim()||null;
  const makeMain=b(fd.get('make_main'));
  if(!file) throw new Error('Aucun fichier');
  const path=`motos/${motoId}/${Date.now()}-${file.name}`;
  const {error:up}=await s.storage.from('motos').upload(path,file,{upsert:false}); if(up) throw up;
  const {data:pub}=s.storage.from('motos').getPublicUrl(path);
  const {error}=await s.from('moto_images').insert({moto_id:motoId,image_url:pub.publicUrl,alt,is_main:makeMain});
  if(error) throw error; revalidatePath(`/admin/motos/${motoId}/images`); }

export async function setMainImage(imgId:string,motoId:string){ const s=await createClient();
  const {error}=await s.from('moto_images').update({is_main:true}).eq('id',imgId);
  if(error) throw error; revalidatePath(`/admin/motos/${motoId}/images`); }

export async function deleteImage(imgId:string,motoId:string){ const s=await createClient();
  const {error}=await s.from('moto_images').delete().eq('id',imgId);
  if(error) throw error; revalidatePath(`/admin/motos/${motoId}/images`); }
