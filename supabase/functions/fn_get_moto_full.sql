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
groups AS (
  SELECT
    g.id,
    g.name,
    g.sort_order
  FROM public.spec_groups g
  WHERE EXISTS (
    SELECT 1
    FROM public.spec_items i
    JOIN public.moto_spec_values mv ON mv.spec_item_id = i.id
    WHERE i.group_id = g.id AND mv.moto_id = p_moto_id
  )
),
items AS (
  SELECT
    i.id,
    i.key,
    i.label,
    i.group_id,
    i.unit AS default_unit,
    i.sort_order,
    mv.value_text,
    mv.value_number,
    mv.value_boolean,
    mv.value_json,
    COALESCE(mv.unit, i.unit) AS unit
  FROM public.spec_items i
  JOIN public.moto_spec_values mv ON mv.spec_item_id = i.id
  WHERE mv.moto_id = p_moto_id
)
SELECT jsonb_build_object(
  'moto', (SELECT to_jsonb(m.*) FROM m),
  'specs',
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'group', g.name,
          'items',
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'key', it.key,
                  'label', it.label,
                  'unit', it.unit,
                  'value_text', it.value_text,
                  'value_number', it.value_number,
                  'value_boolean', it.value_boolean,
                  'value_json', it.value_json
                )
                ORDER BY it.sort_order NULLS LAST, it.label
              )
              FROM items it
              WHERE it.group_id = g.id
            )
        )
        ORDER BY g.sort_order NULLS LAST, g.name
      )
      FROM groups g
    )
);
$$;

COMMENT ON FUNCTION public.fn_get_moto_full IS
'Retourne un JSONB: { moto: {...}, specs: [{group, items:[{key,label,unit,value_*}]}] } pour une moto donnée.';
