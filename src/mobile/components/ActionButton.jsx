// Circular icon + label action button — the shared style for a business
// detail screen's primary action row (Website/Directions/Share etc.),
// matching Eat & Drink/Shop/See & Do's PlaceDetailScreen exactly so every
// section (including Services and Freelancers) reads the same way.
export default function ActionButton({ icon, label, href, onClick, skipExternalConfirm }) {
  const inner = (
    <>
      <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)", color: "#fff" }}>
        {icon}
      </span>
      <span className="text-xs font-semibold text-center leading-snug" style={{ color: "#000000" }}>{label}</span>
    </>
  );
  const className = "flex flex-col items-center gap-2 active:opacity-70";
  if (onClick) return <button type="button" onClick={onClick} className={className}>{inner}</button>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...(skipExternalConfirm ? { "data-skip-external-confirm": true } : {})} className={className}>
      {inner}
    </a>
  );
}
