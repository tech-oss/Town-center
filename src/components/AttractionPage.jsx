import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { attractionBySlug } from "../Data/attractions";
import { itemBySlug } from "../Data/pages";
import LocationMap from "./LocationMap";

export default function AttractionPage() {
  const { slug } = useParams();
  const a = attractionBySlug[slug];
  const [active, setActive] = useState(0);

  useEffect(() => { window.scrollTo(0, 0); setActive(0); }, [slug]);
  if (!a) return <Navigate to="/" replace />;

  const gallery = a.gallery?.length ? a.gallery : [a.hero];
  const related = (a.related || []).map((s) => itemBySlug[s]).filter(Boolean);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.mapQuery)}`;

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Gallery hero (matches See & Do detail pages) ── */}
      <section className="px-6 md:px-12 pt-6 md:pt-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden aspect-[16/9] bg-black shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
            <img src={gallery[active]} alt={a.title} className="w-full h-full object-cover" />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-none">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`}
                  className="shrink-0 w-24 h-16 md:w-28 md:h-20 rounded-xl overflow-hidden border-2 transition-all"
                  style={{ borderColor: i === active ? "var(--sage)" : "transparent", opacity: i === active ? 1 : 0.7 }}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Body + sidebar ── */}
      <section className="py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
          {/* Main */}
          <div>
            {/* Breadcrumb */}
            <nav className="mb-5 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
              <Link to="/" className="hover:opacity-70">Home</Link>
              <span className="mx-2 opacity-40">/</span>
              <Link to="/see-do" className="hover:opacity-70">See &amp; Do</Link>
              <span className="mx-2 opacity-40">/</span>
              <span style={{ color: "var(--forest)" }}>Boulter's Lock</span>
            </nav>

            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>{a.eyebrow}</span>
            <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-5 leading-tight" style={{ color: "var(--forest)" }}>{a.title}</h1>
            {a.subtitle && (
              <p className="text-lg md:text-xl leading-relaxed mb-8" style={{ color: "var(--ink)", opacity: 0.7 }}>{a.subtitle}</p>
            )}

            {/* Intro paragraphs */}
            <div className="flex flex-col gap-5">
              {a.intro?.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>{p}</p>
              ))}
            </div>

            {/* Sections (heading + optional image + paras) */}
            {a.sections?.map((sec, si) => (
              <div key={si} className="mt-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>{sec.heading}</h2>
                {sec.image && (
                  <div className="rounded-3xl overflow-hidden aspect-[16/9] mb-6 shadow-[0_14px_50px_-26px_rgba(28,46,56,0.4)]">
                    <img src={sec.image} alt={sec.heading} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-5">
                  {sec.paras.map((p, pi) => (
                    <p key={pi} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 self-start flex flex-col gap-6">
            {a.highlights?.length > 0 && (
              <div className="rounded-3xl p-7" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--leaf)" }}>Highlights</h3>
                <ul className="flex flex-col gap-2.5">
                  {a.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--ink)", opacity: 0.82 }}>
                      <span style={{ color: "var(--sage)" }}>✓</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-3xl p-7" style={{ backgroundColor: "#fff", boxShadow: "0 10px 40px -22px rgba(28,46,56,0.3)" }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--leaf)" }}>Find It</h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--ink)", opacity: 0.82 }}>{a.address}</p>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
                className="block text-center py-3 rounded-full font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--leaf)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}>
                Get Directions
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Map ── */}
      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <LocationMap heading="Location" note={a.address} query={a.mapQuery} />
        </div>
      </section>

      {/* ── You might like ── */}
      {related.length > 0 && (
        <section className="pb-20 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "var(--forest)" }}>You might like</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {related.map((it) => (
                <Link key={it.slug} to={`/${it.section}/place/${it.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>{it.tag}</span>
                    <h3 className="font-bold text-xl leading-snug" style={{ color: "var(--forest)" }}>{it.name}</h3>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-1" style={{ color: "var(--forest)" }}>
                      Read more <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
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
