// Approved reviews on an app business page — the app version of
// components/BusinessReviews.jsx. Renders nothing when there are none.
export default function MobileReviews({ reviews }) {
  if (!reviews?.length) return null;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const stars = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="section-eyebrow" style={{ color: "var(--teal-deep)" }}>Reviews</p>
        <p className="text-xs" style={{ color: "#000000" }}>
          <span style={{ color: "#F5A524" }}>{stars(Math.round(average))}</span> {average.toFixed(1)} · {reviews.length}
        </p>
      </div>
      {reviews.map((r) => (
        <div key={r.id} className="bg-white p-4 flex flex-col gap-1.5" style={{ borderRadius: 16, boxShadow: "0 6px 20px -12px rgba(28,46,56,0.35)" }}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: "#000000" }}>{r.reviewer}</p>
            <span className="text-sm" style={{ color: "#F5A524" }} aria-label={`${r.rating} out of 5 stars`}>{stars(r.rating)}</span>
          </div>
          {r.date && <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.5)" }}>{r.date}</p>}
          {r.text && <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{r.text}</p>}
          {r.reply && (
            <p className="text-xs pl-2.5" style={{ color: "rgba(0,0,0,0.65)", borderLeft: "2px solid rgba(28,46,56,0.15)" }}>
              <span className="font-semibold">Reply from the business:</span> {r.reply}
            </p>
          )}
          {r.sourceUrl && (
            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold w-fit" style={{ color: "var(--leaf)" }}>Read the original review ↗</a>
          )}
        </div>
      ))}
    </div>
  );
}
