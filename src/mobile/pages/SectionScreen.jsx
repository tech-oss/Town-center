import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { sections } from "../data/mobileMock";

export default function SectionScreen({ sectionKey }) {
  const section = sections[sectionKey];
  const [filter, setFilter] = useState("All");

  const items = useMemo(
    () => (filter === "All" ? section.items : section.items.filter((i) => i.category === filter)),
    [section, filter]
  );

  return (
    <MobileShell title={section.title} onBack>
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>{section.intro}</p>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
          {section.filters.map((f) => (
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

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <Link key={it.id} to={`/mobile/place/${it.id}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={it.image} alt="" className="w-24 h-24 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <p className="text-sm font-bold leading-snug" style={{ color: "#000000" }}>{it.name}</p>
                  <p className="text-xs mt-1 leading-snug" style={{ color: "#000000" }}>{it.blurb}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wide mt-1.5" style={{ color: "var(--leaf)" }}>{it.category}</span>
                </div>
              </MobileCard>
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
