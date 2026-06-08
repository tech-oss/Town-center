import { useState, useRef } from "react";
import { eventsGrid } from "../Data/content";

const tagColors = {
  Market:   { bg: "#D8F3DC", text: "#1B4332" },
  Shopping: { bg: "#D8F3DC", text: "#2D6A4F" },
  Family:   { bg: "#FFF3CD", text: "#856404" },
  Music:    { bg: "#E8D5F5", text: "#5B2C82" },
  Festive:  { bg: "#FFE0E0", text: "#9B1C1C" },
};

// Derive filter tabs from the data
const FILTERS = ["All", ...Array.from(new Set(eventsGrid.events.map((e) => e.tag)))];

function DateBlock({ date }) {
  const [weekday, day, month] = date.split(" ");
  return (
    <div
      className="shrink-0 w-14 rounded-xl flex flex-col items-center justify-center py-2 shadow-lg"
      style={{ backgroundColor: "var(--forest)" }}
    >
      <span className="text-[9px] font-semibold tracking-widest" style={{ color: "var(--sage)" }}>{weekday}</span>
      <span className="text-xl font-bold text-white leading-none my-0.5">{day}</span>
      <span className="text-[9px] font-semibold tracking-widest text-white/70">{month}</span>
    </div>
  );
}

function TagPill({ tag }) {
  const c = tagColors[tag] ?? { bg: "#E5E7EB", text: "#374151" };
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {tag}
    </span>
  );
}

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function EventsGrid() {
  const [filter, setFilter] = useState("All");
  const scrollerRef = useRef(null);

  const events =
    filter === "All" ? eventsGrid.events : eventsGrid.events.filter((e) => e.tag === filter);

  const scrollNext = () => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
  };
  const scrollPrev = () => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: -el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section id="events" className="relative py-20 md:py-24 px-6 md:px-12 overflow-hidden" style={{ backgroundColor: "var(--mint)" }}>
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--leaf)" }}>
              Upcoming Events
            </p>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ color: "var(--forest)" }}>
              {eventsGrid.heading}
            </h2>
          </div>
          <a
            href={eventsGrid.cta.href}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap mt-2 shrink-0"
            style={{ color: "var(--forest)" }}
          >
            <span className="hidden sm:inline">View full calendar</span>
            <span className="sm:hidden">Calendar</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 mb-8 -mx-1 px-1 scrollbar-none">
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={
                  active
                    ? { backgroundColor: "var(--forest)", color: "#fff" }
                    : { backgroundColor: "#fff", color: "var(--forest)" }
                }
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* ═══════════ DESKTOP: horizontal carousel ═══════════ */}
        <div className="hidden md:block relative">
          <div
            ref={scrollerRef}
            className="flex gap-5 overflow-x-auto pb-2 scroll-smooth snap-x scrollbar-none"
          >
            {events.map((event) => (
              <a
                key={event.id}
                href={event.href}
                className="group shrink-0 w-[280px] snap-start bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{ boxShadow: "0 6px 24px -12px rgba(28,46,56,0.3)" }}
              >
                {/* Image + date block */}
                <div className="relative h-44 overflow-hidden">
                  <img src={event.image} alt={event.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(28,46,56,0.25), transparent 40%)" }} />
                  <div className="absolute top-3 left-3">
                    <DateBlock date={event.date} />
                  </div>
                </div>
                {/* Body */}
                <div className="flex flex-col gap-2 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--ink)", opacity: 0.55 }}>{event.time}</span>
                    <TagPill tag={event.tag} />
                  </div>
                  <h3 className="font-bold text-base leading-snug" style={{ color: "var(--forest)", fontFamily: "var(--font-heading)" }}>
                    {event.title}
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink)", opacity: 0.55 }}>
                    <PinIcon /> {event.location}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* Carousel arrows */}
          {events.length > 3 && (
            <>
              <button
                onClick={scrollPrev}
                aria-label="Previous events"
                className="absolute -left-4 top-[88px] w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-lg transition-transform hover:scale-105"
                style={{ color: "var(--forest)" }}
              >
                ‹
              </button>
              <button
                onClick={scrollNext}
                aria-label="More events"
                className="absolute -right-4 top-[88px] w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center text-lg transition-transform hover:scale-105"
                style={{ color: "var(--forest)" }}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* ═══════════ MOBILE: vertical list of horizontal cards ═══════════ */}
        <div className="md:hidden flex flex-col gap-4">
          {events.map((event) => (
            <a
              key={event.id}
              href={event.href}
              className="flex bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] transition-transform"
            >
              {/* Image + date block */}
              <div className="relative w-28 shrink-0 self-stretch overflow-hidden">
                <img src={event.image} alt={event.title} loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "rgba(28,46,56,0.12)" }} />
                <div className="absolute top-2 left-2">
                  <DateBlock date={event.date} />
                </div>
              </div>
              {/* Content */}
              <div className="flex items-center flex-1 min-w-0 p-4 gap-2">
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: "var(--ink)", opacity: 0.55 }}>{event.time}</span>
                    <TagPill tag={event.tag} />
                  </div>
                  <h3 className="font-bold text-sm leading-snug" style={{ color: "var(--forest)", fontFamily: "var(--font-heading)" }}>
                    {event.title}
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink)", opacity: 0.55 }}>
                    <PinIcon /> {event.location}
                  </p>
                </div>
                <span className="shrink-0 text-xl" style={{ color: "var(--forest)", opacity: 0.4 }}>›</span>
              </div>
            </a>
          ))}
        </div>

        {/* Empty state */}
        {events.length === 0 && (
          <p className="text-center py-10 text-sm" style={{ color: "var(--forest)", opacity: 0.6 }}>
            No events in this category right now — check back soon.
          </p>
        )}
      </div>
    </section>
  );
}
