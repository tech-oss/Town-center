import { useMemo, useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import useMobileBack from "../hooks/useMobileBack";
import { searchAll, SEARCH_GROUPS } from "../lib/searchIndex";

const SUGGESTIONS = [
  { label: "Parking", to: "/mobile/parking" },
  { label: "Getting Here", to: "/mobile/transport" },
  { label: "Offers", to: "/mobile/offers" },
  { label: "What's On", to: "/mobile/whats-on" },
  { label: "Eat & Drink", to: "/mobile/eat-drink" },
  { label: "Places to Stay", to: "/mobile/live" },
];

export default function SearchScreen() {
  const goBack = useMobileBack("/mobile/home");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => searchAll(q, group), [q, group]);

  // Group headings only make sense while browsing everything at once.
  const grouped = useMemo(() => {
    if (group !== "All") return [[group, results]];
    const map = new Map();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group).push(r);
    }
    return [...map.entries()];
  }, [results, group]);

  return (
    <MobileShell hideHeader noPadding>
      <div className="flex flex-col">
        {/* Search bar */}
        <div className="px-4 pt-3 pb-3 sticky top-0 z-20" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(28,46,56,0.1)" }}>
          <div className="flex items-center gap-2">
            <button onClick={goBack} className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full active:bg-black/5" aria-label="Back">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div className="flex-1 flex items-center gap-2 px-3.5 rounded-full" style={{ height: 42, backgroundColor: "rgba(28,46,56,0.06)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
              </svg>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search places, offers, events…"
                className="flex-1 bg-transparent outline-none text-sm font-medium"
                style={{ color: "#000000" }}
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Clear" className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(28,46,56,0.3)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Result-type filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none mt-3 -mx-4 px-4">
            {["All", ...SEARCH_GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap"
                style={group === g
                  ? { backgroundColor: "var(--forest)", color: "#ffffff", fontWeight: 800 }
                  : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000", fontWeight: 600 }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {!q && (
            <div>
              <p className="section-eyebrow mb-3" style={{ color: "var(--teal-deep)" }}>Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s.label}
                    to={s.to}
                    className="px-4 py-2 rounded-full text-sm font-bold active:opacity-70"
                    style={{ backgroundColor: "var(--mint)", color: "#000000" }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {q && results.length === 0 && (
            <p className="text-sm text-center py-10 font-medium" style={{ color: "#000000" }}>
              No results for “{q}”.
            </p>
          )}

          {grouped.map(([name, rows]) => (
            <div key={name}>
              <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>{name}</p>
              <div className="flex flex-col gap-2.5">
                {rows.map((r) => (
                  <Link
                    key={r.id}
                    to={r.to}
                    className="flex items-stretch overflow-hidden bg-white active:opacity-90"
                    style={{ borderRadius: 14, boxShadow: "0 8px 24px -12px rgba(28,46,56,0.4)" }}
                  >
                    <img src={r.image} alt="" className="w-16 h-16 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 px-3 py-2 flex flex-col justify-center">
                      <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{r.title}</p>
                      <p className="text-[11px] mt-0.5 truncate font-medium" style={{ color: "#000000", opacity: 0.7 }}>{r.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
