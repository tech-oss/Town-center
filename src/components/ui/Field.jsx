// Shared form field for the standard light forms (white-card style).
// Renders a label + a control (input / select / textarea) with the project's
// consistent styling. Used by BookingForm today; the reusable primitive for
// future Business/Admin forms. NOTE: the newsletter forms use a distinct
// dark-section pill style and intentionally do NOT use this component.

const CONTROL_CLASS =
  "w-full rounded-xl px-4 py-3 text-sm outline-none transition-shadow focus:ring-2";
const CONTROL_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid rgba(28,46,56,0.15)",
  color: "var(--ink)",
};
const LABEL_CLASS = "block text-xs font-semibold mb-1.5";
const LABEL_STYLE = { color: "var(--forest)" };

export default function Field({ label, as = "input", className = "", children, ...props }) {
  const Control = as;
  return (
    <div className={className}>
      <label className={LABEL_CLASS} style={LABEL_STYLE}>{label}</label>
      {as === "input" ? (
        <input className={CONTROL_CLASS} style={CONTROL_STYLE} {...props} />
      ) : (
        <Control className={CONTROL_CLASS} style={CONTROL_STYLE} {...props}>
          {children}
        </Control>
      )}
    </div>
  );
}
