// Small corner badge marking a card's picture as an Offer — the same tag
// glyph as the app's Offers tab. Shared by the website and the app so an
// offer looks like an offer wherever it's listed.
export default function OfferTag({ size = 24 }) {
  return (
    <span
      className="absolute top-2 left-2 rounded-lg flex items-center justify-center z-[1]"
      style={{ width: size, height: size, backgroundColor: "var(--teal-deep)", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
      aria-label="Offer"
      title="Offer"
    >
      <svg width={Math.round(size * 0.54)} height={Math.round(size * 0.54)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
        <circle cx="7.5" cy="7.5" r="1.2" fill="#fff" />
      </svg>
    </span>
  );
}
