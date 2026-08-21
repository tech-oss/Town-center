import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Single dropdown pattern for the whole app: a pill button that opens a
// full-screen bottom sheet (title, dot-coloured rows, close button), rather
// than each filter growing its own inline/positioned popover. Supports both
// single-select (radio, tap-to-close) and multi-select (checkbox, stays open
// with an Apply action) since What's On needs several event types at once
// while Offers' filters are one-at-a-time.
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

function CheckBox({ active }) {
  return (
    <span
      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
      style={active
        ? { backgroundColor: "var(--leaf)" }
        : { border: "2px solid rgba(28,46,56,0.25)" }}
    >
      {active && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      )}
    </span>
  );
}

export default function FilterSheet({
  title,
  triggerLabel,
  options, // [{ key, label, color }]
  multi = false,
  value, // single: string|null — multi: Set
  onChange,
  allLabel = "All",
  allColor = "var(--forest)",
}) {
  const [open, setOpen] = useState(false);
  const active = multi ? value.size > 0 : value != null;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const selectSingle = (key) => {
    onChange(key);
    setOpen(false);
  };

  const toggleMulti = (key) => {
    const next = new Set(value);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 pl-4 pr-3.5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0"
        style={active ? { backgroundColor: "var(--forest)", color: "#fff" } : { backgroundColor: "rgba(28,46,56,0.06)", color: "rgba(0,0,0,0.75)" }}
      >
        {triggerLabel}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl pt-5 pb-6 max-h-[75vh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#000000" }}>{title}</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: "var(--forest)" }}>✕</button>
            </div>

            {!multi && (
              <button type="button" onClick={() => selectSingle(null)} className="flex items-center justify-between gap-3 w-full px-6 py-3.5 border-t" style={{ borderColor: "rgba(28,46,56,0.08)" }}>
                <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: allColor }} /> {allLabel}
                </span>
                <RadioDot active={value == null} />
              </button>
            )}

            {options.map((o) => (
              <button
                type="button"
                key={o.key}
                onClick={() => (multi ? toggleMulti(o.key) : selectSingle(o.key))}
                className="flex items-center justify-between gap-3 w-full px-6 py-3.5 border-t"
                style={{ borderColor: "rgba(28,46,56,0.08)" }}
              >
                <span className="flex items-center gap-3 text-[15px]" style={{ color: "#000000" }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: o.color ?? "var(--leaf)" }} /> {o.label}
                </span>
                {multi ? <CheckBox active={value.has(o.key)} /> : <RadioDot active={value === o.key} />}
              </button>
            ))}

            {multi && (
              <div className="flex items-center gap-3 px-6 pt-5">
                {value.size > 0 && (
                  <button type="button" onClick={() => onChange(new Set())} className="text-xs font-semibold underline" style={{ color: "#000000" }}>
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-3 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--forest)" }}
                >
                  Show Results
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
