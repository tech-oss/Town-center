import { Link } from "react-router-dom";
import { useEffect } from "react";
import EventsCalendar from "./EventsCalendar";

export default function EventsCalendarPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      {/* No hero — the page opens directly on the date range bar. */}
      <section className="pt-8 pb-12 md:pt-10 md:pb-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <nav className="text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
              <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
              <span className="mx-2 opacity-40">/</span>
              <span>Calendar</span>
            </nav>
            <Link to="/see-do" className="text-sm font-semibold" style={{ color: "#000000" }}>See &amp; Do →</Link>
          </div>
          <EventsCalendar />
        </div>
      </section>
    </div>
  );
}
