// The dark "Want to get involved?" card at the foot of Our Story and Work
// With Us. Both buttons come from Site Content, so a label can be anything
// from "Get in touch" to a full sentence. A short pair sits beside the text;
// once a label is sentence-length the buttons move underneath at full width,
// since a column sized to an unwrapped sentence pushed the buttons off the
// card and squeezed the heading into a narrow strip.
// Both buttons are set by our own team in Site Content (the claim-your-
// profile portal, our email), so they skip the "Leaving our website" popup.
const LONG_LABEL = 32;

export default function CtaCard({ title, text, buttons, className = "" }) {
  const shown = buttons.filter((b) => b.label && b.href);
  const stacked = shown.some((b) => b.label.length > LONG_LABEL);
  return (
    <div className={`rounded-3xl p-8 md:p-10 flex flex-col gap-6 ${stacked ? "" : "md:flex-row md:items-center"} ${className}`}
      style={{ backgroundColor: "var(--forest)", color: "white" }}>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-white">{title}</h2>
        {text && <p className="text-sm leading-relaxed text-white max-w-2xl">{text}</p>}
      </div>
      {shown.length > 0 && (
        <div className={stacked ? "flex flex-col sm:flex-row sm:flex-wrap gap-3" : "flex flex-col gap-3 md:shrink-0 md:max-w-xs"}>
          {shown.map((b) => (
            <a key={b.href + b.label} href={b.href} data-skip-external-confirm
              className={`px-7 py-3.5 ${b.label.length > LONG_LABEL ? "rounded-2xl" : "rounded-full"} font-semibold text-sm leading-snug text-center transition-opacity hover:opacity-90 break-words`}
              style={{ backgroundColor: "var(--leaf)", color: "white" }}>
              {b.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
