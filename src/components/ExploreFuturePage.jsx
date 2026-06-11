import { useEffect } from "react";
import { Link } from "react-router-dom";
import { explore } from "../Data/explore";

const devTagColors = {
  "Town Centre Regeneration": { bg: "#FDE2E1", text: "#B3261E" },
  "Riverside & Station Edge": { bg: "#D6ECFB", text: "#1F6FA8" },
  "South-West Growth": { bg: "#DCF4E3", text: "#1E7A45" },
  "Employment & Industrial": { bg: "#E7E1F7", text: "#5B3FA0" },
  "Office & Business": { bg: "#FFF0D6", text: "#9A6B12" },
};

export default function ExploreFuturePage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "70vh" }}>
        <img src={explore.hero.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.9) 100%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end" style={{ minHeight: "70vh", paddingTop: "6rem", paddingBottom: "3.5rem" }}>
          <nav className="mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--sage)" }}>
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">Explore</span>
          </nav>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--sage)" }}>{explore.hero.eyebrow}</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.05] max-w-3xl">{explore.hero.title}</h1>
          <p className="text-xl md:text-2xl text-white/90 mt-4 max-w-2xl" style={{ fontFamily: "var(--font-heading)" }}>{explore.hero.subtitle}</p>
          <p className="text-base md:text-lg text-white/75 mt-4 max-w-2xl leading-relaxed">{explore.hero.lead}</p>
        </div>
      </section>

      {/* ── Vision ── */}
      <section id="nicholson" className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>The Vision</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: "var(--forest)" }}>A bold vision for the heart of town</h2>
          <div className="flex flex-col gap-5">
            {explore.vision.map((p, i) => (
              <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{p}</p>
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
              <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                <img src={f.image} alt={f.heading} loading="lazy" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>{f.eyebrow}</p>
                <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>{f.heading}</h2>
                <div className="flex flex-col gap-4">
                  {f.body.map((p, bi) => (
                    <p key={bi} className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{p}</p>
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
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>{explore.masterplan.eyebrow}</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>{explore.masterplan.heading}</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{explore.masterplan.body}</p>
          </div>
          <div className="rounded-3xl overflow-hidden bg-white p-2 md:p-3 shadow-[0_24px_60px_-28px_rgba(28,46,56,0.45)]">
            <img src={explore.masterplan.image} alt="Nicholson Quarter masterplan" loading="lazy" className="w-full h-auto rounded-2xl" />
          </div>
        </div>
      </section>

      {/* ── Major developments map + grid ── */}
      <section id="developments" className="pb-20 px-6 md:px-12" style={{ backgroundColor: "var(--mint)" }}>
        <div className="max-w-6xl mx-auto pt-16 md:pt-20">
          <div className="max-w-2xl mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>{explore.developments.eyebrow}</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>{explore.developments.heading}</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>{explore.developments.intro}</p>
          </div>
          <div className="rounded-3xl overflow-hidden bg-white p-2 md:p-3 mb-10 shadow-[0_24px_60px_-28px_rgba(28,46,56,0.45)]">
            <img src={explore.developments.image} alt="Map of major current and planned developments in Maidenhead" loading="lazy" className="w-full h-auto rounded-2xl" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {explore.developments.items.map((d) => {
              const c = devTagColors[d.tag] ?? { bg: "#E5E7EB", text: "#374151" };
              return (
                <div key={d.title} className="bg-white rounded-2xl p-5 flex flex-col" style={{ boxShadow: "0 6px 24px -16px rgba(28,46,56,0.25)" }}>
                  <span className="self-start text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: c.bg, color: c.text }}>{d.tag}</span>
                  <h3 className="font-bold text-base leading-snug mb-2" style={{ color: "var(--forest)" }}>{d.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.7 }}>{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Community ── */}
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>Your Town, Your Future</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: "var(--forest)" }}>{explore.community.heading}</h2>
          <p className="text-lg md:text-xl leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82, fontFamily: "var(--font-heading)" }}>{explore.community.body}</p>
        </div>
      </section>

      {/* ── Closing ── */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden relative">
          <img src="/images/explore/evening.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(20,33,42,0.92), rgba(31,155,181,0.82))" }} />
          <div className="relative z-10 px-8 md:px-14 py-14 md:py-20 max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">{explore.closing.heading}</h2>
            <div className="flex flex-col gap-4">
              {explore.closing.body.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed text-white/85">{p}</p>
              ))}
            </div>
            <Link to="/live" className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full font-semibold transition-transform hover:scale-105" style={{ backgroundColor: "var(--sage)", color: "var(--forest)" }}>
              Discover living in Maidenhead <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
