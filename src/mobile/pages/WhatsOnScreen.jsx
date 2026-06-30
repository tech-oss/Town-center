import { useState, useMemo } from "react";
import MobileCard from "../components/MobileCard";
import { events, eventFilters } from "../data/mobileMock";

export default function WhatsOnScreen() {
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(
    () => (filter === "All" ? events : events.filter((e) => e.category === filter)),
    [filter]
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold mb-1.5" style={{ color: "#fff" }}>What's On</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
          Find events and activities happening in Maidenhead.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
        {eventFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
            style={
              filter === f
                ? { backgroundColor: "var(--sage)", color: "var(--forest)" }
                : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "rgba(255,255,255,0.5)" }}>No events in this category yet.</p>
        ) : (
          filtered.map((e) => (
            <MobileCard key={e.id} className="flex items-center gap-3.5 p-3.5">
              <div
                className="shrink-0 w-13 h-13 rounded-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: "rgba(82,199,182,0.12)", width: 52, height: 52 }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{e.month}</span>
                <span className="text-lg font-bold leading-none" style={{ color: "var(--forest)" }}>{e.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--forest)" }}>{e.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.6)" }}>{e.time}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(26,26,26,0.45)" }}>{e.location}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,26,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </MobileCard>
          ))
        )}
      </div>
    </div>
  );
}
