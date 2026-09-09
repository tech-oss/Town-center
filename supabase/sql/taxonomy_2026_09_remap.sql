-- ═══════════════════════════════════════════════════════════════════════════
-- Rewrites stored category slugs to match the September 2026 taxonomy
-- revision (four category lists replaced — see src/Data/taxonomy.js).
--
-- OPTIONAL. The app already handles every slug below through
-- LEGACY_CATEGORY_ALIASES in src/Data/taxonomy.js, so listings render
-- correctly whether or not this has run. This exists so the stored data
-- matches what's on screen rather than relying on a translation layer
-- forever — worth running, not urgent, and safe to run more than once.
--
-- Only slugs that genuinely disappeared are listed. Categories that were
-- merely relabelled kept their slug on purpose (`solicitors` is now "Legal
-- Services", `cleaners` is now "Cleaning") and need no migration at all.
--
-- NOT RUN YET.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.remap_category_array(arr jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(
    (
      select jsonb_agg(distinct coalesce(m.new_slug, e.val))
      from jsonb_array_elements_text(coalesce(arr, '[]'::jsonb)) as e(val)
      left join (values
        -- Shop
        ('accessories-jewellery', 'jewellery-watches'),
        ('clothing',              'fashion-clothing'),
        ('groceries',             'food-groceries'),
        ('home-furniture',        'home-garden'),
        ('shoes-footwear',        'footwear'),
        -- Local Services: Healthcare and Opticians were dropped from the
        -- list; Health & Beauty is the nearest surviving home for them.
        ('healthcare',            'health-beauty'),
        ('opticians',             'health-beauty'),
        -- Services / Freelancer: reorganised around disciplines, not roles
        ('graphic-designers',     'design-creative'),
        ('web-developers',        'web-digital'),
        ('photographers',         'photography-video'),
        ('copywriters',           'writing-content'),
        ('marketing-consultants', 'marketing-social-media'),
        ('personal-trainers',     'tutoring-training'),
        ('tutors',                'tutoring-training'),
        ('virtual-assistants',    'admin-virtual-assistance'),
        -- See & Do
        ('fashion-beauty',        'other-see-do')
      ) as m(old_slug, new_slug) on m.old_slug = e.val
    ),
    '[]'::jsonb
  );
$$;

-- One statement per key, each guarded so a listing that never had that key
-- doesn't gain an empty array it didn't ask for.
update public.business_listings
set business_type_detail = business_type_detail
  || jsonb_build_object('freelancerCategories', public.remap_category_array(business_type_detail -> 'freelancerCategories'))
where business_type_detail ? 'freelancerCategories';

update public.business_listings
set business_type_detail = business_type_detail
  || jsonb_build_object('shopCategories', public.remap_category_array(business_type_detail -> 'shopCategories'))
where business_type_detail ? 'shopCategories';

update public.business_listings
set business_type_detail = business_type_detail
  || jsonb_build_object('seeDoCategories', public.remap_category_array(business_type_detail -> 'seeDoCategories'))
where business_type_detail ? 'seeDoCategories';

update public.business_listings
set business_type_detail = business_type_detail
  || jsonb_build_object('cuisineTypes', public.remap_category_array(business_type_detail -> 'cuisineTypes'))
where business_type_detail ? 'cuisineTypes';

update public.business_listings
set business_type_detail = business_type_detail
  || jsonb_build_object('venueTypes', public.remap_category_array(business_type_detail -> 'venueTypes'))
where business_type_detail ? 'venueTypes';

-- The bare 'other' slug was shared by the venue, cuisine and See & Do
-- pickers, so it can only be resolved per-column, not by the shared map.
update public.business_listings
set business_type_detail = jsonb_set(business_type_detail, '{venueTypes}',
      (select jsonb_agg(case when v = 'other' then 'other-venue' else v end)
       from jsonb_array_elements_text(business_type_detail -> 'venueTypes') as t(v)))
where business_type_detail -> 'venueTypes' ? 'other';

update public.business_listings
set business_type_detail = jsonb_set(business_type_detail, '{cuisineTypes}',
      (select jsonb_agg(case when v = 'other' then 'other-cuisine' else v end)
       from jsonb_array_elements_text(business_type_detail -> 'cuisineTypes') as t(v)))
where business_type_detail -> 'cuisineTypes' ? 'other';

update public.business_listings
set business_type_detail = jsonb_set(business_type_detail, '{seeDoCategories}',
      (select jsonb_agg(case when v = 'other' then 'other-see-do' else v end)
       from jsonb_array_elements_text(business_type_detail -> 'seeDoCategories') as t(v)))
where business_type_detail -> 'seeDoCategories' ? 'other';

drop function if exists public.remap_category_array(jsonb);
