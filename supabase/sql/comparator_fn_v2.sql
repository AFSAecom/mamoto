-- FILE: comparator_fn_v3.sql
-- Fonction robuste: supporte des variantes de noms de colonnes dans moto_spec_values
-- (spec_item_id|item_id|spec_id) et (moto_id|motoid|moto)

create or replace function public.fn_get_comparator(p_moto_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with sel_motos_raw as (
  select
    m.id,
    coalesce(to_jsonb(m)->>'brand',  to_jsonb(m)->>'marque',  to_jsonb(m)->>'make')        as brand,
    coalesce(to_jsonb(m)->>'model',  to_jsonb(m)->>'modele',  to_jsonb(m)->>'model_name') as model,
    nullif(to_jsonb(m)->>'year','')::int                                                  as year,
    (
      nullif(
        replace(
          regexp_replace(
            coalesce(to_jsonb(m)->>'price_tnd', to_jsonb(m)->>'price', ''),
            '[^0-9\.,-]','', 'g'
          ),
          ',', '.'
        ),
        ''
      )
    )::numeric                                                                             as price,
    coalesce(
      to_jsonb(m)->>'display_image',
      to_jsonb(m)->>'image_url',
      to_jsonb(m)->>'cover_image',
      to_jsonb(m)->>'image'
    ) as image
  from public.motos m
  where m.id = any(p_moto_ids)
),
sel_motos as (
  select * from sel_motos_raw
  order by brand nulls last, model nulls last, year desc nulls last
),

-- On uniformise les colonnes variables de moto_spec_values
msv_norm as (
  select
    -- normaliser spec_item_id (texte)
    coalesce(
      to_jsonb(msv)->>'spec_item_id',
      to_jsonb(msv)->>'item_id',
      to_jsonb(msv)->>'spec_id'
    )                                           as spec_item_id_txt,

    -- normaliser moto_id (uuid en texte)
    coalesce(
      to_jsonb(msv)->>'moto_id',
      to_jsonb(msv)->>'motoid',
      to_jsonb(msv)->>'moto'
    )                                           as moto_id_txt,

    -- normaliser valeur en texte (ordre de priorité)
    coalesce(
      to_jsonb(msv)->>'value_text',
      to_jsonb(msv)->>'value',
      nullif(trim(to_jsonb(msv)->>'value_number'),''),
      nullif(trim(to_jsonb(msv)->>'number_value'),''),
      case when (to_jsonb(msv)->>'value_boolean')::boolean is not null
           then case when (to_jsonb(msv)->>'value_boolean')::boolean then 'Oui' else 'Non' end
           else null end,
      case when to_jsonb(msv)->'value_json' is not null then (to_jsonb(msv)->'value_json')::text end,
      case when to_jsonb(msv)->'json_value' is not null then (to_jsonb(msv)->'json_value')::text end
    )                                           as value_txt
  from public.moto_spec_values msv
),

-- On ne garde que les lignes qui correspondent aux motos demandées
msv_filtered as (
  select *
  from msv_norm
  where nullif(moto_id_txt,'')::uuid = any(p_moto_ids)
),

values_raw as (
  select
    sg.id                 as group_id,
    sg.name               as group_name,
    sg.sort_order         as group_order,
    si.id                 as item_id,
    si.key,
    si.label,
    si.unit,
    si.sort_order         as item_order,
    msvf.moto_id_txt      as moto_id_txt,
    msvf.value_txt        as value
  from public.spec_items si
  join public.spec_groups sg
    on sg.id = si.group_id
  join msv_filtered msvf
    -- Jointure tolérante : si.id est uuid → on le compare en texte
    on si.id::text = msvf.spec_item_id_txt
),

items_grouped as (
  select
    group_id,
    group_name,
    group_order,
    item_id,
    key,
    label,
    unit,
    item_order,
    jsonb_object_agg(moto_id_txt, value order by moto_id_txt) as values_by_moto
  from values_raw
  group by group_id, group_name, group_order, item_id, key, label, unit, item_order
),

groups_grouped as (
  select
    group_id,
    group_name,
    group_order,
    jsonb_agg(
      jsonb_build_object(
        'item_id', item_id,
        'key', key,
        'label', label,
        'unit', unit,
        'values', values_by_moto
      )
      order by item_order nulls last, label
    ) as items
  from items_grouped
  group by group_id, group_name, group_order
)

select jsonb_build_object(
  'motos',
  coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'id', id,
         'brand', brand,
         'model', model,
         'year', year,
         'price', price,
         'image', image
       )
     ) from sel_motos),
    '[]'::jsonb
  ),
  'specs',
  coalesce(
    (select jsonb_agg(
       jsonb_build_object(
         'group', group_name,
         'items', items
       )
       order by group_order nulls last, group_name
     )
     from groups_grouped),
    '[]'::jsonb
  )
);
$$;

grant execute on function public.fn_get_comparator(uuid[]) to anon, authenticated, service_role;

-- Test rapide (remplacer par 2 à 4 UUID existants)
-- select public.fn_get_comparator(array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid]);
