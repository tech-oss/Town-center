import { Link } from "react-router-dom";
import { useEffect } from "react";
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

export default function EventsListPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 md:py-28 overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)" }} />
        <span className="relative text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--sage)" }}>What's On</span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-4 text-white">All Events</h1>
        <p className="relative text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--mint)" }}>
          Every event happening across Maidenhead — markets, music, festivals and family days out.
        </p>
        <Link to="/whats-on" className="relative mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-colors" style={{ backgroundColor: "var(--leaf)", color: "white" }}>
          View calendar →
        </Link>
      </section>

      {/* List */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <nav className="mb-10 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>All Events</span>
          </nav>

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
                    <span style={{ color: "var(--forest)" }}><CalendarIcon /></span>{e.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)", opacity: 0.7 }}>
                    <span style={{ color: "var(--forest)" }}><PinIcon /></span>{e.location}
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-2 mt-0.5" style={{ color: "var(--ink)", opacity: 0.72 }}>{e.excerpt}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--leaf)" }}>
                    Read more <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
