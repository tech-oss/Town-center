import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import FilterSheet from "../components/FilterSheet";
import { getEvents } from "../../api";
import { categories, categoryColors } from "../../Data/events";

const CATEGORY_OPTIONS = Object.entries(categories).map(([key, c]) => ({ key, label: c.label, color: c.color }));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const QUICK_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

// Same occurrence-expansion logic as the website's EventsCalendar — a
// recurring event (e.g. "2nd Sunday of the month") only counts on the
// specific date(s) it actually falls on.
function eventOccursOnDate(e, date) {
  if (e.iso) return e.iso === toIso(date);
  if (e.recurringWeekday != null) {
    if (date.getDay() !== e.recurringWeekday) return false;
    if (e.nthWeekday) return Math.floor((date.getDate() - 1) / 7) + 1 === e.nthWeekday;
    return true;
  }
  return false;
}

function generateOccurrences(events, range) {
  const start = range?.start ?? startOfDay(new Date());
  const end = range?.end ?? (() => { const d = new Date(start); d.setDate(d.getDate() + 180); return d; })();
  const spanDays = Math.round((end - start) / 86400000);
  const results = [];
  for (const e of events) {
    if (e.iso) {
      const d = new Date(`${e.iso}T00:00:00`);
      if (d >= start && d <= end) results.push({ e, date: d });
      continue;
    }
    if (e.recurringWeekday != null) {
      for (let i = 0; i <= spanDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        if (eventOccursOnDate(e, d)) results.push({ e, date: new Date(d) });
      }
    }
  }
  return results.sort((a, b) => a.date - b.date);
}

function resolveDateRange(quickFilter) {
  const today0 = startOfDay(new Date());
  if (quickFilter === "today") return { start: today0, end: today0 };
  if (quickFilter === "tomorrow") {
    const t = new Date(today0);
    t.setDate(t.getDate() + 1);
    return { start: t, end: t };
  }
  if (quickFilter === "week") {
    const dayIdx = (today0.getDay() + 6) % 7;
    const end = new Date(today0);
    end.setDate(end.getDate() + (6 - dayIdx));
    return { start: today0, end };
  }
  return null;
}

function EventImage({ src, alt }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div onClick={onImageClick} className={`spotlight-card relative w-24 h-24 shrink-0 overflow-hidden ${revealed ? "is-revealed" : ""}`}>
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
      <img src={src} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export default function WhatsOnScreen() {
  const { data: events } = useFetch(getEvents, []);
  const [quickFilter, setQuickFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(() => new Set());

  const dateRange = useMemo(() => resolveDateRange(quickFilter), [quickFilter]);
  const categoryFiltered = useMemo(
    () => (events ?? []).filter((e) => categoryFilter.size === 0 || categoryFilter.has(e.category)),
    [events, categoryFilter]
  );
  const listed = useMemo(() => generateOccurrences(categoryFiltered, dateRange).slice(0, 40), [categoryFiltered, dateRange]);

  const listHeading = quickFilter === "all"
    ? "Upcoming Events"
    : { today: "Today", tomorrow: "Tomorrow", week: "This Week" }[quickFilter];

  return (
    <MobileShell onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-5 mobile-stagger">
        <div>
          <h1 className="section-heading text-2xl font-bold mb-1.5" style={{ color: "#000000" }}>What's On</h1>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Find events and activities happening in Maidenhead.</p>
        </div>

        {/* Quick date filters */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setQuickFilter(f.key)}
              className="px-2 py-2 rounded-full text-xs font-bold whitespace-nowrap text-center"
              style={quickFilter === f.key
                ? { backgroundColor: "var(--leaf)", color: "#ffffff" }
                : { backgroundColor: "rgba(28,46,56,0.06)", color: "rgba(0,0,0,0.65)" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event types */}
        <div>
          <FilterSheet
            title="Event Types"
            triggerLabel={`Event types${categoryFilter.size > 0 ? ` (${categoryFilter.size})` : ""}`}
            options={CATEGORY_OPTIONS}
            multi
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>

        <p className="text-sm font-bold" style={{ color: "#000000" }}>{listHeading}</p>

        {/* Event listings */}
        <div className="flex flex-col gap-3">
          {listed.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "rgba(0,0,0,0.4)" }}>No events match — try another filter.</p>
          ) : (
            listed.map(({ e, date }) => (
              <Link key={`${e.slug}-${toIso(date)}`} to={`/mobile/event/${e.slug}`}>
                <div className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                  <EventImage src={e.image} alt={e.title} />
                  <div className="flex-1 min-w-0 p-3 flex items-center gap-3">
                    <div className="shrink-0 w-11 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{MONTHS[date.getMonth()]}</div>
                      <div className="text-xl font-bold leading-none" style={{ color: "#000000" }}>{date.getDate()}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: categoryColors[e.category] ?? "var(--leaf)" }}>{e.category}</span>
                      <p className="text-sm font-bold leading-snug truncate" style={{ color: "#000000" }}>{e.title}</p>
                      {e.location && <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.6)" }}>{e.location}</p>}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
