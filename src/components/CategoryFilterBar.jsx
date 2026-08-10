import { useState } from "react";
import { Link } from "react-router-dom";

// ── Shared icon set for category filters ──
// One small, consistent line-icon per category slug so every section (See &
// Do, Eat & Drink, Shop, Services) reads as one system. Falls back to a
// generic tag icon for any category without a specific mapping.
function Icon({ name, className = "", color }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: color || "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", className: `shrink-0 ${className}` };
  switch (name) {
    case "grid": return (<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
    case "martini": return (<svg {...p}><path d="M4 4h16l-8 9-8-9z" /><path d="M12 13v7M8 20h8" /></svg>);
    case "cloche": return (<svg {...p}><path d="M3 18a9 9 0 0118 0" /><path d="M2 18h20M12 3v3" /></svg>);
    case "cup": return (<svg {...p}><path d="M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" /><path d="M17 9h1.5a2.5 2.5 0 010 5H17M7 3c0 1-1 1-1 2M11 3c0 1-1 1-1 2" /></svg>);
    case "bag": return (<svg {...p}><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>);
    case "users": return (<svg {...p}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0112 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20a5 5 0 016-4.5" /></svg>);
    case "flag": return (<svg {...p}><path d="M5 3v18" /><path d="M5 4h13l-3 4 3 4H5" /></svg>);
    case "pizza": return (<svg {...p}><path d="M12 3l9 17H3l9-17z" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="10" cy="16" r="1" fill="currentColor" /></svg>);
    case "bowl": return (<svg {...p}><path d="M3 11h18a9 6 0 01-18 0z" /><path d="M12 11V6M8 8l1 3M16 8l-1 3" /></svg>);
    case "flame": return (<svg {...p}><path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-1.5.5-2.5 1.5-3.5C9 10 9.5 11 9.5 11S9 6 12 3z" /></svg>);
    case "bread": return (<svg {...p}><path d="M4 12a4 6 0 018 0v6H4v-6z" /><path d="M12 12a4 6 0 018 0v6h-8v-6z" /></svg>);
    case "gem": return (<svg {...p}><path d="M6 3h12l3 6-9 12L3 9l3-6z" /><path d="M3 9h18M9 3l3 6 3-6M12 9l-3 12M12 9l3 12" /></svg>);
    case "shirt": return (<svg {...p}><path d="M8 3l4 2 4-2 4 4-3 3v11H7V10L4 7l4-4z" /></svg>);
    case "phone": return (<svg {...p}><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>);
    case "cart": return (<svg {...p}><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /><path d="M2 3h2l2.4 12.2a2 2 0 002 1.8h8.2a2 2 0 002-1.6L21 8H6" /></svg>);
    case "heart": return (<svg {...p}><path d="M12 20s-7-4.4-9.5-9A5 5 0 0112 6a5 5 0 019.5 5c-2.5 4.6-9.5 9-9.5 9z" /></svg>);
    case "home": return (<svg {...p}><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></svg>);
    case "footprint": return (<svg {...p}><ellipse cx="9" cy="8" rx="3" ry="4" /><ellipse cx="16" cy="16" rx="3" ry="4" /></svg>);
    case "dumbbell": return (<svg {...p}><path d="M4 9v6M2 10v4M20 9v6M22 10v4M7 12h10" /></svg>);
    case "banknote": return (<svg {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></svg>);
    case "baby": return (<svg {...p}><circle cx="12" cy="7" r="3.5" /><path d="M6 20c0-4 3-6 6-6s6 2 6 6" /></svg>);
    case "wrench": return (<svg {...p}><path d="M14 6a4 4 0 015.7 3.6L15 14.3 9.7 9 14.4 4.3A4 4 0 0114 6z" /><path d="M9 15l-5 5" /></svg>);
    case "bolt": return (<svg {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /></svg>);
    case "roller": return (<svg {...p}><rect x="3" y="5" width="12" height="6" rx="1" /><path d="M9 11v4M9 15h4a2 2 0 012 2v3" /></svg>);
    case "key": return (<svg {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M17 6l3 3M14 9l2 2" /></svg>);
    case "sparkles": return (<svg {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /><path d="M19 15l.7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9L19 15z" /></svg>);
    case "calculator": return (<svg {...p}><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M8 6h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 19h1M12 19h1" /></svg>);
    case "scale": return (<svg {...p}><path d="M12 3v18M6 21h12" /><path d="M5 7l-3 6a3 3 0 006 0l-3-6zM19 7l-3 6a3 3 0 006 0l-3-6zM5 7h14" /></svg>);
    case "trending": return (<svg {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>);
    case "search": return (<svg {...p}><circle cx="10" cy="10" r="7" /><path d="M21 21l-5.5-5.5" /></svg>);
    case "shield": return (<svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>);
    case "pen": return (<svg {...p}><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" /></svg>);
    case "laptop": return (<svg {...p}><rect x="4" y="4" width="16" height="11" rx="1" /><path d="M2 19h20" /></svg>);
    case "camera": return (<svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l1.5-3h5L16 7" /><circle cx="12" cy="13" r="3.5" /></svg>);
    case "feather": return (<svg {...p}><path d="M20 4c-6 0-14 4-16 12 2 2 6 2 9 0M4 20l8-8" /></svg>);
    case "megaphone": return (<svg {...p}><path d="M3 10v4h3l7 4V6l-7 4H3z" /><path d="M14 9a3 3 0 010 6" /></svg>);
    case "cap": return (<svg {...p}><path d="M12 4l10 5-10 5L2 9l10-5z" /><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>);
    case "check-user": return (<svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0112 0" /><path d="M16 12l2 2 3.5-3.5" /></svg>);
    case "palette": return (<svg {...p}><path d="M12 3a9 9 0 000 18c1.2 0 2-1 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 004-4c0-4-4-7.5-9-7.5z" /><circle cx="7.5" cy="10.5" r="1" fill="currentColor" /><circle cx="8.5" cy="15" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" /></svg>);
    case "clapper": return (<svg {...p}><path d="M3 9l1.5-4h14L20 9" /><rect x="3" y="9" width="18" height="11" rx="1" /><path d="M7 5l1.5 4M12 5l1.5 4" /></svg>);
    case "gamepad": return (<svg {...p}><rect x="2" y="8" width="20" height="9" rx="4" /><path d="M7 10.5v4M5 12.5h4" /><circle cx="16" cy="11" r="1" fill="currentColor" /><circle cx="18.5" cy="13.5" r="1" fill="currentColor" /></svg>);
    case "book": return (<svg {...p}><path d="M4 5a2 2 0 012-2h6v18H6a2 2 0 00-2 2V5z" /><path d="M20 5a2 2 0 00-2-2h-6v18h6a2 2 0 002 2V5z" /></svg>);
    case "glasses": return (<svg {...p}><circle cx="6.5" cy="14" r="3.5" /><circle cx="17.5" cy="14" r="3.5" /><path d="M10 14h4M3 14l1.5-6h2M21 14l-1.5-6h-2" /></svg>);
    case "plane": return (<svg {...p}><path d="M3 13l18-8-8 18-2-8-8-2z" /></svg>);
    case "scissors": return (<svg {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 8l12 12M20 4L8 16" /></svg>);
    case "stethoscope": return (<svg {...p}><path d="M6 3v6a4 4 0 008 0V3M10 15a4 4 0 108 0v-2" /><circle cx="19" cy="19" r="2" /></svg>);
    default: return (<svg {...p}><path d="M20.6 12.6L12 21.2 2.8 12A3 3 0 012 9.8V4a2 2 0 012-2h5.8a3 3 0 012.2.8l8.6 8.6a2 2 0 010 2.2z" /><circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" /></svg>);
  }
}

// Category slug → icon name. Anything not listed here falls back to the
// generic tag icon above.
const CATEGORY_ICON = {
  // Eat & Drink
  bars: "martini", restaurants: "cloche", cafes: "cup", "grab-go": "bag",
  "private-dining": "users", british: "flag", italian: "pizza", chinese: "bowl",
  indian: "flame", french: "bread", thai: "bowl", japanese: "bowl", bakery: "bread",
  // Shop
  "accessories-jewellery": "gem", clothing: "shirt", "electronics-phones": "phone",
  groceries: "cart", "health-beauty": "heart", "home-furniture": "home",
  "shoes-footwear": "footprint", "sports-fitness": "dumbbell",
  banks: "banknote", childcare: "baby", "dry-cleaning": "shirt",
  hairdressing: "scissors", healthcare: "stethoscope", opticians: "glasses",
  spa: "sparkles", "travel-agents": "plane",
  // Services
  builders: "wrench", electricians: "bolt", plumbers: "wrench",
  "decorators-painters": "roller", locksmiths: "key", cleaners: "sparkles",
  accountants: "calculator", solicitors: "scale", "financial-advisers": "trending",
  "estate-agents": "home", recruitment: "search", "insurance-brokers": "shield",
  "graphic-designers": "palette", "web-developers": "laptop", photographers: "camera",
  copywriters: "feather", "marketing-consultants": "megaphone",
  "personal-trainers": "dumbbell", tutors: "cap", "virtual-assistants": "check-user",
  // See & Do
  "art-culture": "palette", community: "users", family: "users",
  "fashion-beauty": "sparkles", film: "clapper", gaming: "gamepad",
  learning: "book", "sport-wellness": "dumbbell",
};

// How many categories show inline before collapsing the rest into "More".
const VISIBLE_COUNT = 7;

export default function CategoryFilterBar({ basePath, categories, activeCategory, extra }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);

  const visible = categories.slice(0, VISIBLE_COUNT);
  const overflow = categories.slice(VISIBLE_COUNT);
  const activeItem = categories.find((c) => c.value === activeCategory);

  return (
    <div className="mb-10">
      {/* ── Desktop: inline icon row + "More" dropdown ── */}
      <div className="hidden sm:flex items-center gap-x-7 lg:gap-x-9 gap-y-3 flex-wrap pb-5 border-b" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
        <Link
          to={basePath}
          replace
          className="inline-flex items-center gap-2 pl-3.5 pr-4 py-2 rounded-full text-sm font-semibold transition-colors shrink-0"
          style={!activeCategory
            ? { backgroundColor: "var(--forest)", color: "#fff" }
            : { backgroundColor: "transparent", color: "#000000" }}
        >
          <Icon name="grid" /> All Categories
        </Link>

        {visible.map((c) => (
          <Link
            key={c.value}
            to={`${basePath}?category=${c.value}`}
            replace
            className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70 shrink-0"
            style={{ color: activeCategory === c.value ? "var(--leaf)" : "#000000" }}
          >
            <Icon name={CATEGORY_ICON[c.value]} color="var(--leaf)" />
            <span style={{ color: activeCategory === c.value ? "var(--leaf)" : "#000000" }}>{c.label}</span>
          </Link>
        ))}

        {overflow.length > 0 && (
          <div className="relative ml-auto shrink-0">
            <button
              onClick={() => setDesktopMoreOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "#000000" }}
            >
              More
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: desktopMoreOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {desktopMoreOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDesktopMoreOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-3 z-20 w-64 bg-white rounded-2xl overflow-hidden py-2"
                  style={{ boxShadow: "0 20px 48px -16px rgba(28,46,56,0.35)" }}
                >
                  {overflow.map((c) => (
                    <Link
                      key={c.value}
                      to={`${basePath}?category=${c.value}`}
                      replace
                      onClick={() => setDesktopMoreOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-70"
                      style={{ color: activeCategory === c.value ? "var(--leaf)" : "#000000" }}
                    >
                      <Icon name={CATEGORY_ICON[c.value]} color="var(--leaf)" />
                      {c.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {extra}
      </div>

      {/* ── Mobile: "Browse Categories" button opening a bottom sheet ── */}
      <div className="flex sm:hidden items-center justify-between gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2.5 pl-5 pr-4 py-3 rounded-full text-sm font-semibold transition-opacity"
          style={{ backgroundColor: "var(--forest)", color: "#fff" }}
        >
          {activeItem ? activeItem.label : "Browse Categories"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="20" y2="7" /><circle cx="15" cy="7" r="2" fill="#fff" stroke="none" />
            <line x1="4" y1="17" x2="20" y2="17" /><circle cx="9" cy="17" r="2" fill="#fff" stroke="none" />
          </svg>
        </button>
        {extra}
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl pt-5 pb-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#000000" }}>Categories</h3>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: "var(--forest)" }}
              >✕</button>
            </div>

            <Link
              to={basePath}
              replace
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between gap-3 px-6 py-3.5 border-t"
              style={{ borderColor: "rgba(28,46,56,0.08)" }}
            >
              <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                <Icon name="grid" /> All
              </span>
              <RadioDot active={!activeCategory} />
            </Link>

            {categories.map((c) => (
              <Link
                key={c.value}
                to={`${basePath}?category=${c.value}`}
                replace
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between gap-3 px-6 py-3.5 border-t"
                style={{ borderColor: "rgba(28,46,56,0.08)" }}
              >
                <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                  <Icon name={CATEGORY_ICON[c.value]} color="var(--leaf)" /> {c.label}
                </span>
                <RadioDot active={activeCategory === c.value} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RadioDot({ active }) {
  return (
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ border: `2px solid ${active ? "var(--leaf)" : "rgba(28,46,56,0.25)"}` }}
    >
      {active && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--leaf)" }} />}
    </span>
  );
}
