'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function togglePublish(id:string,current:boolean){
  const s=await createClient();
  const {error}=await s.from('motos').update({is_published:!current}).eq('id',id);
  if(error) throw error; revalidatePath('/admin/motos');
}
export async function deleteMoto(id:string){
  const s=await createClient();
  const {error}=await s.from('motos').delete().eq('id',id);
  if(error) throw error; revalidatePath('/admin/motos');
}
