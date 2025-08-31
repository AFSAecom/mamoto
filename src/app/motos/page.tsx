import { createClient } from '@supabase/supabase-js';
import MotoCard from '@/components/MotoCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MotosPage() {
  const { data, error } = await supabase
    .from('motos')
    .select('id, brand, model, year, price, display_image, image_url, image_path')
    .order('brand', { ascending: true })
    .limit(60);

  if (error) throw new Error(error.message);

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {data?.map((m) => <MotoCard key={m.id} moto={m} />)}
    </div>
  );
}
