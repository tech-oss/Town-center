import { useEffect, useRef, useState } from "react";
import { newsletterModal as m } from "../Data/content";

export default function NewsletterModal({ open, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Focus first field on open + Escape to close
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    // Focus the first field once the open animation has begun
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap — keep Tab within the dialog
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden"; // lock background scroll

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const inputClasses =
    "w-full px-4 py-3 rounded-xl text-sm bg-white border outline-none transition-all duration-150 focus:ring-2";
  const inputStyle = {
    borderColor: "rgba(28,46,56,0.15)",
    color: "var(--ink)",
  };
  const onFocusRing = (e) => {
    e.currentTarget.style.borderColor = "var(--sage)";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(82,199,182,0.25)";
  };
  const onBlurRing = (e) => {
    e.currentTarget.style.borderColor = "rgba(28,46,56,0.15)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 newsletter-modal-overlay"
      style={{ backgroundColor: "rgba(15,28,35,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        // Close only when the click starts on the overlay itself (not inside the dialog)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-modal-title"
        className="newsletter-modal-card relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-7 sm:p-9"
        style={{ backgroundColor: "var(--sand)" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-black/5"
          style={{ color: "var(--forest)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {submitted ? (
          /* ── Success state ── */
          <div className="text-center py-10 px-2">
            <p className="text-lg md:text-xl font-medium leading-relaxed mb-8" style={{ color: "var(--forest)" }}>
              {m.success}
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-full text-sm font-semibold text-white transition-colors duration-150"
              style={{ backgroundColor: "var(--leaf)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
            >
              Close
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h2
              id="newsletter-modal-title"
              className="text-2xl md:text-3xl font-bold mb-2 pr-8 leading-tight"
              style={{ color: "var(--forest)" }}
            >
              {m.heading}
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink)", opacity: 0.7 }}>
              {m.subtext}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="flex flex-col gap-4"
            >
              {/* Name row — two columns on desktop */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--forest)" }}>
                    {m.fields.firstName}
                  </label>
                  <input
                    ref={firstFieldRef}
                    type="text"
                    className={inputClasses}
                    style={inputStyle}
                    onFocus={onFocusRing}
                    onBlur={onBlurRing}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--forest)" }}>
                    {m.fields.lastName}
                  </label>
                  <input type="text" className={inputClasses} style={inputStyle} onFocus={onFocusRing} onBlur={onBlurRing} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--forest)" }}>
                  {m.fields.email}
                </label>
                <input type="email" className={inputClasses} style={inputStyle} onFocus={onFocusRing} onBlur={onBlurRing} />
              </div>

              {/* Dropdowns — two columns on desktop */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--forest)" }}>
                    {m.visitReason.label}
                  </label>
                  <select className={inputClasses + " appearance-none cursor-pointer"} style={inputStyle} onFocus={onFocusRing} onBlur={onBlurRing} defaultValue="">
                    <option value="" disabled>Please select…</option>
                    {m.visitReason.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--forest)" }}>
                    {m.hearAbout.label}
                  </label>
                  <select className={inputClasses + " appearance-none cursor-pointer"} style={inputStyle} onFocus={onFocusRing} onBlur={onBlurRing} defaultValue="">
                    <option value="" disabled>Please select…</option>
                    {m.hearAbout.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 shrink-0 rounded accent-[var(--leaf)] cursor-pointer"
                />
                <span className="text-xs leading-relaxed" style={{ color: "var(--ink)", opacity: 0.75 }}>
                  {m.consent}
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                className="mt-2 w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors duration-150"
                style={{ backgroundColor: "var(--leaf)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
              >
                {m.buttonLabel}
              </button>

              {/* Privacy note */}
              <p className="text-xs text-center mt-1" style={{ color: "var(--ink)", opacity: 0.55 }}>
                {m.privacyNote}{" "}
                <a href={m.privacyLinkHref} className="underline" style={{ color: "var(--leaf)" }}>
                  {m.privacyLinkLabel}
                </a>
                .
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
