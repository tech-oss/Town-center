import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { categoryColors } from "../Data/events";
import { getEvents } from "../api";
import useFetch from "../hooks/useFetch";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n) => String(n).padStart(2, "0");

function eventsForDay(events, y, m, day) {
  const d = new Date(y, m, day);
  const iso = `${y}-${pad(m + 1)}-${pad(day)}`;
  return events.filter(
    (e) => e.iso === iso || (e.recurringWeekday != null && e.recurringWeekday === d.getDay())
  );
}

// Day-detail sheet — used on mobile where a calendar cell is too small to
// give each event its own accurately-tappable dot. Tapping the whole cell
// opens this instead, with full-width rows sized for a thumb.
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
          {events.map((e) => (
            <Link
              key={e.slug}
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
  const navigate = useNavigate();
  const { data: events } = useFetch(getEvents, []);
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [dayModal, setDayModal] = useState(null); // { day, events } | null
  const [pickedDate, setPickedDate] = useState(""); // "YYYY-MM-DD" from the date picker

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

  const monthEvents = useMemo(() => {
    const list = [];
    if (!events) return list;
    for (let d = 1; d <= daysInMonth; d++) {
      eventsForDay(events, y, m, d).forEach((e) => list.push({ day: d, e }));
    }
    return list;
  }, [events, y, m, daysInMonth]);

  // Dated events (recurring-weekday events have no fixed date to sort by),
  // sorted chronologically, for the date-picker search below.
  const searchResults = useMemo(() => {
    if (!pickedDate || !events) return null;
    const target = new Date(`${pickedDate}T00:00:00`);
    return events
      .filter((e) => e.iso)
      .map((e) => ({ e, date: new Date(`${e.iso}T00:00:00`) }))
      .filter(({ date }) => date >= target)
      .sort((a, b) => a.date - b.date)
      .slice(0, 25);
  }, [pickedDate, events]);

  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  const isToday = (d) => d && today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const isPicked = (d) => d && pickedDate === `${y}-${pad(m + 1)}-${pad(d)}`;

  const onPickDate = (value) => {
    setPickedDate(value);
    if (value) {
      const [py, pm] = value.split("-").map(Number);
      setView({ y: py, m: pm - 1 });
    }
  };

  const clearPickedDate = () => setPickedDate("");

  return (
    <div>
      {/* Date search — jump straight to a date and see events from then on,
          instead of paging through months one at a time. */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl p-3 px-4" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.28)" }}>
        <label htmlFor="events-date-search" className="text-xs font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>
          Search by date
        </label>
        <input
          id="events-date-search"
          type="date"
          value={pickedDate}
          onChange={(e) => onPickDate(e.target.value)}
          className="text-sm rounded-lg px-3 py-2 outline-none border"
          style={{ borderColor: "rgba(28,46,56,0.15)", color: "#000000" }}
        />
        {pickedDate && (
          <button
            type="button"
            onClick={clearPickedDate}
            className="text-xs font-semibold underline"
            style={{ color: "#000000" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} aria-label="Previous month" className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg" style={{ color: "#000000" }}>‹</button>
        <h3 className="text-2xl md:text-3xl font-bold" style={{ color: "#000000" }}>{MONTHS[m]} {y}</h3>
        <button onClick={nextMonth} aria-label="Next month" className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg" style={{ color: "#000000" }}>›</button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-3xl p-3 md:p-5" style={{ boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[10px] md:text-xs font-bold uppercase tracking-[0.02em] py-2" style={{ color: "var(--leaf)" }}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {cells.map((d, i) => {
            const dayEvents = d ? eventsForDay(events ?? [], y, m, d) : [];
            return (
              <div
                key={i}
                className="relative min-h-[58px] md:min-h-[96px] rounded-xl p-1.5 md:p-2 flex flex-col gap-1"
                style={{
                  backgroundColor: d ? "var(--sand)" : "transparent",
                  outline: isToday(d) ? "2px solid var(--leaf)" : isPicked(d) ? "2px solid var(--sage)" : "none",
                }}
              >
                {d && <span className="relative z-10 text-[11px] md:text-sm font-semibold" style={{ color: "#000000" }}>{d}</span>}

                {/* Desktop / larger screens — each event is its own button,
                    plenty of room for an accurate mouse click. */}
                <div className="hidden md:flex md:flex-col gap-1 overflow-hidden relative z-10">
                  {dayEvents.map((e) => (
                    <button
                      key={e.slug}
                      onClick={() => navigate(`/event/${e.slug}`)}
                      title={e.title}
                      className="text-left rounded-md px-1.5 py-1 text-[11px] font-semibold leading-tight truncate transition-opacity hover:opacity-80"
                      style={{ backgroundColor: (categoryColors[e.category] || "#2F8C8C") + "22", color: categoryColors[e.category] || "var(--forest)" }}
                    >
                      {e.title}
                    </button>
                  ))}
                </div>

                {/* Mobile — a single compact indicator (dot, or a count
                    badge when there's more than one event) rather than one
                    dot per event, plus a full-cell tap target so a thumb
                    doesn't need to land on the tiny indicator itself. */}
                {d && dayEvents.length > 0 && (
                  <>
                    <div className="md:hidden mt-auto relative z-10 pointer-events-none">
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
                      className="md:hidden absolute inset-0 rounded-xl"
                      aria-label={`View ${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""} on ${MONTHS[m]} ${d}`}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Events list — either the picked date's chronological search
          results, or the current month's events grouped as before. */}
      {searchResults ? (
        <>
          <h3 className="text-xl font-bold mt-12 mb-5" style={{ color: "#000000" }}>
            {searchResults.length > 0 ? `Events from ${pickedDate}` : `No upcoming events found from ${pickedDate}`}
          </h3>
          <div className="flex flex-col gap-3">
            {searchResults.map(({ e, date }) => (
              <Link
                key={e.slug}
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
        </>
      ) : (
        <>
          <h3 className="text-xl font-bold mt-12 mb-5" style={{ color: "#000000" }}>
            {monthEvents.length > 0 ? `Events in ${MONTHS[m]}` : `No events listed in ${MONTHS[m]}`}
          </h3>
          <div className="flex flex-col gap-3">
            {monthEvents.map(({ day, e }) => (
              <Link
                key={`${day}-${e.slug}`}
                to={`/event/${e.slug}`}
                className="group flex items-center gap-4 bg-white rounded-2xl p-3 pr-5 transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.28)" }}
              >
                <div className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: "var(--forest)" }}>
                  <span className="text-[9px] font-semibold uppercase" style={{ color: "var(--sage)" }}>{MONTHS[m].slice(0, 3)}</span>
                  <span className="text-lg font-bold text-white leading-none">{day}</span>
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
        </>
      )}

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
