-- =========================================
-- docs/db/sql/dynamic_version1.sql
-- Dynamic moto filters (facets + search) - FIX pour ton schéma réel
-- Tables conformes à schema_catalog_v1.csv
-- =========================================

-- Schéma réel constaté :
--   public.motos(id uuid PK, brand_id uuid, brand_name text, model_name text, year int, price_tnd numeric, featured boolean, created_at, updated_at)
--   public.spec_groups(id uuid PK, name text, sort_order int)
--   public.spec_items(id uuid PK, group_id uuid FK, key text, label text, unit text, data_type text, sort_order int, is_optional boolean)
--   public.moto_spec_values(
--       moto_id uuid FK -> motos.id,
--       spec_item_id uuid FK -> spec_items.id,
--       value_text text, value_number numeric, value_boolean boolean, value_json jsonb,
--       unit_override text, updated_at timestamptz
--   )  -- PK composite (moto_id, spec_item_id)
--   public.moto_images(id uuid PK, moto_id uuid FK, url text, alt text, sort_order int, is_primary boolean, path text)

-- 1) Indexation adaptée
CREATE INDEX IF NOT EXISTS idx_msv_item_num   ON public.moto_spec_values(spec_item_id, value_number);
CREATE INDEX IF NOT EXISTS idx_msv_item_text  ON public.moto_spec_values(spec_item_id, value_text);
CREATE INDEX IF NOT EXISTS idx_msv_item_bool  ON public.moto_spec_values(spec_item_id, value_boolean);
CREATE INDEX IF NOT EXISTS idx_msv_moto       ON public.moto_spec_values(moto_id);
CREATE INDEX IF NOT EXISTS idx_si_key         ON public.spec_items(key);
CREATE INDEX IF NOT EXISTS idx_motos_year_price ON public.motos(year, price_tnd);

-- 2) Vue facettes (min/max, distributions) avec spec_item_id + data_type
DROP VIEW IF EXISTS public.vw_spec_facets CASCADE;
CREATE VIEW public.vw_spec_facets AS
WITH base AS (
  SELECT
    si.id                AS item_id,
    si.key               AS item_key,
    si.label             AS item_label,
    si.unit              AS item_unit,
    si.data_type         AS item_type,      -- <- data_type (text|number|boolean|enum|json)
    si.group_id,
    COALESCE(g.name,'Autres') AS group_name,
    g.sort_order         AS group_sort,
    si.sort_order        AS item_sort
  FROM public.spec_items si
  LEFT JOIN public.spec_groups g ON g.id = si.group_id
),
nums AS (
  SELECT
    mv.spec_item_id AS item_id,
    MIN(mv.value_number) AS min_val,
    MAX(mv.value_number) AS max_val
  FROM public.moto_spec_values mv
  WHERE mv.value_number IS NOT NULL
  GROUP BY mv.spec_item_id
),
bools AS (
  SELECT
    mv.spec_item_id AS item_id,
    jsonb_build_object(
      'true',  COUNT(*) FILTER (WHERE mv.value_boolean IS TRUE),
      'false', COUNT(*) FILTER (WHERE mv.value_boolean IS FALSE)
    ) AS dist_bool
  FROM public.moto_spec_values mv
  WHERE mv.value_boolean IS NOT NULL
  GROUP BY mv.spec_item_id
),
texts AS (
  SELECT
    t.spec_item_id AS item_id,
    jsonb_agg( jsonb_build_object('value', t.value_text, 'count', t.cnt)
               ORDER BY t.cnt DESC, t.value_text ASC ) AS dist_text
  FROM (
    SELECT spec_item_id, value_text, COUNT(*) AS cnt
    FROM public.moto_spec_values
    WHERE value_text IS NOT NULL AND value_text <> ''
    GROUP BY spec_item_id, value_text
    ORDER BY COUNT(*) DESC
    LIMIT 1000
  ) t
  GROUP BY t.spec_item_id
)
SELECT
  b.group_name,
  b.group_sort,
  b.item_id,
  b.item_key,
  b.item_label,
  b.item_unit,
  b.item_type,
  b.item_sort,
  n.min_val,
  n.max_val,
  bo.dist_bool,
  tx.dist_text
FROM base b
LEFT JOIN nums  n  ON n.item_id = b.item_id
LEFT JOIN bools bo ON bo.item_id = b.item_id
LEFT JOIN texts tx ON tx.item_id = b.item_id
ORDER BY b.group_sort NULLS LAST, b.group_name, b.item_sort NULLS LAST, b.item_label;

-- 3) RPC: facets JSON groupées par groupe
DROP FUNCTION IF EXISTS public.fn_get_filter_facets() CASCADE;
CREATE OR REPLACE FUNCTION public.fn_get_filter_facets()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
SELECT COALESCE(
  jsonb_agg(
    jsonb_build_object(
      'group', group_name,
      'items',
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'key',        item_key,
              'label',      item_label,
              'unit',       item_unit,
              'type',       item_type,
              'min',        min_val,
              'max',        max_val,
              'dist_bool',  dist_bool,
              'dist_text',  dist_text
            )
            ORDER BY item_sort NULLS LAST, item_label
          )
          FROM public.vw_spec_facets v2
          WHERE v2.group_name = v.group_name
        )
    )
    ORDER BY group_sort NULLS LAST, group_name
  ),
  '[]'::jsonb
)
FROM (
  SELECT DISTINCT group_name, group_sort
  FROM public.vw_spec_facets
  ORDER BY group_sort NULLS LAST, group_name
) v;
$$;

-- 4) RPC: recherche dynamique (corrigée pour spec_item_id + data_type)
DROP FUNCTION IF EXISTS public.fn_search_motos(jsonb, int, int) CASCADE;
CREATE OR REPLACE FUNCTION public.fn_search_motos(
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_limit   int   DEFAULT 24,
  p_offset  int   DEFAULT 0
)
RETURNS SETOF jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_sql      text;
  v_where    text := 'WHERE 1=1';
  v_specs    jsonb := COALESCE(p_filters->'specs','{}'::jsonb);
  v_key      text;
  v_val      jsonb;
BEGIN
  -- Prix
  IF (p_filters ? 'price') THEN
    IF ((p_filters->'price') ? 'min') THEN
      v_where := v_where || format(' AND m.price_tnd >= %L::numeric', (p_filters->'price'->>'min'));
    END IF;
    IF ((p_filters->'price') ? 'max') THEN
      v_where := v_where || format(' AND m.price_tnd <= %L::numeric', (p_filters->'price'->>'max'));
    END IF;
  END IF;

  -- Année
  IF (p_filters ? 'year') THEN
    IF ((p_filters->'year') ? 'min') THEN
      v_where := v_where || format(' AND m.year >= %L::int', (p_filters->'year'->>'min'));
    END IF;
    IF ((p_filters->'year') ? 'max') THEN
      v_where := v_where || format(' AND m.year <= %L::int', (p_filters->'year'->>'max'));
    END IF;
  END IF;

  -- Marques (optionnel)
  IF (p_filters ? 'brand_ids') THEN
    v_where := v_where || format(' AND m.brand_id = ANY (%L::uuid[])',
      ARRAY(SELECT jsonb_array_elements_text(p_filters->'brand_ids'))
    );
  END IF;

  -- Base
  v_sql := '
    WITH base AS (
      SELECT m.*
      FROM public.motos m
      ' || v_where || '
    )';

  -- Pour chaque spec key → CTE filtrante + JOIN
  FOR v_key, v_val IN
    SELECT key, value FROM jsonb_each(v_specs)
  LOOP
    v_sql := v_sql || '
      , s_' || replace(v_key, '''','') || ' AS (
          SELECT mv.moto_id
          FROM public.moto_spec_values mv
          JOIN public.spec_items si ON si.id = mv.spec_item_id
          WHERE si.key = ' || quote_literal(v_key) || '
          AND (
            CASE si.data_type
              WHEN ''number'' THEN (
                ( ' || CASE WHEN (v_val ? 'min') THEN format('mv.value_number >= %L::numeric', (v_val->>'min')) ELSE 'TRUE' END || ' )
                AND
                ( ' || CASE WHEN (v_val ? 'max') THEN format('mv.value_number <= %L::numeric', (v_val->>'max')) ELSE 'TRUE' END || ' )
              )
              WHEN ''boolean'' THEN (
                mv.value_boolean IS NOT DISTINCT FROM ' ||
                  CASE
                    WHEN jsonb_typeof(v_val) = 'boolean' THEN (v_val::text)
                    WHEN jsonb_typeof(v_val) = 'string' AND lower(v_val->>0) IN ('true','false') THEN lower(v_val->>0)
                    ELSE 'NULL'
                  END || '
              )
              WHEN ''enum'' THEN (
                mv.value_text = ANY (' ||
                  CASE
                    WHEN jsonb_typeof(v_val) = 'array' THEN format('%L::text[]', ARRAY(SELECT jsonb_array_elements_text(v_val)))
                    WHEN jsonb_typeof(v_val) = 'object' AND (v_val ? 'in') THEN format('%L::text[]', ARRAY(SELECT jsonb_array_elements_text(v_val->'in')))
                    ELSE 'ARRAY[]::text[]'
                  END
                || ')
              )
              ELSE (
                -- text/json : prise en charge "in" ou recherche partielle
                ' ||
                CASE
                  WHEN jsonb_typeof(v_val) = 'array' THEN
                    'mv.value_text = ANY ('|| format('%L::text[]', ARRAY(SELECT jsonb_array_elements_text(v_val))) || ')'
                  WHEN jsonb_typeof(v_val) = 'object' AND (v_val ? 'in') THEN
                    'mv.value_text = ANY ('|| format('%L::text[]', ARRAY(SELECT jsonb_array_elements_text(v_val->'in'))) || ')'
                  WHEN jsonb_typeof(v_val) = 'string' THEN
                    'mv.value_text ILIKE '|| quote_literal('%'||(v_val->>0)||'%')
                  ELSE
                    'TRUE'
                END
                || '
              )
            END
          )
          GROUP BY mv.moto_id
      )';
  END LOOP;

  -- Assemblage
  v_sql := v_sql || '
    SELECT jsonb_build_object(
      ''id'', m.id,
      ''brand_id'', m.brand_id,
      ''brand_name'', m.brand_name,
      ''model_name'', m.model_name,
      ''year'', m.year,
      ''price_tnd'', m.price_tnd
    ) AS j
    FROM base m';

  FOR v_key, v_val IN
    SELECT key, value FROM jsonb_each(v_specs)
  LOOP
    v_sql := v_sql || '
      JOIN s_' || replace(v_key, '''','') || ' USING (moto_id)';
  END LOOP;

  v_sql := v_sql || format('
    ORDER BY m.price_tnd NULLS LAST, m.year DESC, m.model_name
    LIMIT %s OFFSET %s
  ', p_limit, p_offset);

  RETURN QUERY EXECUTE v_sql;
END;
$$;

-- 5) Droits (si catalogue public)
GRANT EXECUTE ON FUNCTION public.fn_get_filter_facets() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_search_motos(jsonb, int, int) TO anon, authenticated;

-- (optionnel) SECURITY DEFINER si RLS strictes :
-- ALTER FUNCTION public.fn_get_filter_facets() SECURITY DEFINER;
-- ALTER FUNCTION public.fn_search_motos(jsonb, int, int) SECURITY DEFINER;

-- 6) Sanity checks
-- SELECT * FROM public.vw_spec_facets LIMIT 20;
-- SELECT public.fn_get_filter_facets();
-- SELECT public.fn_search_motos(
--   jsonb_build_object(
--     'price', jsonb_build_object('min', 10000, 'max', 120000),
--     'year',  jsonb_build_object('min', 2020,  'max', 2025),
--     'specs', jsonb_build_object(
--       'engine_cc', jsonb_build_object('min', 125, 'max', 1000),
--       'abs', true,
--       'cooling', jsonb_build_array('liquid')
--     )
--   ),
--   24, 0
-- );
