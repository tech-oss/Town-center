import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { categories, categoryColors } from "../Data/events";
import { getEvents } from "../api";
import useFetch from "../hooks/useFetch";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
  { key: "upcoming", label: "Coming Up" },
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

// `dateRange`, when given, excludes the day entirely if it falls outside
// the range — otherwise a recurring event would show on every matching
// weekday of the month regardless of the selected range.
function eventsForDay(events, y, m, day, dateRange) {
  const d = new Date(y, m, day);
  if (dateRange) {
    if (d < dateRange.start) return [];
    if (dateRange.end && d > dateRange.end) return [];
  }
  return events.filter((e) => eventOccursOnDate(e, d));
}

// Expands events (including recurring ones) into concrete dated occurrences
// within the given range, for the flat chronological list — a bounded range
// enumerates day-by-day; an unbounded "Coming Up" range is capped to a
// six-month lookahead so recurring events still surface without scanning
// forever.
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
  if (quickFilter === "upcoming") {
    const dayIdx = (today0.getDay() + 6) % 7;
    const start = new Date(today0);
    start.setDate(start.getDate() + (7 - dayIdx)); // next Monday
    return { start, end: null };
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

// Day-detail card — a calendar cell is too small to give each event its
// own accurately-clickable/tappable dot, on any device. Clicking or
// tapping the whole cell opens this instead, listing that day's events.
function DayEventsModal({ day, monthLabel, year, events, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ backgroundColor: "rgba(15,28,35,0.55)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5"
          style={{ color: "#000000" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h3 className="text-lg font-bold mb-4 pr-8" style={{ color: "#000000" }}>
          {monthLabel} {day}, {year}
        </h3>

        <div className="flex flex-col gap-3">
          {events.map((e, i) => (
            <Link
              key={`${e.slug}-${i}`}
              to={`/event/${e.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ backgroundColor: "var(--sand)" }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug truncate" style={{ color: "#000000" }}>{e.title}</p>
                {e.location && <p className="text-xs truncate" style={{ color: "#000000" }}>{e.location}</p>}
              </div>
              <span className="shrink-0 text-lg" style={{ color: "#000000" }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable interactive month calendar (used on the See & Do hub and /whats-on).
export default function EventsCalendar() {
  const { data: events } = useFetch(getEvents, []);
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [dayModal, setDayModal] = useState(null); // { day, events } | null

  const [quickFilter, setQuickFilter] = useState("all"); // all | today | tomorrow | week | upcoming | range
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(() => new Set()); // empty = all categories
  const [typesOpen, setTypesOpen] = useState(false);

  const { y, m } = view;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Monday = 0

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [startWeekday, daysInMonth]);

  const dateRange = useMemo(() => resolveDateRange(quickFilter, rangeStart, rangeEnd), [quickFilter, rangeStart, rangeEnd]);

  // Category filter only — the date/range restriction is applied per-day
  // below (via eventsForDay) rather than baked into this list, so a
  // recurring event is only counted on the specific days its range covers.
  const categoryFilteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => categoryFilter.size === 0 || categoryFilter.has(e.category));
  }, [events, categoryFilter]);

  // The flat chronological list (needed for quick/date-range filters, which
  // span beyond the currently browsed month) only carries dated events —
  // recurring-weekday events have no fixed date to sort by. When just a
  // category is selected, stay on the per-month grouping instead, which
  // already handles recurring events correctly via eventsForDay.
  const useFlatList = quickFilter !== "all";

  const monthEvents = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      eventsForDay(categoryFilteredEvents, y, m, d, dateRange).forEach((e) => list.push({ day: d, e }));
    }
    return list;
  }, [categoryFilteredEvents, y, m, daysInMonth, dateRange]);

  // Flat chronological list for the filtered view — only dated events have
  // a fixed date to sort/display by (recurring-weekday events still show up
  // on the calendar grid itself).
  const filteredList = useMemo(() => {
    if (!useFlatList) return [];
    return generateOccurrences(categoryFilteredEvents, dateRange).slice(0, 50);
  }, [categoryFilteredEvents, dateRange, useFlatList]);

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  const isToday = (d) => d && today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  const jumpTo = (date) => setView({ y: date.getFullYear(), m: date.getMonth() });

  const onQuickFilter = (key) => {
    setQuickFilter(key);
    setRangeOpen(false);
    if (key !== "range") {
      setRangeStart("");
      setRangeEnd("");
    }
    if (key === "today" || key === "tomorrow") {
      const range = resolveDateRange(key, "", "");
      jumpTo(range.start);
    } else if (key === "week" || key === "upcoming") {
      jumpTo(today);
    }
  };

  const applyDateRange = () => {
    if (!rangeStart) return;
    setQuickFilter("range");
    jumpTo(new Date(`${rangeStart}T00:00:00`));
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

  const listHeading = () => {
    if (!useFlatList) return monthEvents.length > 0 ? `Events in ${MONTHS[m]}` : `No events listed in ${MONTHS[m]}`;
    const labels = { today: "Today", tomorrow: "Tomorrow", week: "This Week", upcoming: "Coming Up", range: "Selected Dates" };
    const base = labels[quickFilter] || "Filtered Events";
    return filteredList.length > 0 ? base : `No events found`;
  };

  return (
    <div>
      {/* Filter bar — quick date ranges, a custom date range, and event
          type filtering. Drives both the calendar grid below and the list. */}
      <div className="relative rounded-2xl p-3 md:p-4 mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 md:gap-x-8" style={{ backgroundColor: "var(--sage)" }}>
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onQuickFilter(f.key)}
            className="text-sm md:text-base font-bold text-white transition-opacity cursor-pointer"
            style={{
              opacity: quickFilter === f.key ? 1 : 0.8,
              textDecoration: quickFilter === f.key ? "underline" : "none",
              textUnderlineOffset: "6px",
            }}
          >
            {f.label}
          </button>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setRangeOpen((o) => !o);
              setTypesOpen(false);
            }}
            className="flex items-center gap-2 text-sm font-bold text-white rounded-full px-4 py-2 border-2 cursor-pointer transition-colors hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.75)" }}
          >
            {rangeButtonLabel} <CalendarIcon />
          </button>
          {rangeOpen && (
            <div className="absolute z-20 top-full mt-2 left-0 bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-3 w-64" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
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

        <div className="relative md:ml-auto">
          <button
            type="button"
            onClick={() => {
              setTypesOpen((o) => !o);
              setRangeOpen(false);
            }}
            className="flex items-center gap-2 text-sm font-bold text-white rounded-full pl-5 pr-4 py-2.5 cursor-pointer transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--leaf)" }}
          >
            Event types{categoryFilter.size > 0 ? ` (${categoryFilter.size})` : ""} <ChevronIcon />
          </button>
          {typesOpen && (
            <div className="absolute z-20 top-full mt-2 right-0 bg-white rounded-2xl p-2 shadow-xl w-60 flex flex-col gap-0.5" style={{ boxShadow: "0 12px 40px -12px rgba(28,46,56,0.4)" }}>
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
      </div>

      {/* Calendar — kept compact and centered on desktop, where a
          full-bleed grid otherwise reads as oversized; full-width on
          mobile. Same day-selection experience at every size: a compact
          dot/count indicator, tapping or clicking the cell opens the same
          event-list card. */}
      <div className="md:max-w-md md:mx-auto">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <button onClick={prevMonth} aria-label="Previous month" className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-white shadow flex items-center justify-center text-lg" style={{ color: "#000000" }}>‹</button>
          <h3 className="text-xl md:text-lg font-bold" style={{ color: "#000000" }}>{MONTHS[m]} {y}</h3>
          <button onClick={nextMonth} aria-label="Next month" className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-white shadow flex items-center justify-center text-lg" style={{ color: "#000000" }}>›</button>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-3xl p-3 md:p-3" style={{ boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[10px] font-bold uppercase tracking-[0.02em] py-1.5" style={{ color: "var(--leaf)" }}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const dayEvents = d ? eventsForDay(categoryFilteredEvents, y, m, d, dateRange) : [];
              return (
                <div
                  key={i}
                  className="relative min-h-[52px] rounded-lg p-1 flex flex-col gap-0.5"
                  style={{
                    backgroundColor: d ? "var(--sand)" : "transparent",
                    outline: isToday(d) ? "2px solid var(--leaf)" : "none",
                  }}
                >
                  {d && <span className="relative z-10 text-[11px] font-semibold" style={{ color: "#000000" }}>{d}</span>}

                  {/* A single compact indicator (dot, or a count badge when
                      there's more than one event) rather than one dot per
                      event, plus a full-cell tap target — so selecting a
                      day doesn't require landing on the tiny indicator
                      itself, on mouse or on touch. */}
                  {d && dayEvents.length > 0 && (
                    <>
                      <div className="mt-auto relative z-10 pointer-events-none">
                        {dayEvents.length === 1 ? (
                          <span
                            className="block w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColors[dayEvents[0].category] || "var(--forest)" }}
                          />
                        ) : (
                          <span
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white leading-none"
                            style={{ backgroundColor: "var(--leaf)" }}
                          >
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDayModal({ day: d, events: dayEvents })}
                        className="absolute inset-0 rounded-lg cursor-pointer"
                        aria-label={`View ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} on ${MONTHS[m]} ${d}`}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events list — the active filter's chronological results, or the
          current month's events grouped as before when nothing is filtered. */}
      <h3 className="text-xl font-bold mt-12 mb-5" style={{ color: "#000000" }}>
        {listHeading()}
      </h3>
      <div className="flex flex-col gap-3">
        {(useFlatList ? filteredList : monthEvents.map(({ day, e }) => ({ e, date: new Date(y, m, day) }))).map(({ e, date }) => (
          <Link
            key={`${e.slug}-${toIso(date)}`}
            to={`/event/${e.slug}`}
            className="group flex items-center gap-4 bg-white rounded-2xl p-3 pr-5 transition-transform hover:-translate-y-0.5"
            style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.28)" }}
          >
            <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: "var(--forest)" }}>
              <span className="text-[9px] font-semibold uppercase" style={{ color: "var(--sage)" }}>{MONTHS[date.getMonth()].slice(0, 3)}</span>
              <span className="text-lg font-bold text-white leading-none">{date.getDate()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }} />
                <span className="text-[11px] font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{e.category}</span>
              </div>
              <p className="font-bold leading-snug truncate" style={{ color: "#000000" }}>{e.title}</p>
              <p className="text-sm truncate" style={{ color: "#000000" }}>{e.location}</p>
            </div>
            <span className="shrink-0 text-xl transition-transform group-hover:translate-x-1" style={{ color: "#000000" }}>→</span>
          </Link>
        ))}
      </div>

      {dayModal && (
        <DayEventsModal
          day={dayModal.day}
          monthLabel={MONTHS[m]}
          year={y}
          events={dayModal.events}
          onClose={() => setDayModal(null)}
        />
      )}
    </div>
  );
}
