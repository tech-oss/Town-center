import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import { getEvents } from "../../api";
import { categories, categoryColors } from "../../Data/events";

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
  const [typesOpen, setTypesOpen] = useState(false);

  const dateRange = useMemo(() => resolveDateRange(quickFilter), [quickFilter]);
  const categoryFiltered = useMemo(
    () => (events ?? []).filter((e) => categoryFilter.size === 0 || categoryFilter.has(e.category)),
    [events, categoryFilter]
  );
  const listed = useMemo(() => generateOccurrences(categoryFiltered, dateRange).slice(0, 40), [categoryFiltered, dateRange]);

  const toggleCategory = (key) => {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const listHeading = quickFilter === "all"
    ? "Upcoming Events"
    : { today: "Today", tomorrow: "Tomorrow", week: "This Week" }[quickFilter];

  return (
    <MobileShell>
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
        <div className="relative z-30">
          <button
            onClick={() => setTypesOpen((o) => !o)}
            className="flex items-center justify-center gap-1.5 text-xs font-bold rounded-full px-4 py-2"
            style={{ backgroundColor: "rgba(28,46,56,0.06)", color: "rgba(0,0,0,0.75)" }}
          >
            Event types{categoryFilter.size > 0 ? ` (${categoryFilter.size})` : ""}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>

          {typesOpen && (
            <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-white rounded-2xl p-2 flex flex-col gap-0.5" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
              {Object.entries(categories).map(([key, c]) => (
                <label key={key} className="flex items-center gap-2.5 text-sm px-2.5 py-2.5 rounded-lg active:bg-black/5" style={{ color: "#000000" }}>
                  <input type="checkbox" checked={categoryFilter.has(key)} onChange={() => toggleCategory(key)} className="accent-[var(--leaf)]" />
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  {c.label}
                </label>
              ))}
              {categoryFilter.size > 0 && (
                <button onClick={() => setCategoryFilter(new Set())} className="text-xs font-semibold underline mt-1 mx-2.5 self-start" style={{ color: "#000000" }}>
                  Clear
                </button>
              )}
            </div>
          )}
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
