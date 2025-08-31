CREATE INDEX IF NOT EXISTS idx_motos_brand_model
ON public.motos(brand_id, model_name);
