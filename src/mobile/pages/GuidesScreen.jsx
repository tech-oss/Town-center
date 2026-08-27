import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { ListSearch, FilterPills } from "../components/ListSearch";
import { guides, guidesIndex } from "../../Data/guides";

export default function GuidesScreen() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(guides.map((g) => g.category)))],
    []
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((g) => {
      if (category !== "All" && g.category !== category) return false;
      if (!q) return true;
      return g.title.toLowerCase().includes(q) || (g.summary ?? "").toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <MobileShell title="Neighbourhood Guides" onBack backFallback="/mobile/explore" noPadding>
      <div className="flex flex-col">
        <div className="relative h-40 -mb-1">
          <img src={guidesIndex.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <p className="absolute bottom-3 left-5 text-white text-lg font-bold" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            Neighbourhood Guides
          </p>
        </div>

        <div className="flex flex-col gap-4 mobile-stagger px-5 pt-5 pb-6">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>
          Curated guides to eating, drinking and spending time in Maidenhead.
        </p>

        <ListSearch value={query} onChange={setQuery} placeholder="Search guides…" />

        <FilterPills options={categories} value={category} onChange={setCategory} />

        <div className="flex flex-col gap-3">
          {list.map((g) => (
            <Link
              key={g.slug}
              to={`/mobile/guides/${g.slug}`}
              className="relative overflow-hidden rounded-2xl h-40 flex items-end active:opacity-90"
              style={{ boxShadow: "0 12px 30px -14px rgba(28,46,56,0.6)" }}
            >
              <img src={g.cardImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0) 30%, rgba(12,20,24,0.9) 100%)" }} />
              <div className="relative p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--mint)", textShadow: "0 1px 6px rgba(0,0,0,0.65)" }}>{g.category}</span>
                <p className="text-base font-bold leading-snug text-white mt-0.5">{g.title}</p>
                <p className="text-xs mt-1 leading-snug line-clamp-2 font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{g.summary}</p>
              </div>
            </Link>
          ))}
          {list.length === 0 && (
            <p className="text-sm text-center py-10 font-medium" style={{ color: "#000000" }}>
              No guides{query ? ` for “${query}”` : ""}.
            </p>
          )}
        </div>
        </div>
      </div>
    </MobileShell>
  );
}
