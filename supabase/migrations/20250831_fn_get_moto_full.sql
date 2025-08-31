-- DROP FUNCTION IF EXISTS public.fn_get_moto_full(uuid);
CREATE OR REPLACE FUNCTION public.fn_get_moto_full(p_moto_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH m AS (
  SELECT id, brand, model, year, price, display_image
  FROM public.motos
  WHERE id = p_moto_id
  LIMIT 1
),
grp AS (
  SELECT DISTINCT g.id, g.name, g.sort_order
  FROM public.spec_groups g
  JOIN public.spec_items i ON i.group_id = g.id
  JOIN public.moto_spec_values mv ON mv.spec_item_id = i.id
  WHERE mv.moto_id = p_moto_id
),
it AS (
  SELECT
    i.id,
    i.key,
    i.label,
    i.group_id,
    i.sort_order,
    COALESCE(mv.unit, i.unit) AS unit,
    mv.value_text,
    mv.value_number,
    mv.value_boolean,
    mv.value_json,
    /* valeur lisible unique */
    TRIM(BOTH ' ' FROM
      COALESCE(
        NULLIF(mv.value_text, ''),
        CASE WHEN mv.value_number IS NOT NULL THEN (mv.value_number::text) END,
        CASE WHEN mv.value_boolean IS NOT NULL THEN (CASE WHEN mv.value_boolean THEN 'Oui' ELSE 'Non' END) END,
        CASE WHEN mv.value_json IS NOT NULL THEN (mv.value_json::text) END,
        ''
      )
    ) AS value_raw
  FROM public.spec_items i
  JOIN public.moto_spec_values mv ON mv.spec_item_id = i.id
  WHERE mv.moto_id = p_moto_id
)
SELECT jsonb_build_object(
  'moto', (SELECT to_jsonb(m.*) FROM m),
  'specs',
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'group', g.name,
          'items',
          (
            SELECT COALESCE(
              jsonb_agg(
                jsonb_build_object(
                  'key', i.key,
                  'label', i.label,
                  'unit', i.unit,
                  'value_text', i.value_text,
                  'value_number', i.value_number,
                  'value_boolean', i.value_boolean,
                  'value_json', i.value_json,
                  'value_pretty', TRIM(BOTH ' ' FROM (COALESCE(i.value_raw,'') || CASE WHEN i.unit IS NULL OR i.unit = '' THEN '' ELSE ' ' || i.unit END))
                )
                ORDER BY i.sort_order NULLS LAST, i.label
              ),
              '[]'::jsonb
            )
            FROM it i
            WHERE i.group_id = g.id
          )
        )
        ORDER BY g.sort_order NULLS LAST, g.name
      ),
      '[]'::jsonb
    )
    FROM grp g
  )
);
$$;

COMMENT ON FUNCTION public.fn_get_moto_full IS
'Retourne {moto, specs:[{group, items:[{key,label,unit,value_*,value_pretty}]}]} incluant sous-caractéristiques et valeurs pour une moto.';
