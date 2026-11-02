// The credit line for an article or guide picture ("Photo: Jane Smith"), as
// typed in admin or the business portal. Nothing is shown when it's empty.
// "below" sits under a picture; "overlay" sits in the bottom-right corner of
// a full-width picture with text over it (a guide's hero).
export default function ImageCredit({ text, variant = "below", className = "" }) {
  const credit = String(text ?? "").trim();
  if (!credit) return null;
  if (variant === "overlay") {
    return (
      <p className={`absolute bottom-2 right-3 z-10 text-[10px] md:text-[11px] leading-snug max-w-[70%] text-right ${className}`}
        style={{ color: "rgba(255,255,255,0.8)", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
        {credit}
      </p>
    );
  }
  return (
    <p className={`text-[11px] md:text-xs leading-snug mt-1.5 ${className}`} style={{ color: "rgba(0,0,0,0.55)" }}>
      {credit}
    </p>
  );
}
