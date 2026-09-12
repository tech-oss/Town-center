import MobileCard from "./MobileCard";

// A muted "coming soon" card, shown in place of premium content on a
// free-plan business listing.
export default function ComingSoonCard({ heading, text }) {
  return (
    <MobileCard className="p-4 flex flex-col gap-1">
      {heading && <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{heading}</p>}
      <p className="text-sm italic" style={{ color: "rgba(0,0,0,0.55)" }}>{text}</p>
    </MobileCard>
  );
}
