import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { ListSearch, FilterPills, OffersLink } from "../components/ListSearch";
import useFetch from "../../hooks/useFetch";
import { getHotels, getAccommodations } from "../../api";

export default function LiveScreen() {
  const { data: hotels } = useFetch(getHotels, []);
  const { data: accommodations } = useFetch(getAccommodations, []);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const all = useMemo(
    () => [
      ...(hotels ?? []).map((s) => ({ ...s, kind: "Hotel", stayKind: "hotels" })),
      ...(accommodations ?? []).map((s) => ({ ...s, kind: s.type, stayKind: "accommodation" })),
    ],
    [hotels, accommodations]
  );

  const filters = useMemo(
    () => ["All", ...Array.from(new Set(all.map((p) => p.kind)))],
    [all]
  );

  const places = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (filter !== "All" && p.kind !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.tagline ?? "").toLowerCase().includes(q) ||
        (p.address ?? "").toLowerCase().includes(q)
      );
    });
  }, [all, filter, query]);

  return (
    <MobileShell title="Live & Stay" onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-4 mobile-stagger">
        <p className="text-sm font-medium" style={{ color: "#000000" }}>
          Hotels and accommodation in and around Maidenhead.
        </p>

        <OffersLink />

        <ListSearch value={query} onChange={setQuery} placeholder="Search hotels & stays…" />

        <FilterPills options={filters} value={filter} onChange={setFilter} />

        <div className="flex flex-col gap-3">
          {places.map((p) => (
            <Link key={p.slug} to={`/mobile/stay/${p.stayKind}/${p.slug}`}>
              <MobileCard className="flex items-stretch overflow-hidden active:opacity-90">
                <img src={p.image} alt="" className="w-28 h-28 object-cover shrink-0" />
                <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "var(--teal-deep)" }}>{p.kind}</span>
                  <p className="text-sm font-bold leading-snug mt-0.5" style={{ color: "#000000" }}>{p.name}</p>
                  <p className="text-xs mt-1 leading-snug line-clamp-2 font-medium" style={{ color: "#000000", opacity: 0.75 }}>{p.tagline}</p>
                </div>
              </MobileCard>
            </Link>
          ))}
          {all.length === 0 && (
            <p className="text-sm text-center py-8 font-medium" style={{ color: "#000000" }}>Loading places to stay…</p>
          )}
          {all.length > 0 && places.length === 0 && (
            <p className="text-sm text-center py-10 font-medium" style={{ color: "#000000" }}>
              No results{query ? ` for “${query}”` : ""}.
            </p>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
