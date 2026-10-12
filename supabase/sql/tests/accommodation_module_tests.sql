begin;
-- Runs the Phase 1 checks against a database where accommodation_module_2026_10.sql
-- has been applied. Everything happens inside one transaction that is rolled
-- back, so it leaves no trace. Run: supabase db query --linked -f <this file>
insert into public.businesses (id, name, status, kind) values ('biz_test_acc_co', 'Test Lettings Co', 'Approved', 'accommodation_company');
insert into public.business_listings (business_id, name, business_type) values ('biz_test_acc_co', 'Test Lettings Co', 'accommodation');
insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee, site_tier_key) values ('biz_test_acc_co', 'free', 'Active', 0, 'acc-free');
insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('046ebe5c-3422-4292-839d-6bc1a9e0b9cd', 'biz_test_acc_co', 'Owner', 'approved', 'owner@test.example', 'Test', 'Owner');
insert into public.accommodation_company_profiles (business_id, name, phone, email, logo, website) values ('biz_test_acc_co', 'Test Lettings Co', '01628 000000', 'hello@test.example', 'https://example.com/logo.png', 'https://co.example');
do $T$ begin 
  if ((select count(*) from public.accommodation_plan_tiers) = 6) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T01 six tiers seeded', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T01 six tiers seeded (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T01 six tiers seeded: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if (not exists (select 1 from public.businesses where kind is null)) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T02 standard businesses default to kind=standard', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T02 standard businesses default to kind=standard (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T02 standard businesses default to kind=standard: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform set_config('t.p1', public.accommodation_create_property('biz_test_acc_co', 'River Loft'), false);
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'draft') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T03 owner creates a draft property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T03 owner creates a draft property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T03 owner creates a draft property: ' || sqlerrm, false); end $T$;
do $T$ begin insert into public.businesses (id, name, kind, parent_id, property_state, status) values ('biz_hack', 'x', 'accommodation_property', 'biz_test_acc_co', 'live', 'Approved');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T04 direct insert of a property row is blocked (no error raised)', false);
exception when others then
  if sqlerrm ilike '%%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T04 direct insert of a property row is blocked', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T04 direct insert of a property row is blocked: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin update public.businesses set property_state = 'live' where id = current_setting('t.p1');
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'draft') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T05 direct state change does nothing (no update rights)', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T05 direct state change does nothing (no update rights) (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T05 direct state change does nothing (no update rights): ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_submit_property(current_setting('t.p1'));
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T06 submit without an address is refused (no error raised)', false);
exception when others then
  if sqlerrm ilike '%address%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T06 submit without an address is refused', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T06 submit without an address is refused: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin update public.business_listings set address = '1 River Road, Maidenhead', lat = '51.52', lng = '-0.72', description = 'Lovely loft', hero_image = 'https://example.com/hero.jpg', phone = '07000 111111' where business_id = current_setting('t.p1');
  if ((select address from public.business_listings where business_id = current_setting('t.p1')) like '1 River%') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T07 company member edits the property listing (extended membership)', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T07 company member edits the property listing (extended membership) (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T07 company member edits the property listing (extended membership): ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_submit_property(current_setting('t.p1'));
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'pending') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T08 submit → pending', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T08 submit → pending (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T08 submit → pending: ' || sqlerrm, false); end $T$;
do $T$ begin perform set_config('t.p2', public.accommodation_create_property('biz_test_acc_co', 'Garden Cottage'), false); update public.business_listings set address = '2 Garden Lane' where business_id = current_setting('t.p2');
  if (true) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T09 create a second property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T09 create a second property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T09 create a second property: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_submit_property(current_setting('t.p2'));
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T10 free plan: second submit hits the 1-property limit (no error raised)', false);
exception when others then
  if sqlerrm ilike '%PROPERTY_LIMIT%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T10 free plan: second submit hits the 1-property limit', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T10 free plan: second submit hits the 1-property limit: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin 
  if (public.accommodation_slot_usage('biz_test_acc_co') @> '{"used":1,"limit":1}') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T11 slot usage shows 1 of 1', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T11 slot usage shows 1 of 1 (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T11 slot usage shows 1 of 1: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_review_property(current_setting('t.p1'), true);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T12 owner can''t review their own property (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Only Maidenhead admin%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T12 owner can''t review their own property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T12 owner can''t review their own property: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_apply_capacity('biz_test_acc_co', array[]::text[]);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T13 owner can''t apply capacity changes (no error raised)', false);
exception when others then
  if sqlerrm ilike '%%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T13 owner can''t apply capacity changes', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T13 owner can''t apply capacity changes: ' || sqlerrm, false); end if;
end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_create_property('biz_test_acc_co', 'Intruder');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T14 outsider can''t add a property (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Not allowed%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T14 outsider can''t add a property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T14 outsider can''t add a property: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin 
  if ((select count(*) from public.business_listings where business_id = current_setting('t.p1')) = 0) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T15 outsider can''t read the property''s listing', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T15 outsider can''t read the property''s listing (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T15 outsider can''t read the property''s listing: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_delete_property(current_setting('t.p1'));
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T16 outsider can''t submit/hide/delete it (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Not allowed%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T16 outsider can''t submit/hide/delete it', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T16 outsider can''t submit/hide/delete it: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin 
  if ((select count(*) from public.public_business_profiles where business_id = current_setting('t.p1')) = 0) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T17 pending property is not public', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T17 pending property is not public (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T17 pending property is not public: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"7f8e200f-b077-4f8c-a455-f47414e967d0","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_review_property(current_setting('t.p1'), false, '');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T18 reject without a reason is refused (no error raised)', false);
exception when others then
  if sqlerrm ilike '%reason%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T18 reject without a reason is refused', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T18 reject without a reason is refused: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_review_property(current_setting('t.p1'), true);
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'live') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T19 admin approves → live', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T19 admin approves → live (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T19 admin approves → live: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
do $T$ begin 
  if ((select count(*) from public.public_business_profiles where business_id = current_setting('t.p1')) = 1 and not exists (select 1 from public.public_business_profiles where business_id = 'biz_test_acc_co')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T20 live free property is public; company is not', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T20 live free property is public; company is not (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T20 live free property is public; company is not: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select plan from public.public_business_profiles where business_id = current_setting('t.p1')) = 'free' and (select hero_image from public.public_business_profiles where business_id = current_setting('t.p1')) is null and (select description from public.public_business_profiles where business_id = current_setting('t.p1')) is null and (select phone from public.public_business_profiles where business_id = current_setting('t.p1')) = '01628 000000' and (select logo from public.public_business_profiles where business_id = current_setting('t.p1')) = 'https://example.com/logo.png' and (select lat from public.public_business_profiles where business_id = current_setting('t.p1')) = '51.52') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T21 free property: basic only (no hero/description), company contact + logo', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T21 free property: basic only (no hero/description), company contact + logo (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T21 free property: basic only (no hero/description), company contact + logo: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select live_properties from public.public_accommodation_companies where business_id = 'biz_test_acc_co') = 1) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T22 MANAGED BY view lists the company with 1 live property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T22 MANAGED BY view lists the company with 1 live property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T22 MANAGED BY view lists the company with 1 live property: ' || sqlerrm, false); end $T$;
update public.business_subscriptions set plan = 'premium', site_tier_key = 'acc-5' where business_id = 'biz_test_acc_co';
do $T$ begin 
  if ((select plan from public.public_business_profiles where business_id = current_setting('t.p1')) = 'premium' and (select description from public.public_business_profiles where business_id = current_setting('t.p1')) = 'Lovely loft' and (select hero_image from public.public_business_profiles where business_id = current_setting('t.p1')) is not null and public.accommodation_property_limit('biz_test_acc_co') = 5 and public.accommodation_article_allowance('biz_test_acc_co') = 3) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T23 paid company: property gets full profile', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T23 paid company: property gets full profile (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T23 paid company: property gets full profile: ' || sqlerrm, false); end $T$;
do $T$ begin update public.business_listings set contact_source = 'own' where business_id = current_setting('t.p1');
  if ((select phone from public.public_business_profiles where business_id = current_setting('t.p1')) = '07000 111111') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T24 own contact details only when chosen', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T24 own contact details only when chosen (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T24 own contact details only when chosen: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_submit_property(current_setting('t.p2'));
  if ((select property_state from public.businesses where id = current_setting('t.p2')) = 'pending') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T25 paid plan: second property can be submitted', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T25 paid plan: second property can be submitted (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T25 paid plan: second property can be submitted: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"7f8e200f-b077-4f8c-a455-f47414e967d0","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_review_property(current_setting('t.p2'), false, 'Photos missing');
  if ((select property_state from public.businesses where id = current_setting('t.p2')) = 'rejected' and (select rejection_reason->>'property' from public.business_listings where business_id = current_setting('t.p2')) = 'Photos missing') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T26 admin rejects with reason; owner sees it', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T26 admin rejects with reason; owner sees it (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T26 admin rejects with reason; owner sees it: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_set_property_hidden(current_setting('t.p1'), true); perform set_config('t.u', (public.accommodation_slot_usage('biz_test_acc_co')->>'used'), false); perform public.accommodation_set_property_hidden(current_setting('t.p1'), false);
  if (current_setting('t.u') = '1' and (select property_state from public.businesses where id = current_setting('t.p1')) = 'live') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T27 hide frees the slot; unhide takes it back', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T27 hide frees the slot; unhide takes it back (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T27 hide frees the slot; unhide takes it back: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
update public.business_subscriptions set plan = 'free', site_tier_key = 'acc-free' where business_id = 'biz_test_acc_co';
do $T$ begin perform public.accommodation_apply_capacity('biz_test_acc_co', array[current_setting('t.p1'), current_setting('t.p2')]);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T28 capacity: keeping more than the plan allows is refused (no error raised)', false);
exception when others then
  if sqlerrm ilike '%plan allows%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T28 capacity: keeping more than the plan allows is refused', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T28 capacity: keeping more than the plan allows is refused: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_apply_capacity('biz_test_acc_co', array[current_setting('t.p1')]);
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'live' and (select property_state from public.businesses where id = current_setting('t.p2')) = 'draft') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T29 downgrade to free keeping one: other goes back to draft, kept stays live', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T29 downgrade to free keeping one: other goes back to draft, kept stays live (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T29 downgrade to free keeping one: other goes back to draft, kept stays live: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_apply_capacity('biz_test_acc_co', array[]::text[]);
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'inactive' and exists (select 1 from public.business_listings where business_id = current_setting('t.p1') and description = 'Lovely loft')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T30 cancellation keeping none: live → inactive (data kept)', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T30 cancellation keeping none: live → inactive (data kept) (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T30 cancellation keeping none: live → inactive (data kept): ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_reactivate_property(current_setting('t.p1'));
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'live') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T31 reactivate inactive → live without re-review', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T31 reactivate inactive → live without re-review (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T31 reactivate inactive → live without re-review: ' || sqlerrm, false); end $T$;
do $T$ begin perform set_config('t.p3', public.accommodation_replace_property(current_setting('t.p1'), 'River Loft II'), false);
  if ((select property_state from public.businesses where id = current_setting('t.p1')) = 'archived' and (select count(*) from public.public_business_profiles where business_id = current_setting('t.p1')) = 0 and (select replaces_id from public.businesses where id = current_setting('t.p3')) = current_setting('t.p1')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T32 replace: old comes down at once, new draft linked', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T32 replace: old comes down at once, new draft linked (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T32 replace: old comes down at once, new draft linked: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_delete_property(current_setting('t.p2'));
  if (not exists (select 1 from public.businesses where id = current_setting('t.p2')) and not exists (select 1 from public.business_listings where business_id = current_setting('t.p2'))) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T33 delete removes property and its listing', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T33 delete removes property and its listing (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T33 delete removes property and its listing: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
do $T$ begin update public.businesses set kind = 'standard' where id = 'biz_test_acc_co';
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T34 kind can''t be changed (no error raised)', false);
exception when others then
  if sqlerrm ilike '%can''t be changed%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T34 kind can''t be changed', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T34 kind can''t be changed: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('06877bdd-c8d9-4693-9507-c79b376e4dbb', 'biz_test_acc_co', 'Content Manager', 'approved', 'cm1@test.example', 'C', 'M'); insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('7f8e200f-b077-4f8c-a455-f47414e967d0', 'biz_test_acc_co', 'Content Manager', 'pending', 'cm2@test.example', 'C', 'M');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T35 one Content Manager per business (no error raised)', false);
exception when others then
  if sqlerrm ilike '%business_users_one_cm_per_business%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T35 one Content Manager per business', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T35 one Content Manager per business: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin delete from public.businesses where id = 'biz_test_acc_co';
  if (not exists (select 1 from public.businesses where id like 'biz_river-loft%' or id like 'biz_garden-cottage%')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T36 deleting the company removes its properties', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T36 deleting the company removes its properties (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T36 deleting the company removes its properties: ' || sqlerrm, false); end $T$;
select current_setting('t.r', true) as results;
rollback;