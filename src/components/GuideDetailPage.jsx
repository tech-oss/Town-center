import { Link, useParams, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { getGuideBySlug, guides } from "../Data/guides";

function PlaceSection({ s, index }) {
  const reversed = index % 2 === 1;
  return (
    <div id={s.id} className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${reversed ? "md:[&>*:first-child]:order-2" : ""}`}>
      <div className="overflow-hidden aspect-[4/3] shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
        <img src={s.image} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3 flex items-center gap-2" style={{ color: "var(--leaf)" }}>
          <span className="text-base">{s.icon}</span> {s.eyebrow}
        </p>
        <h2 className="text-2xl md:text-4xl font-bold mb-2 leading-tight" style={{ color: "#000000" }}>{s.title}</h2>
        <p className="text-sm font-semibold mb-4" style={{ color: "#000000" }}>{s.location}</p>
        <div className="flex flex-col gap-4 mb-5">
          {s.body.map((p, i) => (
            <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{p}</p>
          ))}
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--sand)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>
            <span className="font-bold">Try it for:</span> {s.tryItFor}
          </p>
        </div>
        {(s.address || s.phone) && (
          <p className="text-xs mt-4 leading-relaxed" style={{ color: "rgba(0,0,0,0.6)" }}>
            {s.address}{s.address && s.phone ? " · " : ""}{s.phone}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GuideDetailPage() {
  const { slug } = useParams();
  const guide = getGuideBySlug(slug);
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!guide) return <Navigate to="/guides" replace />;

  const related = guides.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* Hero */}
      <section className="relative w-full h-[70vh] min-h-[520px] flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden">
        <img src={guide.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.9) 100%)" }} />
        <span className="relative text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--sage)" }}>{guide.category}</span>
        <h1 className="hero-title relative uppercase text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 text-white max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          {guide.title}
        </h1>
        <p className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
          {guide.summary}
        </p>
      </section>

      {/* Breadcrumb */}
      <nav className="max-w-3xl mx-auto px-6 md:px-12 pt-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
        <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
        <span className="mx-2 opacity-40">/</span>
        <Link to="/guides" className="hover:opacity-70 transition-opacity">Neighbourhood Guides</Link>
        <span className="mx-2 opacity-40">/</span>
        <span>{guide.title}</span>
      </nav>

      {/* Intro */}
      <section className="pt-8 md:pt-10 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {guide.intro.map((p, i) => (
            <p key={i} className={`leading-relaxed ${i === 0 ? "text-lg md:text-xl font-medium" : "text-base md:text-lg"}`} style={{ color: "#000000" }}>{p}</p>
          ))}
        </div>
      </section>

      {/* Place sections */}
      <section className="px-6 md:px-12 pb-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-16 md:gap-24">
          {guide.sections.map((s, i) => (
            <PlaceSection key={s.id} s={s} index={i} />
          ))}
        </div>
      </section>

      {/* More spots worth knowing */}
      {guide.moreSpots && (
        <section className="py-16 md:py-24 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 leading-tight" style={{ color: "#000000" }}>{guide.moreSpots.heading}</h2>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{guide.moreSpots.intro}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {guide.moreSpots.items.map((it) => (
                <div key={it.title} className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
                  <h3 className="font-bold text-base leading-snug mb-1" style={{ color: "#000000" }}>{it.title}</h3>
                  {it.location && <p className="text-xs font-semibold uppercase tracking-[0.02em] mb-2" style={{ color: "var(--leaf)" }}>{it.location}</p>}
                  <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{it.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cheat sheet */}
      {guide.cheatSheet && (
        <section className="px-6 md:px-12 pb-16 md:pb-20">
          <div className="max-w-6xl mx-auto rounded-3xl px-6 py-10 md:py-12" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">{guide.cheatSheet.heading}</h2>
            <p className="text-sm text-center mb-8" style={{ color: "rgba(255,255,255,0.78)" }}>{guide.cheatSheet.intro}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guide.cheatSheet.items.map((it) => (
                <div key={it.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <span className="text-xl shrink-0">{it.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{it.label}</p>
                    <p className="font-bold text-white leading-snug truncate">{it.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Combinations */}
      {guide.combinations && (
        <section className="py-16 md:py-24 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>Make a Morning of It</p>
              <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "#000000" }}>{guide.combinations.heading}</h2>
              <p className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{guide.combinations.intro}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {guide.combinations.items.map((c) => (
                <div key={c.title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{c.icon}</span>
                    <h3 className="font-bold text-base leading-snug" style={{ color: "#000000" }}>{c.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing */}
      {guide.closing && (
        <section className="px-6 md:px-12 pb-16 md:pb-20">
          <div className="max-w-6xl mx-auto overflow-hidden relative">
            <img src={guide.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(20,33,42,0.92), rgba(31,155,181,0.82))" }} />
            <div className="relative z-10 px-8 md:px-14 py-14 md:py-20 max-w-3xl">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight">{guide.closing.heading}</h2>
              <div className="flex flex-col gap-4">
                {guide.closing.body.map((p, i) => (
                  <p key={i} className="text-base md:text-lg leading-relaxed text-white/85">{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related guides */}
      {related.length > 0 && (
        <section className="px-6 md:px-12 pb-20 md:pb-28">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>More Maidenhead Guides</p>
            <h2 className="text-2xl md:text-4xl font-bold mb-8 leading-tight" style={{ color: "#000000" }}>Keep exploring</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((g) => (
                <Link key={g.slug} to={`/guides/${g.slug}`} className="group flex flex-col overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1" style={{ borderRadius: "0px", boxShadow: "0 10px 32px -18px rgba(28,46,56,0.35)" }}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={g.cardImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <h3 className="listing-card-title text-lg leading-snug mb-2" style={{ color: "#000000" }}>{g.title}</h3>
                    <span className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: "#000000" }}>Read the guide <span>→</span></span>
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
