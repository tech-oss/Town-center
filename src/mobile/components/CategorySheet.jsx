import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, CATEGORY_ICON } from "../../components/categoryIcons";

// The category filter as the website renders it at phone width
// (CategoryFilterBar's "Browse Categories" button and bottom sheet): same
// flat list, same order, same icons, "All" first. Single-select — the screen
// owns the value (it lives in the URL as ?category=), this only picks it.
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

export default function CategorySheet({ categories, value, onChange, title = "Categories", triggerLabel = "Browse Categories" }) {
  const [open, setOpen] = useState(false);
  const activeItem = categories.find((c) => c.value === value);

  // Lock the page behind the sheet, or a scroll that reaches the end of the
  // list chains into the listing underneath.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function pick(next) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 pl-5 pr-4 py-3 rounded-full text-sm font-semibold shrink-0 max-w-[60%]"
        style={{ backgroundColor: "var(--forest)", color: "#fff" }}
      >
        <span className="truncate">{activeItem ? activeItem.label : triggerLabel}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <line x1="4" y1="7" x2="20" y2="7" /><circle cx="15" cy="7" r="2" fill="#fff" stroke="none" />
          <line x1="4" y1="17" x2="20" y2="17" /><circle cx="9" cy="17" r="2" fill="#fff" stroke="none" />
        </svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl pt-5 pb-6 max-h-[80vh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#000000" }}>{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: "var(--forest)" }}
              >✕</button>
            </div>

            <button type="button" onClick={() => pick(null)} className="flex items-center justify-between gap-3 w-full px-6 py-3.5 border-t" style={{ borderColor: "rgba(28,46,56,0.08)" }}>
              <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                <Icon name="grid" /> All
              </span>
              <RadioDot active={!value} />
            </button>

            {categories.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => pick(c.value)}
                className="flex items-center justify-between gap-3 w-full px-6 py-3.5 border-t text-left"
                style={{ borderColor: "rgba(28,46,56,0.08)" }}
              >
                <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                  <Icon name={CATEGORY_ICON[c.value]} color="var(--leaf)" /> {c.label}
                </span>
                <RadioDot active={value === c.value} />
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
