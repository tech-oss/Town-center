// "Featured" label for a business with a live Featured Business booking.
// `overlay` sits on a card photo; otherwise it flows inline with the text.
export default function FeaturedTag({ overlay = false, className = "" }) {
  return (
    <span
      className={`${overlay ? "absolute top-2 left-2 z-10" : ""} inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${className}`}
      style={{ backgroundColor: "#E8A33D", color: "#ffffff", boxShadow: overlay ? "0 2px 8px rgba(0,0,0,0.25)" : "none" }}
    >
      <span aria-hidden="true">★</span> Featured
    </span>
  );
}
