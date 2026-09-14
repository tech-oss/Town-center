// Approved reviews on a business page (Eat & Drink, Shop, See & Do, Stay).
// Reviews are added by the business, approved by admin, and only published
// for Visibility Plan businesses — so a page with none renders nothing.

function Stars({ value }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= value ? "#F5A524" : "none"} stroke="#F5A524" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

export default function BusinessReviews({ reviews }) {
  if (!reviews?.length) return null;
  const average = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section className="py-12 md:py-16 px-6 md:px-12" style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <h2 className="hero-title uppercase text-2xl md:text-4xl" style={{ color: "#000000" }}>Reviews</h2>
          <p className="flex items-center gap-2 text-sm" style={{ color: "#000000" }}>
            <Stars value={Math.round(average)} />
            <span className="font-semibold">{average.toFixed(1)}</span>
            <span style={{ color: "rgba(0,0,0,0.55)" }}>· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <article key={r.id} className="p-5 flex flex-col gap-2.5" style={{ backgroundColor: "#fff", boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold" style={{ color: "#000000" }}>{r.reviewer}</p>
                <Stars value={r.rating} />
              </div>
              {r.date && <p className="text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>{r.date}</p>}
              {r.text && <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{r.text}</p>}
              {r.reply && (
                <p className="text-xs leading-relaxed pl-3" style={{ color: "rgba(0,0,0,0.65)", borderLeft: "2px solid rgba(28,46,56,0.15)" }}>
                  <span className="font-semibold">Reply from the business:</span> {r.reply}
                </p>
              )}
              {r.sourceUrl && (
                <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold w-fit" style={{ color: "var(--leaf)" }}>
                  Read the original review ↗
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
