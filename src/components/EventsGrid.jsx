import { Link } from "react-router-dom";
import { categoryColors } from "../Data/events";
import { getEvents } from "../api";
import useFetch from "../hooks/useFetch";
import { card, pill } from "../utils/design";

// Returns the next occurrence of a given weekday (0=Sun … 6=Sat) on or after today.
function nextWeekday(weekday) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// Returns the Nth (1-based) occurrence of `weekday` in the given month/year.
function nthWeekdayOfMonth(n, weekday, year, month) {
  const d = new Date(year, month, 1);
  const firstOccurrence = (weekday - d.getDay() + 7) % 7;
  d.setDate(1 + firstOccurrence + (n - 1) * 7);
  return d;
}

// Compute the sort-date for an event:
// - one-off events: their iso date
// - recurring (recurringWeekday): next occurrence, respecting nthWeekday if set
function sortDate(e) {
  if (e.iso) return new Date(e.iso);
  if (e.recurringWeekday !== undefined) {
    if (e.nthWeekday) {
      // e.g. { recurringWeekday: 0, nthWeekday: 2 } = 2nd Sunday each month
      const now = new Date();
      const candidate = nthWeekdayOfMonth(e.nthWeekday, e.recurringWeekday, now.getFullYear(), now.getMonth());
      const today = new Date(); today.setHours(0,0,0,0);
      if (candidate >= today) return candidate;
      // next month
      const nm = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
      const ny = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
      return nthWeekdayOfMonth(e.nthWeekday, e.recurringWeekday, ny, nm);
    }
    return nextWeekday(e.recurringWeekday);
  }
  return new Date(8640000000000000); // no date → sort last
}

const today = new Date();
today.setHours(0, 0, 0, 0);

// Only show upcoming events: future one-offs + all recurring events.
function upcomingFrom(events) {
  return events
    .filter(e => e.recurringWeekday !== undefined || !e.iso || new Date(e.iso) >= today)
    .sort((a, b) => sortDate(a) - sortDate(b));
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function EventsGrid() {
  const { data: events } = useFetch(getEvents, []);
  const upcomingEvents = upcomingFrom(events ?? []);
  return (
    <section id="events" className="py-20 md:py-24 px-6 md:px-12" style={{ backgroundColor: "var(--mint)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
              Upcoming Events
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "var(--forest)" }}>
              What's On
            </h2>
          </div>
          <Link
            to="/whats-on"
            className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0"
            style={{ color: "var(--forest)" }}
          >
            View full calendar
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((e) => (
            <Link
              key={e.slug}
              to={`/event/${e.slug}`}
              className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{ borderRadius: card.radius, boxShadow: card.shadow }}
            >
              <div className="relative aspect-[16/10] overflow-hidden" style={{ borderRadius: `${card.radius} ${card.radius} 0 0` }}>
                <img src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span
                  className={pill.className + " absolute top-3 left-3"}
                  style={{ backgroundColor: "rgba(255,255,255,0.95)", color: categoryColors[e.category] || "var(--forest)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }} />
                  {e.category}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h3 className="font-bold text-lg leading-snug" style={{ color: "var(--forest)", fontFamily: "var(--font-heading)" }}>{e.title}</h3>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)", opacity: 0.65 }}>
                  <CalendarIcon />{e.date}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)", opacity: 0.65 }}>
                  <PinIcon />{e.location}
                </div>
                <p className="text-sm leading-relaxed line-clamp-2 mt-0.5" style={{ color: "var(--ink)", opacity: 0.72 }}>
                  {e.excerpt}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-2" style={{ color: "var(--forest)" }}>
                  Read more <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View all — primary pill button */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/see-do"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
            style={{ backgroundColor: "var(--forest)" }}
          >
            View All Events <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
