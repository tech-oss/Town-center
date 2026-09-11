import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, CATEGORY_ICON } from "./categoryIcons";

// Width set aside for the "More" control when the categories don't all fit.
const MORE_WIDTH = 110;
// The bar's own horizontal padding (pl-1.5 + pr-2), excluded from the space
// the category strip can use.
const BAR_PADDING = 14;

export default function CategoryFilterBar({ basePath, categories, activeCategory, extra, search = "", onSearchChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);

  // Lock background scroll while the mobile sheet is open — without this,
  // a scroll gesture that reaches the top/bottom of the sheet's own list
  // chains into the page behind it, so the sheet appears to "flicker" and
  // the listing cards show through underneath it.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // How many categories fit on one line is measured rather than hard-coded:
  // label lengths differ a lot per section (Eat & Drink's "Bars" vs Services'
  // "Copywriters & Content Writers"), so a fixed count would either clip or
  // leave the bar looking sparse.
  //
  // Both inputs are deliberately independent of how many items are currently
  // shown, so a measurement can never feed back into itself: widths come from
  // a hidden row that always renders the FULL set, and the space to fill is
  // derived from the bar's own width (fixed by the page container) minus the
  // two fixed-width controls that flank the strip.
  const gaugeRef = useRef(null);
  const barRef = useRef(null);
  const chipRef = useRef(null);
  const [fitCount, setFitCount] = useState(categories.length);
  // Widest natural item width (icon + label + the item's own padding),
  // applied to every visible item so each occupies an equal-width slot —
  // otherwise a short label like "Bars" sits in a much narrower box than
  // "Private Dining", making the divider spacing between items look uneven
  // even though the padding itself is identical.
  const [itemWidth, setItemWidth] = useState(0);

  const measure = () => {
    const gauge = gaugeRef.current;
    const bar = barRef.current;
    const chip = chipRef.current;
    if (!gauge || !bar || !chip) return;

    const barWidth = bar.clientWidth;
    if (!barWidth) return;

    const widths = [...gauge.children].map((el) => el.getBoundingClientRect().width);
    const total = widths.reduce((a, b) => a + b, 0);
    const room = barWidth - chip.getBoundingClientRect().width - BAR_PADDING;
    const maxWidth = widths.length ? Math.max(...widths) : 0;

    // Everything fits — no "More" control, so none of its width to set aside.
    // Fit is computed against each item's equal (widest) width rather than
    // its own natural width, since that's what will actually be rendered.
    const next = maxWidth * widths.length <= room
      ? widths.length
      : Math.max(1, Math.floor((room - MORE_WIDTH) / maxWidth));

    setFitCount((prev) => (prev === next ? prev : next));
    setItemWidth((prev) => (prev === maxWidth ? prev : maxWidth));
  };

  // Re-measure after every render (cheap, and settles in one extra pass since
  // the inputs don't depend on the result), on viewport resize, and whenever
  // the bar itself changes width. Observing the bar is safe — unlike the
  // strip, its width is fixed by the page container rather than by how many
  // items are showing, so this can't loop.
  useLayoutEffect(measure);

  useLayoutEffect(() => {
    const bar = barRef.current;
    window.addEventListener("resize", measure);
    const ro = bar ? new ResizeObserver(measure) : null;
    if (ro && bar) ro.observe(bar);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  const visible = categories.slice(0, fitCount);
  const overflow = categories.slice(fitCount);
  const activeItem = categories.find((c) => c.value === activeCategory);

  return (
    <div className="mb-10">
      {/* ── Desktop: one white pill-shaped bar — "All Categories" chip, then
          divider-separated category links, then "More" — with a search-by-
          name field alongside it, on the same row so it reads as part of
          the same filter control rather than a separate, disconnected
          element. Strictly single-line: the category strip is the only
          flexible part, so "More" can never wrap onto a second row. ── */}
      <div className="hidden sm:flex sm:flex-col gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
        <div
          ref={barRef}
          className="flex-1 min-w-0 flex items-center flex-nowrap bg-white rounded-full pl-1.5 pr-2 py-1.5"
          style={{ boxShadow: "0 2px 14px -6px rgba(28,46,56,0.22), 0 0 0 1px rgba(28,46,56,0.06)" }}
        >
          <Link
            ref={chipRef}
            to={basePath}
            replace
            className="inline-flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full text-sm font-semibold transition-colors shrink-0"
            style={!activeCategory
              ? { backgroundColor: "var(--forest)", color: "#fff" }
              : { backgroundColor: "transparent", color: "#000000" }}
          >
            <Icon name="grid" /> All Categories
          </Link>

          {/* Category strip — the single flexible element, so the bar always
              stays one line no matter how long the labels are. */}
          <div className="relative flex-1 min-w-0 flex items-center flex-nowrap overflow-hidden">
            {visible.map((c) => {
              const active = activeCategory === c.value;
              return (
                <div key={c.value} className="flex items-center shrink-0">
                  <span className="w-px h-6 mx-0.5 lg:mx-1.5 shrink-0" style={{ backgroundColor: "rgba(28,46,56,0.12)" }} />
                  <Link
                    to={`${basePath}?category=${c.value}`}
                    replace
                    className="inline-flex items-center justify-center gap-2 px-2.5 lg:px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:opacity-70"
                    style={{
                      ...(active
                        ? { backgroundColor: "var(--forest)", color: "#fff" }
                        : { backgroundColor: "transparent", color: "#000000" }),
                      ...(itemWidth ? { width: itemWidth } : null),
                    }}
                  >
                    <Icon name={CATEGORY_ICON[c.value]} color={active ? "#fff" : "var(--leaf)"} />
                    {c.label}
                  </Link>
                </div>
              );
            })}

            {/* Hidden gauge: always the full set, used only to measure natural
                item widths. Never visible and never hit-testable. */}
            <div
              ref={gaugeRef}
              aria-hidden="true"
              className="absolute left-0 top-0 flex items-center flex-nowrap invisible pointer-events-none"
            >
              {categories.map((c) => (
                <div key={c.value} className="flex items-center shrink-0">
                  <span className="w-px h-6 mx-0.5 lg:mx-1.5 shrink-0" />
                  <span className="inline-flex items-center gap-2 px-2.5 lg:px-3.5 py-2.5 text-sm font-medium whitespace-nowrap">
                    <Icon name={CATEGORY_ICON[c.value]} />
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {overflow.length > 0 && (
            <div className="relative shrink-0 flex items-center">
              <span className="w-px h-6 mx-0.5 lg:mx-1.5 shrink-0" style={{ backgroundColor: "rgba(28,46,56,0.12)" }} />
              <button
                onClick={() => setDesktopMoreOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-70"
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
                    {overflow.map((c) => {
                      const active = activeCategory === c.value;
                      return (
                        <Link
                          key={c.value}
                          to={`${basePath}?category=${c.value}`}
                          replace
                          onClick={() => setDesktopMoreOpen(false)}
                          className="flex items-center gap-3 mx-2 my-0.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-70"
                          style={active
                            ? { backgroundColor: "var(--forest)", color: "#fff" }
                            : { backgroundColor: "transparent", color: "#000000" }}
                        >
                          <Icon name={CATEGORY_ICON[c.value]} color={active ? "#fff" : "var(--leaf)"} />
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <SearchInput value={search} onChange={onSearchChange} className="w-56 lg:w-64 shrink-0" />
        </div>

        {extra && <div className="shrink-0 self-end">{extra}</div>}
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
        <SearchInput value={search} onChange={onSearchChange} className="flex-1 min-w-0" />
      </div>
      {extra && <div className="flex sm:hidden justify-end mt-3">{extra}</div>}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl pt-5 pb-6 max-h-[80vh] overflow-y-auto overscroll-contain"
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

// Search-by-name field — a pill matching the category bar's own visual
// weight (white, rounded-full, same soft shadow) so it reads as part of
// the same filter control rather than a bolted-on extra. Shared between
// the mobile and desktop layouts.
function SearchInput({ value, onChange, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(28,46,56,0.4)" }}>
        <Icon name="search" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name"
        aria-label="Search by name"
        className="w-full pl-11 pr-9 py-2.5 sm:py-3 rounded-full text-sm bg-white focus:outline-none"
        style={{ boxShadow: "0 2px 14px -6px rgba(28,46,56,0.22), 0 0 0 1px rgba(28,46,56,0.06)", color: "#000000" }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
          style={{ backgroundColor: "rgba(28,46,56,0.08)", color: "#000000" }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
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
