import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import useTapReveal from "../../hooks/useTapReveal";
import MobileShell from "../components/MobileShell";
import { sections } from "../../Data/pages";

const SECTION_INTROS = {
  "see-do": "Explore the best attractions, green spaces, and things to do in and around Maidenhead.",
  "eat-drink": "From riverside dining to cosy cafés, explore Maidenhead's food and drink scene.",
  shop: "From high-street favourites to independent boutiques, discover Maidenhead's shops.",
  services: "Trades, professionals and local businesses serving Maidenhead.",
};

// Framed-photo hover — same "spotlight" treatment used across the website's
// cards, adapted for a touch tap-reveal on mobile.
function CardImage({ src, alt }) {
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

export default function SectionScreen({ sectionKey }) {
  const section = sections[sectionKey];
  const [filter, setFilter] = useState("All");

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(section.items.map((i) => i.tag)))],
    [section]
  );

  const items = useMemo(
    () => (filter === "All" ? section.items : section.items.filter((i) => i.tag === filter)),
    [section, filter]
  );

  return (
    <MobileShell title={section.label} onBack>
      <div className="flex flex-col gap-5 mobile-stagger">
        <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>{SECTION_INTROS[sectionKey] ?? section.landing?.intro}</p>

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

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <Link key={it.slug} to={`/mobile/place/${it.slug}`}>
              <div
                className="flex items-stretch overflow-hidden bg-white active:opacity-90"
                style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}
              >
                <CardImage src={it.image} alt={it.name} />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <p className="text-sm font-bold leading-snug" style={{ color: "#000000" }}>{it.name}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2" style={{ color: "rgba(0,0,0,0.6)" }}>{it.description}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wide mt-1.5" style={{ color: "var(--leaf)" }}>{it.tag}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
