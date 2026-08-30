import { useState, useRef, useEffect } from "react";
import { PUSH_ATTACHABLE_ARTICLES } from "../../Data/adminPushArticlesMock";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";

const CATEGORY_COLOURS = {
  News: { bg: "rgba(22,163,74,0.12)", fg: "#15803D" },
  Offer: { bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" },
  Guide: { bg: "rgba(139,92,246,0.14)", fg: "#6D28D9" },
  "Featured Story": { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
};
function CategoryBadge({ category }) {
  const c = CATEGORY_COLOURS[category] ?? { bg: "rgba(107,114,128,0.13)", fg: "#374151" };
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{category}</span>;
}

// Searchable article/offer picker for attaching rich content to a push
// notification. `onSelect` receives the full article object (or null on clear).
export default function ArticleTypeahead({ selected, onSelect, placeholder = "Search for an article or offer..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const matches = query.trim()
    ? PUSH_ATTACHABLE_ARTICLES.filter((a) => a.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(a) {
    onSelect(a);
    setQuery("");
    setOpen(false);
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 w-fit px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.08)", border: `1.5px solid rgba(37,99,235,0.25)` }}>
        <img src={selected.thumbnail} alt="" className="w-6 h-6 rounded object-cover" />
        <span className="text-sm font-semibold" style={{ color: NAVY }}>{selected.title}</span>
        <CategoryBadge category={selected.category} />
        <button type="button" onClick={() => onSelect(null)} className="text-xs font-bold" style={{ color: BLUE }}>✕</button>
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
            <p className="px-3 py-2.5 text-xs" style={{ color: MUTED }}>No articles found.</p>
          ) : (
            matches.map((a) => (
              <button key={a.id} type="button" onClick={() => pick(a)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                style={{ borderBottom: `1px solid ${BORDER}` }}>
                <img src={a.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                <span className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: NAVY }}>{a.title}</span>
                <CategoryBadge category={a.category} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
