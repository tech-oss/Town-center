import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import FilterSheet from "../components/FilterSheet";
import { getEvents } from "../../api";
import { categories, categoryColors } from "../../Data/events";

const RANGE_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatUkShort = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${RANGE_MONTHS[d.getMonth()]}`;
};

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

function resolveDateRange(quickFilter, rangeStart, rangeEnd) {
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
  if (quickFilter === "range" && rangeStart) {
    return {
      start: new Date(`${rangeStart}T00:00:00`),
      end: rangeEnd ? new Date(`${rangeEnd}T00:00:00`) : null,
    };
  }
  return null;
}

// Same bottom-sheet chrome as FilterSheet (title bar, close X, rounded top),
// but with From/To date inputs + Apply/Clear instead of a row list — the
// website's custom date-range picker (EventsCalendar.jsx), ported to the
// app's shared dropdown pattern rather than its own inline popover.
function DateRangeSheet({ start, end, onApply, onClear, active }) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);

  const openSheet = () => {
    setDraftStart(start);
    setDraftEnd(end);
    setOpen(true);
  };

  const label = active && start
    ? end && end !== start ? `${formatUkShort(start)} – ${formatUkShort(end)}` : formatUkShort(start)
    : "Date range";

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-full px-4 py-2.5 truncate"
        style={active ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
        <span className="truncate">{label}</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl pt-5 pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#000000" }}>Date Range</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: "var(--forest)" }}>✕</button>
            </div>

            <div className="px-6 flex flex-col gap-3">
              <label className="text-xs font-semibold flex flex-col gap-1.5" style={{ color: "#000000" }}>
                From
                <input
                  type="date"
                  lang="en-GB"
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                  className="text-sm rounded-xl px-3.5 py-3 outline-none border"
                  style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
                />
              </label>
              <label className="text-xs font-semibold flex flex-col gap-1.5" style={{ color: "#000000" }}>
                To
                <input
                  type="date"
                  lang="en-GB"
                  value={draftEnd}
                  min={draftStart || undefined}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  className="text-sm rounded-xl px-3.5 py-3 outline-none border"
                  style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
                />
              </label>

              <div className="flex items-center gap-3 pt-2">
                {(draftStart || draftEnd) && (
                  <button
                    type="button"
                    onClick={() => { onClear(); setDraftStart(""); setDraftEnd(""); setOpen(false); }}
                    className="text-xs font-semibold underline"
                    style={{ color: "#000000" }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  disabled={!draftStart}
                  onClick={() => { onApply(draftStart, draftEnd); setOpen(false); }}
                  className="flex-1 py-3 rounded-full text-sm font-bold text-white disabled:opacity-40"
                  style={{ backgroundColor: "var(--forest)" }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
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
  const [quickFilter, setQuickFilter] = useState("all"); // all | today | tomorrow | week | range
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(() => new Set());

  const dateRange = useMemo(() => resolveDateRange(quickFilter, rangeStart, rangeEnd), [quickFilter, rangeStart, rangeEnd]);
  const categoryFiltered = useMemo(
    () => (events ?? []).filter((e) => categoryFilter.size === 0 || categoryFilter.has(e.category)),
    [events, categoryFilter]
  );
  const listed = useMemo(() => generateOccurrences(categoryFiltered, dateRange).slice(0, 40), [categoryFiltered, dateRange]);

  const onQuickFilter = (key) => {
    setQuickFilter(key);
    setRangeStart("");
    setRangeEnd("");
  };

  const applyDateRange = (start, end) => {
    setRangeStart(start);
    setRangeEnd(end);
    setQuickFilter("range");
  };

  const clearDateRange = () => {
    setRangeStart("");
    setRangeEnd("");
    setQuickFilter("all");
  };

  const listHeading = (() => {
    const labels = { today: "Today", tomorrow: "Tomorrow", week: "This Week", range: "Selected Dates" };
    if (quickFilter === "all") return "Upcoming Events";
    return labels[quickFilter] ?? "Filtered Events";
  })();

  return (
    <MobileShell title="What's On" onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm" style={{ color: "#000000" }}>Find events and activities happening in Maidenhead.</p>

        {/* Quick date filters */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onQuickFilter(f.key)}
              className="px-2 py-2 rounded-full text-xs font-bold whitespace-nowrap text-center"
              style={quickFilter === f.key
                ? { backgroundColor: "var(--leaf)", color: "#ffffff" }
                : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Date range + Event types */}
        <div className="grid grid-cols-2 gap-2">
          <DateRangeSheet
            start={rangeStart}
            end={rangeEnd}
            active={quickFilter === "range"}
            onApply={applyDateRange}
            onClear={clearDateRange}
          />
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
            <p className="text-sm text-center py-8" style={{ color: "#000000" }}>No events match — try another filter.</p>
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
                      {e.location && <p className="text-xs mt-0.5 truncate" style={{ color: "#000000" }}>{e.location}</p>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 18l6-6-6-6" /></svg>
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
