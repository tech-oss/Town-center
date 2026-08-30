import { useState, useRef, useEffect } from "react";
import { BUSINESS_SEARCH_DIRECTORY } from "../../Data/adminBusinessSearchMock";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";

const CATEGORY_COLOURS = {
  "Eat & Drink": { bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" },
  "Shop":        { bg: "rgba(22,163,74,0.12)", fg: "#15803D" },
  "See & Do":    { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
  "Services":    { bg: "rgba(139,92,246,0.14)", fg: "#6D28D9" },
  "Live & Stay": { bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" },
};
function CategoryBadge({ category }) {
  const c = CATEGORY_COLOURS[category] ?? { bg: "rgba(107,114,128,0.13)", fg: "#374151" };
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{category}</span>;
}

// Searchable business "attribution" picker — replaces a plain <select> that
// would otherwise list hundreds of businesses at once.
export default function BusinessTypeahead({ value, onChange, businesses = BUSINESS_SEARCH_DIRECTORY, placeholder = "Search for a business..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = businesses.find((b) => b.id === value) ?? null;

  const matches = query.trim()
    ? businesses.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(b) {
    onChange(b.id);
    setQuery("");
    setOpen(false);
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 w-fit px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.08)", border: `1.5px solid rgba(37,99,235,0.25)` }}>
        <span className="text-sm font-semibold" style={{ color: NAVY }}>{selected.name}</span>
        <CategoryBadge category={selected.category} />
        <button type="button" onClick={() => onChange("")} className="text-xs font-bold" style={{ color: BLUE }}>✕</button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query && setOpen(true)}
        placeholder={placeholder}
        className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
        style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}
      />
      {open && query.trim() && (
        <div className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto"
          style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}>
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>No businesses found.</p>
          ) : (
            matches.map((b) => (
              <button key={b.id} type="button" onClick={() => pick(b)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: `1px solid ${BORDER}` }}>
                <span className="text-sm font-medium" style={{ color: NAVY }}>{b.name}</span>
                <CategoryBadge category={b.category} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
