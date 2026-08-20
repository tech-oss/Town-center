import { useState, useMemo } from "react";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import { events, categories } from "../../Data/events";

function EventImage({ src, alt }) {
  const { revealed, onImageClick } = useTapReveal();
  return (
    <div
      onClick={onImageClick}
      className={`spotlight-card relative w-24 h-24 shrink-0 overflow-hidden ${revealed ? "is-revealed" : ""}`}
    >
      <img src={src} alt="" aria-hidden="true" loading="lazy" className="spotlight-photo-bg absolute inset-0 w-full h-full object-cover" />
      <img src={src} alt={alt} loading="lazy" className="spotlight-photo absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export default function WhatsOnScreen() {
  const [filter, setFilter] = useState("All");
  const filters = useMemo(() => ["All", ...Object.keys(categories)], []);
  const listed = useMemo(
    () => (filter === "All" ? events : events.filter((e) => e.category === filter)),
    [filter]
  );

  return (
    <MobileShell>
      <div className="flex flex-col gap-5 mobile-stagger">
        <div>
          <h1 className="section-heading text-2xl font-bold mb-1.5" style={{ color: "#000000" }}>What's On</h1>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>Find events and activities happening in Maidenhead.</p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              style={filter === f
                ? { backgroundColor: "var(--leaf)", color: "#ffffff" }
                : { backgroundColor: "rgba(28,46,56,0.06)", color: "rgba(0,0,0,0.65)" }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Event listings */}
        <div className="flex flex-col gap-3">
          {listed.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "rgba(0,0,0,0.4)" }}>No events in this category right now.</p>
          ) : (
            listed.map((e) => (
              <a key={e.slug} href={`/event/${e.slug}`}>
                <div
                  className="flex items-stretch overflow-hidden bg-white active:opacity-90"
                  style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}
                >
                  <EventImage src={e.image} alt={e.title} />
                  <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide w-fit px-2 py-0.5 rounded-full mb-1"
                      style={{ backgroundColor: `${categories[e.category]?.color}1A`, color: categories[e.category]?.color }}
                    >
                      {e.category}
                    </span>
                    <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{e.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.6)" }}>{e.date} · {e.time}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(0,0,0,0.6)" }}>{e.location}</p>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
