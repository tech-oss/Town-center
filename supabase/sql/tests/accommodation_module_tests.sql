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
insert into public.businesses (id, name, status, kind) values ('biz_test_acc_co2', 'Second Lettings', 'Approved', 'accommodation_company');
insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('06877bdd-c8d9-4693-9507-c79b376e4dbb', 'biz_test_acc_co2', 'Owner', 'approved', 'o2@test.example', 'B', 'O');
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_submit_company_profile('biz_test_acc_co2', '{"name":"Second Lettings Ltd","phone":"01628 222222","logo":"https://example.com/l2.png","extra":"ignored"}'::jsonb);
  if ((select approval_status from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') = 'Pending Approval' and (select pending ? 'extra' from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') = false) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T37 company submits its MANAGED BY details for review', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T37 company submits its MANAGED BY details for review (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T37 company submits its MANAGED BY details for review: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select phone from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') is null) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T38 submission is not public until approved', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T38 submission is not public until approved (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T38 submission is not public until approved: ' || sqlerrm, false); end $T$;
do $T$ begin update public.accommodation_company_profiles set phone = 'hacked' where business_id = 'biz_test_acc_co2';
  if ((select phone from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') is null) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T39 members can''t write the profile directly', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T39 members can''t write the profile directly (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T39 members can''t write the profile directly: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_submit_company_profile('biz_test_acc_co2', '{"phone":"1"}'::jsonb);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T40 name is required (no error raised)', false);
exception when others then
  if sqlerrm ilike '%name is required%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T40 name is required', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T40 name is required: ' || sqlerrm, false); end if;
end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_submit_company_profile('biz_test_acc_co2', '{"name":"x"}'::jsonb);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T41 another company can''t submit it (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Not allowed%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T41 another company can''t submit it', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T41 another company can''t submit it: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_review_company_profile('biz_test_acc_co2', true);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T42 owner can''t approve their own profile (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Only Maidenhead admin%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T42 owner can''t approve their own profile', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T42 owner can''t approve their own profile: ' || sqlerrm, false); end if;
end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"7f8e200f-b077-4f8c-a455-f47414e967d0","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_review_company_profile('biz_test_acc_co2', false, ' ');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T43 reject without a reason is refused (no error raised)', false);
exception when others then
  if sqlerrm ilike '%reason%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T43 reject without a reason is refused', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T43 reject without a reason is refused: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_review_company_profile('biz_test_acc_co2', true);
  if ((select phone from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') = '01628 222222' and (select approval_status from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') = 'Up to Date') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T44 admin approves: details become public', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T44 admin approves: details become public (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T44 admin approves: details become public: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_submit_company_profile('biz_test_acc_co2', '{"name":"Second Lettings Ltd","phone":"999"}'::jsonb);
  if (true) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T45 resubmit then admin rejects: reason kept, live details unchanged', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T45 resubmit then admin rejects: reason kept, live details unchanged (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T45 resubmit then admin rejects: reason kept, live details unchanged: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"7f8e200f-b077-4f8c-a455-f47414e967d0","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_review_company_profile('biz_test_acc_co2', false, 'Phone number looks wrong');
  if ((select phone from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') = '01628 222222' and (select rejection_reason from public.accommodation_company_profiles where business_id = 'biz_test_acc_co2') = 'Phone number looks wrong') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T45b', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T45b (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T45b: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee, site_tier_key) values ('biz_test_acc_co2', 'free', 'Active', 0, 'acc-free');
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform set_config('t.q1', public.accommodation_create_property('biz_test_acc_co2', 'Weir View'), false); update public.business_listings set address = '3 Weir Lane' where business_id = current_setting('t.q1'); perform public.accommodation_submit_property(current_setting('t.q1'));
  if ((select property_state from public.businesses where id = current_setting('t.q1')) = 'pending') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T46 second company submits a property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T46 second company submits a property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T46 second company submits a property: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select count(*) from public.approval_actions) = 0) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T47 owners can''t read the approval history', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T47 owners can''t read the approval history (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T47 owners can''t read the approval history: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"7f8e200f-b077-4f8c-a455-f47414e967d0","role":"authenticated"}', false);
do $T$ begin 
  if ((public.admin_pending_counts() ->> 'properties')::int >= 1) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T48 badge counts the pending property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T48 badge counts the pending property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T48 badge counts the pending property: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if (exists (select 1 from public.approval_actions where entity_type = 'company_profile' and business_id = 'biz_test_acc_co2')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T49 admin reads the approval history', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T49 admin reads the approval history (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T49 admin reads the approval history: ' || sqlerrm, false); end $T$;
do $T$ begin delete from public.approval_actions where entity_type = 'company_profile' and business_id = 'biz_test_acc_co2';
  if (not exists (select 1 from public.approval_actions where entity_type = 'company_profile' and business_id = 'biz_test_acc_co2')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T50 admin clears a history entry', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T50 admin clears a history entry (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T50 admin clears a history entry: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
insert into public.businesses (id, name, status, kind) values ('biz_test_acc_co3', 'Third Lettings', 'Approved', 'accommodation_company');
insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee, site_tier_key) values ('biz_test_acc_co3', 'premium', 'Active', 89, 'acc-10');
insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('046ebe5c-3422-4292-839d-6bc1a9e0b9cd', 'biz_test_acc_co3', 'Owner', 'approved', 'o3@test.example', 'A', 'O');
insert into public.businesses (id, name, status, kind, parent_id, property_state, submitted_at) values ('biz_test_acc_co3_p0', 'Alpha House', 'Approved', 'accommodation_property', 'biz_test_acc_co3', 'live', now() - interval '10 days');
insert into public.business_listings (business_id, name, business_type, address) values ('biz_test_acc_co3_p0', 'Alpha House', 'accommodation', '0 Test Road');
insert into public.businesses (id, name, status, kind, parent_id, property_state, submitted_at) values ('biz_test_acc_co3_p1', 'Beta House', 'Approved', 'accommodation_property', 'biz_test_acc_co3', 'live', now() - interval '9 days');
insert into public.business_listings (business_id, name, business_type, address) values ('biz_test_acc_co3_p1', 'Beta House', 'accommodation', '1 Test Road');
insert into public.businesses (id, name, status, kind, parent_id, property_state, submitted_at) values ('biz_test_acc_co3_p2', 'Gamma House', 'Approved', 'accommodation_property', 'biz_test_acc_co3', 'live', now() - interval '8 days');
insert into public.business_listings (business_id, name, business_type, address) values ('biz_test_acc_co3_p2', 'Gamma House', 'accommodation', '2 Test Road');
do $T$ begin 
  if (public.addon_slot_allowance('biz_test_acc_co3', 'article') = 6) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T51 articles follow the tier: 10 properties → 6', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T51 articles follow the tier: 10 properties → 6 (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T51 articles follow the tier: 10 properties → 6: ' || sqlerrm, false); end $T$;
insert into public.businesses (id, name, status) values ('biz_test_std', 'Standard Cafe', 'Approved'); insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee) values ('biz_test_std', 'premium', 'Active', 29.99);
do $T$ begin 
  if (public.addon_slot_allowance('biz_test_std', 'article') = 3) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T52 a standard paying business still gets 3', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T52 a standard paying business still gets 3 (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T52 a standard paying business still gets 3: ' || sqlerrm, false); end $T$;
insert into public.homepage_placements (slot_type, lane, starts_at, ends_at, status, source, business_id, content_kind, content_id) values ('featured_business', 9, '2031-01-01', '2031-01-08', 'pending_approval', 'purchase', 'biz_test_acc_co3', 'business', 'biz_test_acc_co3');
do $T$ begin 
  if ((select content_id from public.homepage_placements where business_id = 'biz_test_acc_co3' and slot_type = 'featured_business') = 'biz_test_acc_co3_p0') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T53 company''s featured slot shows its oldest live property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T53 company''s featured slot shows its oldest live property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T53 company''s featured slot shows its oldest live property: ' || sqlerrm, false); end $T$;
update public.homepage_placements set status = 'approved' where business_id = 'biz_test_acc_co3';
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_assign_featured_property((select id from public.homepage_placements where business_id = 'biz_test_acc_co3'), 'biz_test_acc_co3_p2');
  if ((select content_id || '/' || status from public.homepage_placements where business_id = 'biz_test_acc_co3') = 'biz_test_acc_co3_p2/approved') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T54 company switches the slot to another live property; stays approved', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T54 company switches the slot to another live property; stays approved (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T54 company switches the slot to another live property; stays approved: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_assign_featured_property((select id from public.homepage_placements where business_id = 'biz_test_acc_co3'), current_setting('t.q1'));
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T55 can''t assign another company''s property (no error raised)', false);
exception when others then
  if sqlerrm ilike '%live properties%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T55 can''t assign another company''s property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T55 can''t assign another company''s property: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_after_plan_change('biz_test_acc_co3');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T56 owner can''t run the plan-change handler (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Not allowed%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T56 owner can''t run the plan-change handler', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T56 owner can''t run the plan-change handler: ' || sqlerrm, false); end if;
end $T$;
reset role; select set_config('request.jwt.claims', '', false);
insert into public.accommodation_plan_changes (business_id, change, target_tier, keep) values ('biz_test_acc_co3', 'cancel', 'acc-free', array['biz_test_acc_co3_p1']);
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_set_plan_change_keep('biz_test_acc_co3', array['biz_test_acc_co3_p0', 'biz_test_acc_co3_p1']);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T57 keep list can''t exceed the new plan (no error raised)', false);
exception when others then
  if sqlerrm ilike '%allows 1%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T57 keep list can''t exceed the new plan', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T57 keep list can''t exceed the new plan: ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_set_plan_change_keep('biz_test_acc_co3', array['biz_test_acc_co3_p2']);
  if ((select keep from public.accommodation_plan_changes where business_id = 'biz_test_acc_co3') = array['biz_test_acc_co3_p2']) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T58 owner changes which property stays', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T58 owner changes which property stays (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T58 owner changes which property stays: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
update public.business_subscriptions set plan = 'free', site_tier_key = 'acc-free' where business_id = 'biz_test_acc_co3';
select set_config('request.jwt.claims', '{"role":"service_role"}', false);
do $T$ begin perform public.accommodation_after_plan_change('biz_test_acc_co3');
  if ((select string_agg(id || '=' || property_state, ',' order by id) from public.businesses where parent_id = 'biz_test_acc_co3') = 'biz_test_acc_co3_p0=inactive,biz_test_acc_co3_p1=inactive,biz_test_acc_co3_p2=live' and not exists (select 1 from public.accommodation_plan_changes where business_id = 'biz_test_acc_co3')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T59 cancellation takes effect: chosen property stays, others inactive, change cleared', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T59 cancellation takes effect: chosen property stays, others inactive, change cleared (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T59 cancellation takes effect: chosen property stays, others inactive, change cleared: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if (public.addon_slot_allowance('biz_test_acc_co3', 'article') = 0) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T60 free company gets no included articles', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T60 free company gets no included articles (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T60 free company gets no included articles: ' || sqlerrm, false); end $T$;
update public.business_subscriptions set plan = 'premium', site_tier_key = 'acc-5' where business_id = 'biz_test_acc_co3'; update public.businesses set property_state = 'live' where parent_id = 'biz_test_acc_co3';
update public.business_subscriptions set plan = 'free', site_tier_key = 'acc-free' where business_id = 'biz_test_acc_co3';
do $T$ begin perform public.accommodation_after_plan_change('biz_test_acc_co3');
  if ((select string_agg(id || '=' || property_state, ',' order by id) from public.businesses where parent_id = 'biz_test_acc_co3') = 'biz_test_acc_co3_p0=live,biz_test_acc_co3_p1=inactive,biz_test_acc_co3_p2=inactive') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T61 with no choice made, the longest-standing live property stays', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T61 with no choice made, the longest-standing live property stays (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T61 with no choice made, the longest-standing live property stays: ' || sqlerrm, false); end $T$;
update public.businesses set property_state = 'inactive' where parent_id = 'biz_test_acc_co3'; update public.homepage_placements set content_kind = 'business', content_id = 'biz_test_acc_co3', status = 'pending_approval' where business_id = 'biz_test_acc_co3';
do $T$ begin 
  if ((select coalesce(content_id, 'none') || '/' || status from public.homepage_placements where business_id = 'biz_test_acc_co3') = 'none/awaiting_content') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T62 no live property: featured slot waits for a choice', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T62 no live property: featured slot waits for a choice (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T62 no live property: featured slot waits for a choice: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
insert into public.businesses (id, name, status, kind) values ('biz_test_acc_co5', 'Fifth Lettings', 'Approved', 'accommodation_company');
insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee, site_tier_key) values ('biz_test_acc_co5', 'premium', 'Active', 49, 'acc-5');
insert into public.businesses (id, name, status, kind, parent_id, property_state) values ('biz_test_acc_co5_p', 'Reviewed Flat', 'Approved', 'accommodation_property', 'biz_test_acc_co5', 'live');
insert into public.business_listings (business_id, name, business_type) values ('biz_test_acc_co5_p', 'Reviewed Flat', 'accommodation');
insert into public.business_reviews (business_id, reviewer, rating, date, text, status) values ('biz_test_acc_co5_p', 'Guest', 5, current_date, 'Lovely stay', 'Visible');
set role authenticated; select set_config('request.jwt.claims', '{"sub":"7f8e200f-b077-4f8c-a455-f47414e967d0","role":"authenticated"}', false);
update public.business_reviews set status = 'Visible' where business_id = 'biz_test_acc_co5_p';
reset role; select set_config('request.jwt.claims', '', false);
do $T$ begin 
  if (exists (select 1 from public.public_business_reviews where business_id = 'biz_test_acc_co5_p')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T63 a live paid property''s review is public', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T63 a live paid property''s review is public (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T63 a live paid property''s review is public: ' || sqlerrm, false); end $T$;
update public.businesses set property_state = 'hidden' where id = 'biz_test_acc_co5_p';
do $T$ begin 
  if (not exists (select 1 from public.public_business_reviews where business_id = 'biz_test_acc_co5_p')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T64 hidden property: review not public', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T64 hidden property: review not public (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T64 hidden property: review not public: ' || sqlerrm, false); end $T$;
update public.businesses set property_state = 'live' where id = 'biz_test_acc_co5_p'; update public.business_subscriptions set plan = 'free' where business_id = 'biz_test_acc_co5';
do $T$ begin 
  if (not exists (select 1 from public.public_business_reviews where business_id = 'biz_test_acc_co5_p')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T65 free company: property reviews not public', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T65 free company: property reviews not public (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T65 free company: property reviews not public: ' || sqlerrm, false); end $T$;
insert into public.businesses (id, name, status, kind) values ('biz_test_acc_co6', 'Sixth Lettings', 'Approved', 'accommodation_company');
insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('046ebe5c-3422-4292-839d-6bc1a9e0b9cd', 'biz_test_acc_co6', 'Owner', 'approved', 'o6@test.example', 'A', 'O');
insert into public.business_subscriptions (business_id, plan, plan_status, monthly_fee, site_tier_key) values ('biz_test_acc_co6', 'premium', 'Active', 49, 'acc-5');
insert into public.businesses (id, name, status, kind, parent_id, property_state) values ('biz_test_acc_co6_a', 'Prop A', 'Approved', 'accommodation_property', 'biz_test_acc_co6', 'live'), ('biz_test_acc_co6_b', 'Prop B', 'Approved', 'accommodation_property', 'biz_test_acc_co6', 'live');
insert into public.analytics_events (business_id, content_type, content_id, event_type, source) values
  ('biz_test_acc_co6_a', 'profile', 'biz_test_acc_co6_a', 'view', 'web'), ('biz_test_acc_co6_a', 'profile', 'biz_test_acc_co6_a', 'view', 'app'),
  ('biz_test_acc_co6_b', 'profile', 'biz_test_acc_co6_b', 'view', 'web'),
  ('biz_test_acc_co6_a', 'news', 'n1', 'view', 'web');
set role authenticated; select set_config('request.jwt.claims', '{"sub":"046ebe5c-3422-4292-839d-6bc1a9e0b9cd","role":"authenticated"}', false);
do $T$ begin 
  if ((select sum(view_count) from public.analytics_daily_views('biz_test_acc_co6', array['profile'], null, current_date - 1, current_date + 1)) = 3) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T66 company-wide profile views add up its properties', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T66 company-wide profile views add up its properties (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T66 company-wide profile views add up its properties: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select sum(view_count) from public.analytics_daily_views('biz_test_acc_co6_a', array['profile'], null, current_date - 1, current_date + 1)) = 2) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T67 one property''s views on their own', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T67 one property''s views on their own (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T67 one property''s views on their own: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select count(*) from public.analytics_content_breakdown('biz_test_acc_co6', current_date - 1, current_date + 1)) = 1) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T68 company-wide content breakdown includes property content', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T68 company-wide content breakdown includes property content (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T68 company-wide content breakdown includes property content: ' || sqlerrm, false); end $T$;
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform * from public.analytics_daily_views('biz_test_acc_co6_a', array['profile'], null, current_date - 1, current_date + 1);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T69 another company can''t read these analytics (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Not authorised%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T69 another company can''t read these analytics', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T69 another company can''t read these analytics: ' || sqlerrm, false); end if;
end $T$;
reset role; select set_config('request.jwt.claims', '', false);
insert into public.business_users (auth_user_id, business_id, role, status, email, first_name, last_name) values ('06877bdd-c8d9-4693-9507-c79b376e4dbb', 'biz_test_acc_co6', 'Content Manager', 'approved', 'cm6@test.example', 'C', 'M');
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform set_config('t.cmp', public.accommodation_create_property('biz_test_acc_co6', 'CM Flat'), false);
  if ((select parent_id from public.businesses where id = current_setting('t.cmp')) = 'biz_test_acc_co6') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T70 Content Manager adds a property', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T70 Content Manager adds a property (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T70 Content Manager adds a property: ' || sqlerrm, false); end $T$;
do $T$ begin update public.business_listings set address = '9 CM Road' where business_id = current_setting('t.cmp');
  if ((select address from public.business_listings where business_id = current_setting('t.cmp')) = '9 CM Road') then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T71 Content Manager edits a property''s listing', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T71 Content Manager edits a property''s listing (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T71 Content Manager edits a property''s listing: ' || sqlerrm, false); end $T$;
do $T$ begin perform public.accommodation_submit_company_profile('biz_test_acc_co6', '{"name":"Sixth Lettings"}'::jsonb);
  if (true) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T72 Content Manager submits the company profile', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T72 Content Manager submits the company profile (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T72 Content Manager submits the company profile: ' || sqlerrm, false); end $T$;
do $T$ begin 
  if ((select count(*) from public.analytics_daily_views('biz_test_acc_co6', array['profile'], null, current_date - 1, current_date + 1)) >= 0) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T73 Content Manager reads company-wide analytics', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T73 Content Manager reads company-wide analytics (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T73 Content Manager reads company-wide analytics: ' || sqlerrm, false); end $T$;
reset role; select set_config('request.jwt.claims', '', false);
insert into public.accommodation_plan_changes (business_id, change, target_tier, keep) values ('biz_test_acc_co6', 'cancel', 'acc-free', array['biz_test_acc_co6_a']);
set role authenticated; select set_config('request.jwt.claims', '{"sub":"06877bdd-c8d9-4693-9507-c79b376e4dbb","role":"authenticated"}', false);
do $T$ begin perform public.accommodation_set_plan_change_keep('biz_test_acc_co6', array['biz_test_acc_co6_b']);
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T74 Content Manager can''t change which properties stay (billing is the owner''s) (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Only the business owner%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T74 Content Manager can''t change which properties stay (billing is the owner''s)', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T74 Content Manager can''t change which properties stay (billing is the owner''s): ' || sqlerrm, false); end if;
end $T$;
do $T$ begin perform public.accommodation_after_plan_change('biz_test_acc_co6');
  perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T75 Content Manager can''t apply plan changes (no error raised)', false);
exception when others then
  if sqlerrm ilike '%Not allowed%' then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T75 Content Manager can''t apply plan changes', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T75 Content Manager can''t apply plan changes: ' || sqlerrm, false); end if;
end $T$;
reset role; select set_config('request.jwt.claims', '', false);
do $T$ begin delete from public.businesses where id = 'biz_test_acc_co6';
  if (not exists (select 1 from public.businesses where parent_id = 'biz_test_acc_co6' or id like 'biz_test_acc_co6%')
   and not exists (select 1 from public.business_listings where business_id like 'biz_test_acc_co6%')
   and not exists (select 1 from public.business_users where business_id = 'biz_test_acc_co6')
   and not exists (select 1 from public.accommodation_company_profiles where business_id = 'biz_test_acc_co6')
   and not exists (select 1 from public.accommodation_plan_changes where business_id = 'biz_test_acc_co6')
   and not exists (select 1 from public.analytics_events where business_id like 'biz_test_acc_co6%')) then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'PASS T76 deleting a company removes everything it owned', false); else perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T76 deleting a company removes everything it owned (check false)', false); end if;
exception when others then perform set_config('t.r', coalesce(current_setting('t.r', true),'') || E'\n' || 'FAIL T76 deleting a company removes everything it owned: ' || sqlerrm, false); end $T$;
select current_setting('t.r', true) as results;
rollback;