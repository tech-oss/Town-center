import { Link } from "react-router-dom";
import { useEffect } from "react";
import EventsCalendar from "./EventsCalendar";

export default function EventsCalendarPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)" }} />
        <span className="relative text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--sage)" }}>What's On</span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-4 text-white">Events Calendar</h1>
        <p className="relative text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--mint)" }}>
          Browse what's happening across Maidenhead, month by month. Tap any event to see the details.
        </p>
      </section>

      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <nav className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
              <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
              <span className="mx-2 opacity-40">/</span>
              <span>Calendar</span>
            </nav>
            <Link to="/see-do" className="text-sm font-semibold" style={{ color: "var(--forest)" }}>See &amp; Do →</Link>
          </div>
          <EventsCalendar />
        </div>
      </section>
    </div>
  );
}
