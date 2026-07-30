import { Link } from "react-router-dom";
import { getEvents } from "../api";
import useFetch from "../hooks/useFetch";
import useTapReveal from "../hooks/useTapReveal";

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

// ── One event card — image + caption (title left / excerpt right), matching
// the "Featured Stories" / "In the Spotlight" 4:3 portfolio treatment: sharp
// foreground photo that insets on hover to reveal a blurred, dimmed frame. On
// touch devices the image itself doesn't navigate — a tap only toggles that
// reveal; "Read more" is the actual link on mobile.
function EventCard({ event }) {
  const { revealed, onImageClick } = useTapReveal();
  const to = `/event/${event.slug}`;
  return (
    <div className="md:col-span-4">
      <Link
        to={to}
        onClick={onImageClick}
        className={`spotlight-card group block ${revealed ? "is-revealed" : ""}`}
      >
        <div
          className="relative w-full overflow-hidden aspect-[4/3]"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          <img
            src={event.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover"
          />
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            className="spotlight-photo absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </Link>

      <div className="mt-4">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.02em] mb-1"
          style={{ color: "var(--leaf)" }}
        >
          {event.category}
        </p>
        <h3
          className="text-base md:text-lg leading-snug mb-2.5"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "#000000" }}
        >
          {event.title}
        </h3>

        {/* Date / time / location — matching the reference's detail rows */}
        <div className="flex flex-col gap-1.5 mb-2.5">
          {event.date && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#000000" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
              <span>{event.date}</span>
            </div>
          )}
          {event.time && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#000000" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
              <span>{event.time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#000000" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.3" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "#000000" }}>
          {event.excerpt}
        </p>
      </div>

      {/* Read more — the reliable link on every device, including mobile
          where the image itself no longer navigates */}
      <Link
        to={to}
        className="group/more inline-flex items-center gap-1.5 text-sm font-semibold mt-3"
        style={{ color: "#000000" }}
      >
        Read more
        <span className="transition-transform duration-200 group-hover/more:translate-x-1">→</span>
      </Link>
    </div>
  );
}

export default function EventsGrid() {
  const { data: events } = useFetch(getEvents, []);
  const upcomingEvents = upcomingFrom(events ?? []).slice(0, 3);
  return (
    <section id="events" className="py-20 md:py-24 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-2" style={{ color: "var(--leaf)" }}>
              Upcoming Events
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "#000000" }}>
              What's On
            </h2>
          </div>
          <Link
            to="/whats-on"
            className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap shrink-0"
            style={{ color: "#000000" }}
          >
            View full calendar
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>
        </div>
        <div className="mb-10 -mt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.14)" }} />

        {/* Cards — same side-by-side portfolio treatment as Featured Stories,
            three per row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-12">
          {upcomingEvents.map((e) => (
            <EventCard key={e.slug} event={e} />
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
