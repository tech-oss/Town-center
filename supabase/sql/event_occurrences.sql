-- ═══════════════════════════════════════════════════════════════════════════
-- Recurring events: a business_events row becomes the recurring "series"
-- (weekly / biweekly / monthly-by-weekday, e.g. "every Sunday" or "1st and
-- 3rd Sunday"), and business_event_occurrences holds one row per actual
-- calendar date, individually editable/cancellable.
--
-- NOT RUN YET. Read/write side lives in src/business/api/businessEvents.js
-- and src/business/api/eventRecurrence.js (client-side date expansion).
--
-- Every occurrence edit (including a single-occurrence override) must go
-- through admin review before it's visible publicly, same as the existing
-- business_events approval flow — see review_status below.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.business_events
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence_type text check (recurrence_type in ('weekly', 'biweekly', 'monthly_by_weekday')),
  add column if not exists recurrence_days jsonb not null default '[]'::jsonb,       -- e.g. ["Sunday"] — weekly/biweekly can hold multiple, monthly_by_weekday holds exactly one
  add column if not exists recurrence_ordinals jsonb not null default '[]'::jsonb,   -- monthly_by_weekday only — e.g. [1,3] for "1st and 3rd", or [-1] for "last"
  add column if not exists recurrence_start_date date,                              -- first occurrence date (mirrors event_date when recurring)
  add column if not exists recurrence_end_date date;                                -- null = no end

create table public.business_event_occurrences (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.business_events(id) on delete cascade,
  occurrence_date   date not null,
  occurrence_time   text,
  status            text not null default 'Scheduled' check (status in ('Scheduled', 'Cancelled')),
  review_status     text not null default 'Approved' check (review_status in ('Approved', 'Pending Approval', 'Rejected')),
  rejection_reason  text,
  is_modified       boolean not null default false,       -- true once any override below is set (vs. inheriting the series defaults)
  -- per-occurrence overrides — null means "inherit from the parent series"
  override_title       text,
  override_subtitle    text,
  override_description text,
  override_location    text,
  override_lat          double precision,
  override_lng          double precision,
  override_entry_type   text,
  override_website       text,
  override_booking_url   text,
  override_social         jsonb,
  override_gallery         jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (event_id, occurrence_date)
);

create index business_event_occurrences_event_idx
  on public.business_event_occurrences (event_id, occurrence_date);

alter table public.business_event_occurrences enable row level security;

-- Business members manage occurrences of their own events; public reads are
-- limited to approved + scheduled + not-yet-past, same visibility rule the
-- public site already applies to business_events.status = 'Live'.
create policy "business members manage their own occurrences"
  on public.business_event_occurrences for all
  using (
    exists (
      select 1 from public.business_events e
      where e.id = business_event_occurrences.event_id
        and public.is_approved_business_member(e.business_id)
    )
  )
  with check (
    exists (
      select 1 from public.business_events e
      where e.id = business_event_occurrences.event_id
        and public.is_approved_business_member(e.business_id)
    )
  );

create policy "public reads approved upcoming occurrences"
  on public.business_event_occurrences for select
  using (
    status = 'Scheduled'
    and review_status = 'Approved'
    and occurrence_date >= current_date
    and exists (
      select 1 from public.business_events e
      where e.id = business_event_occurrences.event_id
        and e.status = 'Live'
    )
  );
