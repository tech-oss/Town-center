import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { categories, categoryColors } from "../Data/events";
import { getEvents } from "../api";
import useFetch from "../hooks/useFetch";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n) => String(n).padStart(2, "0");
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatUkShort = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

const QUICK_FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This Week" },
];

// Whether `e` falls on `date` — for a recurring event with an `nthWeekday`
// (e.g. { recurringWeekday: 0, nthWeekday: 2 } = 2nd Sunday of the month)
// only that specific week counts, not every matching weekday.
function eventOccursOnDate(e, date) {
  if (e.iso) return e.iso === toIso(date);
  if (e.recurringWeekday != null) {
    if (date.getDay() !== e.recurringWeekday) return false;
    if (e.nthWeekday) return Math.floor((date.getDate() - 1) / 7) + 1 === e.nthWeekday;
    return true;
  }
  return false;
}

// Expands events (including recurring ones) into concrete dated occurrences
// within the given range, sorted chronologically — a bounded range
// enumerates day-by-day; an open-ended range (no range applied, or a "from"
// date with no "to" date) is capped to a six-month lookahead so recurring
// events still surface without scanning forever.
function generateOccurrences(events, range) {
  const start = range?.start ?? startOfDay(new Date());
  const cappedEnd =
    range?.end ??
    (() => {
      const d = new Date(start);
      d.setDate(d.getDate() + 180);
      return d;
    })();
  const spanDays = Math.round((cappedEnd - start) / 86400000);
  const results = [];
  for (const e of events) {
    if (e.iso) {
      const d = new Date(`${e.iso}T00:00:00`);
      if (d >= start && d <= cappedEnd) results.push({ e, date: d });
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

// Resolves the active quick-filter / date-range selection into a concrete
// [start, end] day span (end === null means "no upper bound").
function resolveDateRange(quickFilter, rangeStart, rangeEnd) {
  const today0 = startOfDay(new Date());
  if (quickFilter === "today") return { start: today0, end: today0 };
  if (quickFilter === "tomorrow") {
    const t = new Date(today0);
    t.setDate(t.getDate() + 1);
    return { start: t, end: t };
  }
  if (quickFilter === "week") {
    const dayIdx = (today0.getDay() + 6) % 7; // Monday = 0
    const end = new Date(today0);
    end.setDate(end.getDate() + (6 - dayIdx));
    return { start: today0, end };
  }
  if (quickFilter === "range" && rangeStart) {
    return {
      start: new Date(`${rangeStart}T00:00:00`),
      end: rangeEnd ? new Date(`${rangeEnd}T00:00:00`) : null,
    };
  }
  return null; // "all" — no date restriction
}

function CalendarIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function ChevronIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// One event in the results list — a horizontal card (photo, date, details)
// that reads cleanly at any width, so no separate mobile/desktop layouts
// are needed.
function EventCard({ e, date }) {
  return (
    <Link
      to={`/event/${e.slug}`}
      className="group flex items-stretch overflow-hidden bg-white transition-all duration-300 hover:-translate-y-0.5"
      style={{ borderRadius: "16px", boxShadow: "0 6px 24px -16px rgba(28,46,56,0.28)" }}
    >
      <div className="relative w-24 sm:w-36 shrink-0 overflow-hidden" style={{ backgroundColor: "var(--sand)" }}>
        {e.image && (
          <img src={e.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="min-w-0 flex-1 flex items-center gap-3 sm:gap-5 p-3 sm:p-4">
        <div className="shrink-0 w-11 sm:w-14 text-center">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{MONTHS[date.getMonth()].slice(0, 3)}</div>
          <div className="text-xl sm:text-2xl font-bold leading-none" style={{ color: "#000000" }}>{date.getDate()}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{e.category}</span>
          </div>
          <p className="font-bold leading-snug truncate" style={{ color: "#000000" }}>{e.title}</p>
          {e.location && <p className="text-sm truncate" style={{ color: "#000000" }}>{e.location}</p>}
        </div>
        <span className="hidden sm:block shrink-0 text-xl transition-transform group-hover:translate-x-1" style={{ color: "#000000" }}>→</span>
      </div>
    </Link>
  );
}

// Filter bar (quick date ranges, a custom date range, and event type
// filtering) driving a chronological events list for What's On.
export default function EventsCalendar() {
  const { data: events } = useFetch(getEvents, []);
  const allEvents = events ?? [];

  const [quickFilter, setQuickFilter] = useState("all"); // all | today | tomorrow | week | range
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(() => new Set()); // empty = all categories
  const [typesOpen, setTypesOpen] = useState(false);

  const dateRange = useMemo(() => resolveDateRange(quickFilter, rangeStart, rangeEnd), [quickFilter, rangeStart, rangeEnd]);

  const categoryFilteredEvents = useMemo(
    () => allEvents.filter((e) => categoryFilter.size === 0 || categoryFilter.has(e.category)),
    [allEvents, categoryFilter]
  );

  const eventsList = useMemo(() => generateOccurrences(categoryFilteredEvents, dateRange).slice(0, 50), [categoryFilteredEvents, dateRange]);

  const onQuickFilter = (key) => {
    setQuickFilter(key);
    setRangeOpen(false);
    if (key !== "range") {
      setRangeStart("");
      setRangeEnd("");
    }
  };

  const applyDateRange = () => {
    if (!rangeStart) return;
    setQuickFilter("range");
    setRangeOpen(false);
  };

  const clearDateRange = () => {
    setRangeStart("");
    setRangeEnd("");
    if (quickFilter === "range") setQuickFilter("all");
    setRangeOpen(false);
  };

  const toggleCategory = (key) => {
    setCategoryFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rangeButtonLabel =
    quickFilter === "range" && rangeStart
      ? rangeEnd && rangeEnd !== rangeStart
        ? `${formatUkShort(rangeStart)} – ${formatUkShort(rangeEnd)}`
        : formatUkShort(rangeStart)
      : "Date range";

  const listHeading = (() => {
    const labels = { today: "Today", tomorrow: "Tomorrow", week: "This Week", range: "Selected Dates" };
    if (quickFilter === "all") return "Upcoming Events";
    const base = labels[quickFilter] || "Filtered Events";
    return eventsList.length > 0 ? base : "No events found";
  })();

  return (
    <div>
      {/* Filter bar — quick date ranges, a custom date range, and event
          type filtering. Drives the events list below. Both dropdowns
          anchor to this outer bar (not their own trigger button) so on
          narrow phones they always sit fully inside the bar's width
          instead of spilling off the edge of the screen. */}
      <div className="relative rounded-2xl p-3 md:p-4 mb-8 flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-8 md:gap-y-3" style={{ backgroundColor: "var(--sage)" }}>
        {/* Quick filters — equal-width chips on mobile, inline text tabs
            on desktop where there's room to breathe. */}
        <div className="grid grid-cols-4 gap-1.5 md:flex md:items-center md:gap-x-5">
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => onQuickFilter(f.key)}
                className={[
                  "px-2 py-2 rounded-full text-xs font-bold whitespace-nowrap text-center transition-colors cursor-pointer",
                  active ? "bg-white text-[var(--forest)]" : "bg-white/[0.18] text-white",
                  "md:bg-transparent md:px-0 md:py-0 md:rounded-none md:text-base md:text-left md:text-white",
                ].join(" ")}
              >
                <span style={{ textDecoration: active ? "underline" : "none", textUnderlineOffset: "6px" }}>
                  {f.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date range + Event types — equal-width chips on mobile, own
            sized buttons on desktop (Event types pinned to the far right). */}
        <div className="grid grid-cols-2 gap-1.5 md:flex md:items-center md:gap-3 md:ml-auto">
          <button
            type="button"
            onClick={() => {
              setRangeOpen((o) => !o);
              setTypesOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold text-white rounded-full px-3 py-2 md:px-4 border-2 cursor-pointer transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.75)" }}
          >
            <span className="truncate">{rangeButtonLabel}</span> <CalendarIcon />
          </button>

          <button
            type="button"
            onClick={() => {
              setTypesOpen((o) => !o);
              setRangeOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-bold text-white rounded-full pl-3 pr-2.5 md:pl-5 md:pr-4 py-2 md:py-2.5 cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--leaf)" }}
          >
            <span className="truncate">Event types{categoryFilter.size > 0 ? ` (${categoryFilter.size})` : ""}</span> <ChevronIcon />
          </button>
        </div>

        {rangeOpen && (
          <div className="absolute z-20 top-full mt-2 left-3 right-3 md:left-0 md:right-auto md:w-64 bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-3" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
            <label className="text-xs font-semibold flex flex-col gap-1" style={{ color: "#000000" }}>
              From
              <input type="date" lang="en-GB" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }} />
            </label>
            <label className="text-xs font-semibold flex flex-col gap-1" style={{ color: "#000000" }}>
              To
              <input type="date" lang="en-GB" value={rangeEnd} min={rangeStart || undefined} onChange={(e) => setRangeEnd(e.target.value)} className="text-sm rounded-lg px-3 py-2 outline-none border" style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }} />
            </label>
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={applyDateRange} disabled={!rangeStart} className="text-sm font-semibold px-4 py-2 rounded-full text-white disabled:opacity-40" style={{ backgroundColor: "var(--leaf)" }}>
                Apply
              </button>
              {(rangeStart || rangeEnd) && (
                <button type="button" onClick={clearDateRange} className="text-xs font-semibold underline" style={{ color: "#000000" }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {typesOpen && (
          <div className="absolute z-20 top-full mt-2 left-3 right-3 md:left-auto md:right-0 md:w-60 bg-white rounded-2xl p-2 shadow-xl flex flex-col gap-0.5" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
            {Object.entries(categories).map(([key, c]) => (
              <label key={key} className="flex items-center gap-2.5 text-sm px-2.5 py-2 rounded-lg hover:bg-black/5 cursor-pointer" style={{ color: "#000000" }}>
                <input type="checkbox" checked={categoryFilter.has(key)} onChange={() => toggleCategory(key)} className="accent-[var(--leaf)]" />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                {c.label}
              </label>
            ))}
            {categoryFilter.size > 0 && (
              <button type="button" onClick={() => setCategoryFilter(new Set())} className="text-xs font-semibold underline mt-1 mx-2.5 self-start" style={{ color: "#000000" }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Events list — chronological upcoming events, or the active
          filter's results. Every card carries the event's own photo. */}
      <h3 className="text-xl font-bold mb-5" style={{ color: "#000000" }}>
        {listHeading}
      </h3>
      <div className="flex flex-col gap-3">
        {eventsList.map(({ e, date }) => (
          <EventCard key={`${e.slug}-${toIso(date)}`} e={e} date={date} />
        ))}
      </div>
    </div>
  );
}
