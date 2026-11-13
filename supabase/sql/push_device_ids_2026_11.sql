-- Push figures that count phones, not app installs.
--
-- Deleting and reinstalling the app gives a phone a new notification address
-- (testers do this a lot). The old address stayed on the list, and Apple and
-- Google keep accepting notifications for it for days or weeks, so one phone
-- was counted two or three times in "reached" and "devices".
--
-- The apps now send a lasting id for the phone with their address (iPhone: a
-- value kept in the Keychain, which outlives the app; Android: the phone's
-- per-app id). push_register_device() saves the address and removes any
-- other address with the same phone id, so each phone is on the list once.
--
-- Older entries have no phone id. Each one gets it the next time that phone
-- opens the updated app; ones that never do are old installs, which
-- push_device_ids_cleanup_2026_11.sql removes once testers have updated.
-- Safe to run more than once.

alter table public.push_subscriptions add column if not exists device_id text;
create index if not exists push_subscriptions_device_id_idx on public.push_subscriptions (device_id);

-- Called by the iPhone and Android apps (src/mobile/lib/pushSubscribe.js) on
-- every launch with notifications allowed. p_previous is the address this
-- install used before, if the phone has issued a new one since.
create or replace function public.push_register_device(
  p_endpoint text, p_platform text, p_device_id text default null, p_previous text default null
)
returns void
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if coalesce(p_endpoint, '') = '' or p_platform not in ('ios', 'android') then
    return;
  end if;
  insert into push_subscriptions (endpoint, platform, device_id, seen_at)
  values (p_endpoint, p_platform, nullif(p_device_id, ''), now())
  on conflict (endpoint) do update
    set device_id = coalesce(excluded.device_id, push_subscriptions.device_id),
        seen_at = now();
  -- The same phone's earlier addresses (from before a reinstall).
  if coalesce(p_device_id, '') <> '' then
    delete from push_subscriptions where device_id = p_device_id and endpoint <> p_endpoint;
  end if;
  if coalesce(p_previous, '') <> '' and p_previous <> p_endpoint then
    delete from push_subscriptions where endpoint = p_previous;
  end if;
end
$$;
revoke all on function public.push_register_device(text, text, text, text) from public;
grant execute on function public.push_register_device(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
