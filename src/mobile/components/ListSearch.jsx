import { Link } from "react-router-dom";

// Page-level ("contextual") search box used by listing screens to narrow the
// results already on screen. This sits alongside — not instead of — the global
// search in the app header.
export function ListSearch({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="flex items-center gap-2 px-3.5 rounded-full" style={{ height: 42, backgroundColor: "rgba(28,46,56,0.06)" }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm font-medium min-w-0"
        style={{ color: "#000000" }}
      />
      {value && (
        <button onClick={() => onChange("")} aria-label="Clear search" className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(28,46,56,0.3)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </div>
  );
}

// Horizontal pill filter bar shared by the listing screens.
export function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5">
      {options.map((o) => {
        const key = typeof o === "string" ? o : o.key;
        const label = typeof o === "string" ? o : o.label;
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs whitespace-nowrap"
            style={active
              ? { backgroundColor: "var(--forest)", color: "#ffffff", fontWeight: 800 }
              : { backgroundColor: "rgba(28,46,56,0.06)", color: "#000000", fontWeight: 600 }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// "Back to offers" CTA shown on the main directory screens so users can always
// get back to current offers and promotions.
export function OffersLink({ className = "" }) {
  return (
    <Link
      to="/mobile/offers"
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-85 ${className}`}
      style={{ backgroundColor: "var(--teal-deep)" }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
        <circle cx="7.5" cy="7.5" r="1.2" fill="#ffffff" />
      </svg>
      <span className="flex-1 text-sm font-bold text-white leading-tight">Offers &amp; Promotions</span>
      <span className="text-[11px] font-extrabold tracking-wide px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#ffffff", color: "var(--forest)" }}>
        SEE ALL
      </span>
    </Link>
  );
}
