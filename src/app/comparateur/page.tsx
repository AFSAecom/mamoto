'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Brand = { id: string; name: string };
type Moto = {
  id: string;
  brand_id: string;
  model_name: string;
  year: number | null;
  price_tnd: string | number | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function ComparatorPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
 
