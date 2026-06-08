// Reusable location map — embeds Google Maps (no API key required).
export default function LocationMap({ query, heading = "Location", note, rounded = true }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  return (
    <div>
      {heading && (
        <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--forest)" }}>{heading}</h2>
      )}
      {note && <p className="text-base mb-6" style={{ color: "var(--ink)", opacity: 0.7 }}>{note}</p>}
      <div className={`relative overflow-hidden aspect-[16/9] md:aspect-[21/9] ${rounded ? "rounded-3xl" : ""}`} style={{ boxShadow: "0 14px 50px -26px rgba(28,46,56,0.4)" }}>
        <iframe
          title={`Map showing ${query}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
}
