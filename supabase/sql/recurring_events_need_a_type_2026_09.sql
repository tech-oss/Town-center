-- ═══════════════════════════════════════════════════════════════════════════
-- A recurring event must say how it recurs.
--
-- A business set an event to repeat every Sunday. It went live and showed on
-- one day only. Two things were wrong, and this file fixes the data half.
--
-- The row said is_recurring = true and recurrence_days = ['Sunday'], but
-- recurrence_type was NULL. Nothing can expand a rule with no type:
-- expandRecurrence matches on 'weekly' / 'biweekly' / 'monthly_by_weekday'
-- and returns nothing for anything else, and generateOccurrences bails out
-- of writing occurrence rows at `if (!rule.type)`. So the event kept only its
-- single event_date.
--
-- It got that way through the dashboard's "Repeats" dropdown. An event
-- created before recurrence existed loads with recurrenceType null, and a
-- <select> with a null value still *displays* its first option — "Weekly".
-- So the business saw Weekly, ticked Sunday, saved, and stored a rule with no
-- type, with nothing on screen to say otherwise. The dropdown and the save
-- both default it now, but that only helps rows written from here on.
--
-- Repairing the existing rows: 'weekly' is the only honest reading of
-- is_recurring with weekdays picked and no type — it is what the dropdown was
-- showing the business at the time, and what "every Sunday" means. Rows with
-- no weekdays at all are left alone; there is nothing to infer from them.
--
-- The constraint then stops the pair ever disagreeing again, from this
-- dashboard, the admin editor, or anything else that reaches the table.
--
-- Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Repair rules that never had a type ─────────────────────────────────

update public.business_events
set recurrence_type = 'weekly'
where is_recurring
  and recurrence_type is null
  and coalesce(array_length(recurrence_days, 1), 0) > 0;

-- Anything still recurring with nothing to recur on was never a working rule.
-- Turn it off rather than leave it half-set: the event keeps its own date and
-- shows as a one-off, which is what it has been doing anyway.
update public.business_events
set is_recurring = false
where is_recurring
  and recurrence_type is null;


-- ── 2. Keep the two in step ───────────────────────────────────────────────

alter table public.business_events
  drop constraint if exists business_events_recurrence_type_check;

alter table public.business_events
  add constraint business_events_recurrence_type_check
  check (
    not is_recurring
    or recurrence_type in ('weekly', 'biweekly', 'monthly_by_weekday')
  );

-- Added without `not valid`, so every existing row is checked as the
-- constraint is created. If this statement succeeds, nothing is grandfathered.


notify pgrst, 'reload schema';

-- Every recurring event and the rule it now carries. Each one should have a
-- type and at least one weekday.
select title,
       status,
       event_date,
       recurrence_type,
       recurrence_days,
       recurrence_ordinals,
       recurrence_end_date
from public.business_events
where is_recurring
order by event_date;
