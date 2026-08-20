import { useEffect, useRef } from "react";

// Sitewide "Leaving our website" confirmation, shown before any external
// link (a different hostname) is opened. Modeled on NewsletterModal's
// overlay/focus-trap/escape pattern.
export default function ExternalLinkModal({ open, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const t = setTimeout(() => confirmRef.current?.focus(), 50);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
    document.body.style.overflow = "hidden";

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(15,28,35,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="external-link-modal-title"
        aria-describedby="external-link-modal-desc"
        className="relative w-full max-w-sm rounded-2xl shadow-2xl p-7"
        style={{ backgroundColor: "var(--sand)" }}
      >
        <h2
          id="external-link-modal-title"
          className="text-xl font-bold mb-2 leading-tight"
          style={{ color: "#000000" }}
        >
          Leaving our website
        </h2>
        <p id="external-link-modal-desc" className="text-sm leading-relaxed mb-6" style={{ color: "#000000" }}>
          This link will take you to an external website. We don&rsquo;t control its content.
        </p>

        <div className="flex items-center gap-3">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-full text-sm font-semibold text-white transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--leaf)", "--tw-ring-color": "var(--leaf)", "--tw-ring-offset-color": "var(--sand)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-full text-sm font-semibold transition-colors duration-150 border outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: "rgba(28,46,56,0.2)", color: "#000000", "--tw-ring-color": "var(--leaf)", "--tw-ring-offset-color": "var(--sand)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
