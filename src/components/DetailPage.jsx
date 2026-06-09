import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { itemBySlug, sections } from "../Data/pages";
import NewsOffers from "./NewsOffers";

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
  const related = sec.items.filter((i) => i.category === item.category && i.slug !== item.slug).slice(0, 3);

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

              {/* Share row */}
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <span className="text-sm font-semibold" style={{ color: "var(--forest)" }}>Share:</span>
                {["Copy link", "Email", "Facebook", "X / Twitter"].map((s) => (
                  <button
                    key={s}
                    className="px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                    style={{ backgroundColor: "#fff", color: "var(--forest)", boxShadow: "0 4px 14px -8px rgba(28,46,56,0.35)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
                  href="#maps"
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
              </div>
            </aside>
          </div>

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
