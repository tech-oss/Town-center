import { useEffect } from "react";
import { Link } from "react-router-dom";
import { explore } from "../Data/explore";

export default function ExploreFuturePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* ── Hero — same height/layout/typography treatment as the Offers
          page hero (bottom-anchored, centered, hero-title typeface), just
          keeping this page's own background image and copy. ── */}
      <section
        className="relative w-full h-[70vh] min-h-[520px] flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden"
      >
        <img src={explore.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.9) 100%)" }} />
        <span className="relative text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--sage)" }}>{explore.hero.eyebrow}</span>
        <h1 className="hero-title relative uppercase text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 text-white max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          {explore.hero.title}
        </h1>
        <p className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium mb-2 text-white" style={{ letterSpacing: "-0.01em" }}>
          {explore.hero.subtitle}
        </p>
        <p className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
          {explore.hero.lead}
        </p>
      </section>

      {/* ── Breadcrumb — below the hero image, matching the Offers page. ── */}
      <nav className="max-w-3xl mx-auto px-6 md:px-12 pt-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
        <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
        <span className="mx-2 opacity-40">/</span>
        <span>Explore</span>
      </nav>

      {/* ── Vision ── */}
      <section id="nicholson" className="pt-8 md:pt-10 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>The Vision</p>
          <h2 className="hero-title uppercase text-3xl md:text-6xl mb-6" style={{ color: "#000000" }}>A bold vision for the heart of town</h2>
          <div className="flex flex-col gap-5">
            {explore.vision.map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ── */}
      <section className="px-6 md:px-12 pb-16 md:pb-20">
        <div className="max-w-6xl mx-auto rounded-3xl px-6 py-10 md:py-12" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {explore.stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl md:text-5xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-sm mt-3 leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Alternating feature blocks ── */}
      <section className="px-6 md:px-12 pb-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-16 md:gap-24">
          {explore.features.map((f, i) => (
            <div key={f.id} id={f.id} className={`grid md:grid-cols-2 gap-8 md:gap-14 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="overflow-hidden aspect-[4/3] shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                <img src={f.image} alt={f.heading} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>{f.eyebrow}</p>
                <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "#000000" }}>{f.heading}</h2>
                <div className="flex flex-col gap-4">
                  {f.body.map((p, bi) => (
                    <p key={bi} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Masterplan ── */}
      <section id="masterplan" className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>{explore.masterplan.eyebrow}</p>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "#000000" }}>{explore.masterplan.heading}</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{explore.masterplan.body}</p>
          </div>
          <div className="overflow-hidden bg-white p-2 md:p-3 mb-10 shadow-[0_24px_60px_-28px_rgba(28,46,56,0.45)]">
            <img src={explore.masterplan.image} alt="Nicholson Quarter masterplan" loading="lazy" className="w-full h-auto" />
          </div>

          {/* Numbered key to the masterplan — one card per marked location. */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {explore.masterplan.locations.map((loc) => (
              <div key={loc.number} className="bg-white rounded-2xl p-5 flex flex-col" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}
                  >
                    {loc.number}
                  </span>
                  <h3 className="font-bold text-base leading-snug" style={{ color: "#000000" }}>{loc.title}</h3>
                </div>
                {loc.tagline && (
                  <p className="text-xs font-semibold uppercase tracking-[0.02em] mb-2" style={{ color: "var(--leaf)" }}>{loc.tagline}</p>
                )}
                <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{loc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community ── */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-[0.02em] uppercase mb-3" style={{ color: "var(--leaf)" }}>Your Town, Your Future</p>
          <h2 className="text-2xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: "#000000" }}>{explore.community.heading}</h2>
          <p className="text-lg md:text-xl leading-relaxed" style={{ color: "#000000", fontFamily: "var(--font-heading)" }}>{explore.community.body}</p>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-6xl mx-auto overflow-hidden relative">
          <img src="/images/explore/evening.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(20,33,42,0.92), rgba(31,155,181,0.82))" }} />
          <div className="relative z-10 px-8 md:px-14 py-14 md:py-20 max-w-3xl">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight">{explore.closing.heading}</h2>
            <div className="flex flex-col gap-4">
              {explore.closing.body.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed text-white/85">{p}</p>
              ))}
            </div>
            <Link to="/live" className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full font-semibold transition-transform hover:scale-105" style={{ backgroundColor: "var(--sage)", color: "#000000" }}>
              Discover living in Maidenhead <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
