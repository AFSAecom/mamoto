-- Fonction RPC sûre et lisible, qui marche même avec RLS grâce à SECURITY DEFINER
-- DROP FUNCTION IF EXISTS public.fn_get_moto_full(uuid);
CREATE OR REPLACE FUNCTION public.fn_get_moto_full(p_moto_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  result :=
    jsonb_build_object(
      'moto',
        (
          SELECT to_jsonb(m)
          FROM (
            SELECT id, brand, model, year, price, display_image
            FROM public.motos
            WHERE id = p_moto_id
            LIMIT 1
          ) m
        ),
      'specs',
        (
          SELECT COALESCE(jsonb_agg(spec_group_obj ORDER BY g_sort NULLS LAST, g_name), '[]'::jsonb)
          FROM (
            SELECT
              g.name      AS g_name,
              g.sort_order AS g_sort,
              (
                SELECT COALESCE(
                  jsonb_agg(
                    jsonb_build_object(
                      'key', i.key,
                      'label', i.label,
                      'unit', COALESCE(mv.unit, i.unit),
                      'value_text', mv.value_text,
                      'value_number', mv.value_number,
                      'value_boolean', mv.value_boolean,
                      'value_json', mv.value_json,
                      'value_pretty',
                        TRIM(BOTH ' ' FROM
                          COALESCE(
                            NULLIF(mv.value_text,''),
                            CASE WHEN mv.value_number IS NOT NULL THEN mv.value_number::text END,
                            CASE WHEN mv.value_boolean IS NOT NULL THEN (CASE WHEN mv.value_boolean THEN 'Oui' ELSE 'Non' END) END,
                            CASE WHEN mv.value_json IS NOT NULL THEN mv.value_json::text END,
                            ''
                          )
                          || CASE WHEN COALESCE(mv.unit, i.unit) IS NULL OR COALESCE(mv.unit, i.unit) = '' THEN '' ELSE ' ' || COALESCE(mv.unit, i.unit) END
                        )
                    )
                    ORDER BY i.sort_order NULLS LAST, i.label
                  ),
                  '[]'::jsonb
                )
                FROM public.spec_items i
                LEFT JOIN public.moto_spec_values mv
                  ON mv.spec_item_id = i.id
                 AND mv.moto_id = p_moto_id
                WHERE i.group_id = g.id
              ) AS items
            FROM public.spec_groups g
            WHERE EXISTS (
              SELECT 1
              FROM public.spec_items i
              WHERE i.group_id = g.id
            )
          ) AS grp(g_name, g_sort, items)
          CROSS JOIN LATERAL jsonb_build_object('group', g_name, 'items', items) AS spec_group_obj
        )
    );

  RETURN result;
END;
$$;

-- Permissions minimales: autoriser l’appel RPC par anon
REVOKE ALL ON FUNCTION public.fn_get_moto_full(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_moto_full(uuid) TO anon, authenticated;

-- Aide perfs
CREATE INDEX IF NOT EXISTS idx_moto_spec_values_moto ON public.moto_spec_values(moto_id);
CREATE INDEX IF NOT EXISTS idx_spec_items_group ON public.spec_items(group_id);

COMMENT ON FUNCTION public.fn_get_moto_full IS
'Retourne {moto, specs:[{group, items:[{key,label,unit,value_*,value_pretty}]}]} avec LEFT JOIN pour inclure tous les items du groupe.';
