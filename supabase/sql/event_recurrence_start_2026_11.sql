-- ═══════════════════════════════════════════════════════════════════════════
-- A repeating event always has a first date.
--
-- The business portal let a repeating event ("every Sunday") be submitted
-- with no first date. The What's On calendar read that missing date and
-- crashed, on the website and in the app, for everyone. The site now copes
-- with it, but the apps already installed run the old code, so the dates
-- are filled in here as well:
--
--   · from now on, a repeating event saved without a first date starts on
--     its event date, else the first date it already had, else today;
--   · the events already saved that way get the day they were created.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.business_events_recurrence_start()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_recurring and new.recurrence_type is not null and new.recurrence_start_date is null then
    new.recurrence_start_date := coalesce(
      new.event_date,
      case when tg_op = 'UPDATE' then old.recurrence_start_date end,
      (now() at time zone 'Europe/London')::date
    );
  end if;
  -- The first date is also the event's date, as the portal and admin save it.
  if new.is_recurring and new.event_date is null then
    new.event_date := new.recurrence_start_date;
  end if;
  return new;
end;
$$;

drop trigger if exists business_events_recurrence_start on public.business_events;
create trigger business_events_recurrence_start
  before insert or update on public.business_events
  for each row execute function public.business_events_recurrence_start();

-- The events already saved without a first date.
with fixed as (
  update public.business_events
     set recurrence_start_date = coalesce(event_date, (created_at at time zone 'Europe/London')::date),
         event_date = coalesce(event_date, (created_at at time zone 'Europe/London')::date)
   where is_recurring
     and recurrence_type is not null
     and (recurrence_start_date is null or event_date is null)
  returning title
)
select count(*) as events_fixed from fixed;
