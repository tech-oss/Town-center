import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { itemBySlug, sections } from "../Data/pages";
import NewsOffers from "./NewsOffers";
import LocationMap from "./LocationMap";

export default function DetailPage() {
  const { section, slug } = useParams();
  const item = itemBySlug[slug];
  const [active, setActive] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActive(0);
  }, [slug]);

  if (!item) return <Navigate to="/" replace />;
  const sec = sections[item.section];

  // Related items from the same category (excluding this one)
  // Prefer same-category venues, then top up with others from the section so
  // "You might also like" always shows a full set of relevant listings.
  const sameCat = sec.items.filter((i) => i.category === item.category && i.slug !== item.slug);
  const others = sec.items.filter((i) => i.category !== item.category && i.slug !== item.slug);
  const related = [...sameCat, ...others].slice(0, 3);

  // Map / directions target — prefer an explicit query, else the business name + town
  const mapQuery = item.mapQuery || `${item.name}, Maidenhead`;

  // Social sharing (uses the live page URL)
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(`${item.name} — Maidenhead`);
  const shareLinks = [
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: "facebook" },
    { label: "Share on X", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, icon: "x" },
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, icon: "whatsapp" },
    { label: "Share by email", href: `mailto:?subject=${t}&body=${u}`, icon: "email" },
  ];
  const copyLink = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(shareUrl);
  };
  const ShareIcon = ({ name }) => {
    const p = { width: 16, height: 16, viewBox: "0 0 24 24" };
    if (name === "facebook") return (<svg {...p} fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5z" /></svg>);
    if (name === "x") return (<svg {...p} fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.3-5.6L6.3 21H3.3l7-8L2.6 3h6.1l3.9 5.1L17.5 3zm-2.1 16h1.6L8.7 4.7H7L15.4 19z" /></svg>);
    if (name === "whatsapp") return (<svg {...p} fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.5c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.5 10a4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6.1c.5-.1 1.4-.6 1.6-1.1s.2-1 .1-1.1-.3-.2-.5-.3z" /></svg>);
    if (name === "email") return (<svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
    return (<svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>);
  };

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Gallery hero ── */}
      {/* Contained 16:9 frame matching the photos' native ratio, so cover photos
          display in full with no corner/edge cropping on web or mobile. */}
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            <img src={item.gallery[active]} alt={item.name} className="w-full h-full object-cover" />
          </div>
          {/* Thumbnails */}
          {item.gallery.length > 1 && (
            <div className="flex gap-3 mt-3 pb-1 overflow-x-auto scrollbar-none">
              {item.gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className="shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: i === active ? "var(--sage)" : "transparent", opacity: i === active ? 1 : 0.7 }}
                >
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Body ── */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to={sec.path} className="hover:opacity-70 transition-opacity">{sec.label}</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to={`/${item.section}/category/${item.category}`} className="hover:opacity-70 transition-opacity">{item.tag}</Link>
          </nav>

          <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
            {/* Main column */}
            <div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>
                {item.tag}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-6 leading-tight" style={{ color: "var(--forest)" }}>
                {item.name}
              </h1>
              {item.paragraphs ? (
                <div className="flex flex-col gap-5">
                  {item.paragraphs.map((p, i) => (
                    <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{p}</p>
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>
                    {item.description}
                  </p>
                  {item.description2 && (
                    <p className="text-base leading-relaxed mt-5" style={{ color: "var(--ink)", opacity: 0.82 }}>
                      {item.description2}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Info sidebar */}
            <aside className="lg:sticky lg:top-28 self-start">
              <div className="bg-white rounded-3xl p-7 flex flex-col gap-6" style={{ boxShadow: "0 10px 40px -20px rgba(28,46,56,0.3)" }}>
                {/* Opening hours */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--leaf)" }}>Opening Hours</h3>
                  <ul className="flex flex-col gap-1.5">
                    {item.hours.map((h) => (
                      <li key={h.day} className="flex justify-between text-sm">
                        <span style={{ color: "var(--ink)", opacity: 0.7 }}>{h.day}</span>
                        <span className="font-semibold" style={{ color: "var(--forest)" }}>{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="h-px" style={{ backgroundColor: "rgba(28,46,56,0.1)" }} />

                {/* Location & contact */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--leaf)" }}>Find Us</h3>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--ink)", opacity: 0.8 }}>{item.address}</p>
                  {item.phone && item.phone !== "—" && (
                    <p className="text-sm" style={{ color: "var(--ink)", opacity: 0.8 }}>
                      <span className="font-semibold" style={{ color: "var(--forest)" }}>Tel:</span> {item.phone}
                    </p>
                  )}
                  {item.email && (
                    <p className="text-sm" style={{ color: "var(--ink)", opacity: 0.8 }}>
                      <span className="font-semibold" style={{ color: "var(--forest)" }}>Email:</span> {item.email}
                    </p>
                  )}
                  <p className="text-sm" style={{ color: "var(--ink)", opacity: 0.8 }}>
                    <span className="font-semibold" style={{ color: "var(--forest)" }}>Web:</span> {item.website}
                  </p>
                </div>

                {/* Actions */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-3 rounded-full font-semibold text-white transition-colors"
                  style={{ backgroundColor: "var(--leaf)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
                >
                  Get Directions
                </a>
                <a href="#app" className="block text-center py-3 rounded-full font-semibold transition-colors" style={{ border: "1.5px solid var(--forest)", color: "var(--forest)" }}>
                  Get the App
                </a>

                {/* Share */}
                <div className="pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--leaf)" }}>Share</h3>
                  <div className="flex items-center gap-2.5">
                    {shareLinks.map((s) => (
                      <a
                        key={s.icon}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        title={s.label}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--leaf)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--mint)"; e.currentTarget.style.color = "var(--forest)"; }}
                      >
                        <ShareIcon name={s.icon} />
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={copyLink}
                      aria-label="Copy link"
                      title="Copy link"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--leaf)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--mint)"; e.currentTarget.style.color = "var(--forest)"; }}
                    >
                      <ShareIcon name="copy" />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

        </div>
      </section>

      {/* ── Location map ── */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Location" note={item.address} query={mapQuery} />
        </div>
      </section>

      {/* ── Per-business News & Offers (unique to this place) ── */}
      <NewsOffers item={item} />

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>You might also like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {related.map((it) => (
                <Link
                  key={it.slug}
                  to={`/${it.section}/place/${it.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>{it.tag}</span>
                    <h3 className="font-bold text-xl leading-snug" style={{ color: "var(--forest)" }}>{it.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
