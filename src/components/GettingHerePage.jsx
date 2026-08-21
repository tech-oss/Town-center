import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { travelSections as sections, travelStats as stats, goodToKnow, carParks } from "../Data/gettingHere";

const quickNav = [
  { label: "Public Transport", href: "#transport" },
  { label: "Driving", href: "#driving" },
  { label: "Parking", href: "#parking" },
  { label: "Walking & Cycling", href: "#cycling" },
  { label: "Good to Know", href: "#good-to-know" },
];

export default function GettingHerePage() {
  const { hash } = useLocation();

  // Smooth-scroll to the anchored section when arriving via /getting-here#parking etc.
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [hash]);

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* ── Hero — same height/layout/typography treatment as the Explore
          "The Future" page hero (bottom-anchored, centered, hero-title
          typeface). ── */}
      <section className="relative w-full h-[70vh] min-h-[520px] flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16 overflow-hidden">
        <img src="/images/getting-here.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 50%, rgba(20,33,42,0.9) 100%)" }} />
        <span className="section-eyebrow relative mb-3" style={{ color: "var(--sage)" }}>Plan Your Visit</span>
        <h1 className="hero-title relative uppercase text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 text-white max-w-3xl" style={{ textShadow: "0 2px 24px rgba(0,0,0,0.4)" }}>
          Getting Here & Good to Know
        </h1>
        <p className="relative text-sm md:text-base max-w-xl leading-relaxed font-medium text-white" style={{ letterSpacing: "-0.01em" }}>
          By rail, road, bus or bicycle, getting to and around Maidenhead is easy — with the Elizabeth
          Line putting central London just 25 minutes away.
        </p>
      </section>

      {/* ── Breadcrumb — below the hero image, matching the Explore page. ── */}
      <nav className="max-w-6xl mx-auto px-6 md:px-12 pt-6 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
        <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
        <span className="mx-2 opacity-40">/</span>
        <span>Getting Here</span>
      </nav>

      {/* ── Quick nav ── */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(28,46,56,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex gap-2.5 overflow-x-auto py-3.5 scrollbar-none">
          {quickNav.map((q) => (
            <a
              key={q.href}
              href={q.href}
              onClick={(e) => scrollTo(e, q.href)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ backgroundColor: "var(--mint)", color: "#000000" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--leaf)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--mint)"; e.currentTarget.style.color = "var(--forest)"; }}
            >
              {q.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Travel stats band ── */}
      <section className="px-6 md:px-12 pt-12 md:pt-16">
        <div className="max-w-6xl mx-auto rounded-3xl px-6 py-10 md:py-12" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-4xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-sm mt-3 leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Alternating feature blocks ── */}
      <section className="px-6 md:px-12 pt-16 md:pt-24">
        <div className="max-w-6xl mx-auto flex flex-col gap-16 md:gap-24">
          {sections.map((sec, i) => (
            <div
              key={sec.id}
              id={sec.id}
              className={`scroll-mt-24 grid md:grid-cols-2 gap-8 md:gap-14 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              {sec.id === "transport" ? (
                <div className="flex flex-col gap-2">
                  <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-white shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                    {/* Free, no-API-key interactive public-transport map (OpenStreetMap / ÖPNVKarte)
                        showing Maidenhead's rail and bus routes — pan & zoom enabled. */}
                    <iframe
                      title="Maidenhead train & bus routes — interactive map"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7820%2C51.4880%2C-0.6560%2C51.5520&layer=transportmap&marker=51.5217%2C-0.7177"
                      loading="lazy"
                      className="w-full h-full border-0"
                    />
                  </div>
                  <a
                    href="https://www.openstreetmap.org/?mlat=51.5217&mlon=-0.7177#map=14/51.5217/-0.7177&layers=T"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-xs font-semibold hover:opacity-70 transition-opacity"
                    style={{ color: "var(--leaf)" }}
                  >
                    Open full transport map →
                  </a>
                </div>
              ) : sec.id === "driving" ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-white shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                    {/* Free, no-API-key interactive road map (OpenStreetMap) centred on
                        Maidenhead town centre — pan & zoom enabled. */}
                    <iframe
                      title="Maidenhead town centre — interactive location map"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-0.8000%2C51.4820%2C-0.6400%2C51.5600&layer=mapnik&marker=51.5217%2C-0.7177"
                      loading="lazy"
                      className="w-full h-full border-0"
                    />
                  </div>
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Maidenhead+Town+Centre%2C+Maidenhead"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 self-start px-6 py-3 rounded-full text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "var(--leaf)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Get Directions
                  </a>
                </div>
              ) : sec.id === "parking" ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-white shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                    {/* Free, no-API-key interactive map (OpenStreetMap) zoomed to the
                        town-centre car-park area; the chips below open turn-by-turn
                        directions to each car park from the visitor's location. */}
                    <iframe
                      title="Maidenhead town-centre car parks — interactive map"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7320%2C51.5140%2C-0.7060%2C51.5290&layer=mapnik&marker=51.5208%2C-0.7200"
                      loading="lazy"
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#000000" }}>
                      Navigate to the following car parks from your location:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {carParks.map((p) => (
                        <a
                          key={p.label}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                          style={{ backgroundColor: "var(--mint)", color: "#000000" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--leaf)"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--mint)"; e.currentTarget.style.color = "var(--forest)"; }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {p.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ) : sec.id === "cycling" ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-white shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                    {/* Free, no-API-key interactive cycle map (OpenStreetMap / OpenCycleMap)
                        showing cycle routes and paths around Maidenhead — pan & zoom enabled. */}
                    <iframe
                      title="Maidenhead cycle routes — interactive map"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7820%2C51.4880%2C-0.6560%2C51.5520&layer=cyclemap&marker=51.5217%2C-0.7177"
                      loading="lazy"
                      className="w-full h-full border-0"
                    />
                  </div>
                  <a
                    href="https://www.openstreetmap.org/#map=14/51.5217/-0.7177&layers=C"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-xs font-semibold hover:opacity-70 transition-opacity"
                    style={{ color: "var(--leaf)" }}
                  >
                    Open full cycle map →
                  </a>
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                  <img src={sec.image} alt={sec.heading} loading="lazy" className="w-full h-full object-cover" />
                </div>
              )}
              {/* On mobile the heading/intro comes first so each map sits with its
                  own section; desktop keeps the alternating left/right layout. */}
              <div className="order-first md:order-none">
                <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>{sec.eyebrow}</p>
                <h2 className="section-heading text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "#000000" }}>{sec.heading}</h2>
                <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "#000000" }}>{sec.intro}</p>
                <div className="flex flex-col divide-y" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
                  {sec.blocks.map((b) => (
                    <div key={b.title} className="py-3.5">
                      <h3 className="font-bold text-base mb-1" style={{ color: "#000000" }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{b.body}</p>
                    </div>
                  ))}
                </div>
                {sec.note && (
                  <p className="text-sm leading-relaxed mt-4 italic" style={{ color: "#000000" }}>{sec.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Good to know ── */}
      <section id="good-to-know" className="scroll-mt-24 px-6 md:px-12 pt-20 pb-24 mt-20" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Good to Know</p>
            <h2 className="section-heading text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "#000000" }}>Before You Visit</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>
              A few practical things worth knowing before you head into the town centre.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goodToKnow.map((g) => (
              <div key={g.id} id={g.id} className="scroll-mt-24 bg-white rounded-3xl p-7" style={{ boxShadow: "0 10px 40px -20px rgba(28,46,56,0.3)" }}>
                <h3 className="font-bold text-lg mb-3" style={{ color: "#000000" }}>{g.title}</h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: "#000000" }}>{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
