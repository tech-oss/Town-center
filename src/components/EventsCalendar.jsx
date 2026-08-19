import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { categoryColors } from "../Data/events";
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

function CalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
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

// Chronological events list for What's On — a date range search over a flat
// list of upcoming events (no month-grid calendar).
export default function EventsCalendar() {
  const { data: events } = useFetch(getEvents, []);
  const allEvents = events ?? [];

  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [appliedRange, setAppliedRange] = useState(null); // { start, end } | null

  const eventsList = useMemo(() => generateOccurrences(allEvents, appliedRange).slice(0, 50), [allEvents, appliedRange]);

  const applyDateRange = () => {
    if (!rangeStart) return;
    setAppliedRange({ start: new Date(`${rangeStart}T00:00:00`), end: rangeEnd ? new Date(`${rangeEnd}T00:00:00`) : null });
    setRangeOpen(false);
  };

  const clearDateRange = () => {
    setRangeStart("");
    setRangeEnd("");
    setAppliedRange(null);
    setRangeOpen(false);
  };

  const rangeButtonLabel = appliedRange
    ? rangeEnd && rangeEnd !== rangeStart
      ? `${formatUkShort(rangeStart)} – ${formatUkShort(rangeEnd)}`
      : formatUkShort(rangeStart)
    : "Select a date range";

  const listHeading = appliedRange
    ? eventsList.length > 0
      ? `Events from ${rangeButtonLabel}`
      : `No events found from ${rangeButtonLabel}`
    : "Upcoming Events";

  return (
    <div>
      {/* Date range control — the only filter on this page. Plain (no
          bar background), centered, with a short label above it. */}
      <div className="relative flex flex-col items-center gap-2 mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--leaf)" }}>
          Browse events by date
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRangeOpen((o) => !o)}
            className="flex items-center justify-center gap-2 text-sm font-bold rounded-full px-5 py-2.5 border-2 cursor-pointer transition-colors hover:bg-black/[0.03]"
            style={{ borderColor: "rgba(28,46,56,0.2)", color: "#000000" }}
          >
            <CalendarIcon />
            <span className="truncate">{rangeButtonLabel}</span>
          </button>
          {appliedRange && (
            <button type="button" onClick={clearDateRange} className="text-xs font-semibold underline shrink-0" style={{ color: "#000000" }}>
              Clear
            </button>
          )}
        </div>

        {rangeOpen && (
          <div className="absolute z-20 top-full mt-2 left-1/2 -translate-x-1/2 w-72 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-3" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
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
      </div>

      {/* Events list — chronological upcoming events, or the applied date
          range's results. Every card carries the event's own photo. */}
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
