import { Link } from "react-router-dom";
import { events, categoryColors } from "../Data/events";

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {events.map((e) => (
            <Link
              key={e.slug}
              to={`/event/${e.slug}`}
              className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
              style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "var(--forest)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColors[e.category] || "var(--leaf)" }} />
                  {e.category}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-6">
                <h3 className="font-bold text-xl leading-snug" style={{ color: "var(--forest)" }}>{e.title}</h3>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)", opacity: 0.7 }}>
                  <span style={{ color: "var(--forest)" }}><CalendarIcon /></span>
                  {e.date}
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)", opacity: 0.7 }}>
                  <span style={{ color: "var(--forest)" }}><PinIcon /></span>
                  {e.location}
                </div>
                <p className="text-sm leading-relaxed line-clamp-2 mt-0.5" style={{ color: "var(--ink)", opacity: 0.72 }}>
                  {e.excerpt}
                </p>
                <span
                  className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white w-max transition-colors"
                  style={{ backgroundColor: "var(--forest)" }}
                >
                  Read more
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View all events */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/see-do"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{ backgroundColor: "var(--forest)" }}
          >
            View All Events
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
