import { useEffect, useRef, useState } from "react";
import { formatUK, parseUK } from "../../lib/ukDate";

const DEFAULT_STYLE = { border: "1.5px solid rgba(16,24,40,0.2)", color: "#1E293B", backgroundColor: "#fff" };

// A date field that reads and types as DD/MM/YYYY whatever the browser's
// locale, instead of <input type="date">, which shows MM/DD/YYYY on any
// machine set to US English. The value in and out is still ISO (YYYY-MM-DD),
// and onChange receives an event-like { target: { value } } so it drops in
// where a native date input used to be.
//
// The calendar button opens the browser's own picker through a hidden native
// input, so choosing a date by clicking still works.
export default function UKDateInput({ value, onChange, min, max, className, style, placeholder = "DD/MM/YYYY", disabled }) {
  const [text, setText] = useState(formatUK(value));
  const [invalid, setInvalid] = useState(false);
  const pickerRef = useRef(null);

  // Keep the text in step when the value changes from outside (a reset, a
  // record loading in, or a pick from the calendar).
  useEffect(() => {
    setText(formatUK(value));
    setInvalid(false);
  }, [value]);

  function emit(iso) {
    onChange?.({ target: { value: iso } });
  }

  function commit(raw) {
    if (!raw.trim()) {
      setInvalid(false);
      if (value) emit("");
      return;
    }
    const iso = parseUK(raw);
    const outOfRange = iso && ((min && iso < min) || (max && iso > max));
    if (!iso || outOfRange) { setInvalid(true); return; }
    setInvalid(false);
    setText(formatUK(iso));
    if (iso !== value) emit(iso);
  }

  function openPicker() {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); return; } catch { /* falls through to focus */ }
    }
    el.focus();
    el.click();
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          // Commit as soon as a complete date has been typed, so a form saved
          // without leaving the field still gets the value.
          if (parseUK(e.target.value)) commit(e.target.value);
        }}
        onBlur={(e) => commit(e.target.value)}
        className={className ?? "rounded-xl px-3 py-2.5 text-sm outline-none w-full"}
        style={{ ...DEFAULT_STYLE, ...(style ?? {}), paddingRight: 36, ...(invalid ? { borderColor: "#DC2626" } : {}) }}
        aria-invalid={invalid || undefined}
        title={invalid ? "Enter a valid date as DD/MM/YYYY" : undefined}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label="Open calendar"
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-90"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value ?? ""}
        min={min}
        max={max}
        onChange={(e) => emit(e.target.value)}
        className="absolute right-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
}
