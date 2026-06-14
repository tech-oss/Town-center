import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

// ── Authentic Maidenhead travel / good-to-know content ──
const sections = [
  {
    id: "transport",
    eyebrow: "By Train & Bus",
    heading: "Public Transport",
    image: "/images/getting-here.jpg",
    intro:
      "Maidenhead is one of the best-connected towns in the Thames Valley, sitting on the Elizabeth Line with direct, frequent services into central London and out towards Reading.",
    blocks: [
      {
        title: "Elizabeth Line",
        body: "Direct trains to London Paddington in around 25–30 minutes, continuing across central London to Liverpool Street, Canary Wharf and Abbey Wood without changing. Westbound services run to Twyford and Reading.",
      },
      {
        title: "Great Western Railway",
        body: "GWR services also call at Maidenhead, with connections towards Reading and the West, plus the branch line to Furze Platt, Cookham, Bourne End and Marlow.",
      },
      {
        title: "Buses",
        body: "Local bus services link the town centre with surrounding neighbourhoods, the station and nearby towns. Main stops are a short walk from the High Street.",
      },
    ],
  },
  {
    id: "driving",
    eyebrow: "By Car",
    heading: "Driving & Roads",
    image: "/images/card-bridge.jpg",
    intro:
      "Maidenhead is easily reached from the motorway and trunk-road network, making it a simple drive from London, Reading, Heathrow and the wider Thames Valley.",
    blocks: [
      {
        title: "From the M4",
        body: "Leave at Junction 8/9 (Maidenhead) and follow the A404(M) and A308(M) into the town centre. Junction 7 (Slough West) also gives access via the A4.",
      },
      {
        title: "From the M40 & A404",
        body: "The A404 links down through Marlow to Maidenhead and the M4 — a convenient route from High Wycombe and the north.",
      },
      {
        title: "Main routes",
        body: "The A4 (Bath Road), A308 (towards Windsor) and A4094 (towards Cookham) all feed directly into the town centre.",
      },
    ],
  },
  {
    id: "parking",
    eyebrow: "Where to Park",
    heading: "Parking",
    image: "/images/ql-parking.jpg",
    intro:
      "There are several town-centre car parks within a short walk of the shops, restaurants and the waterway — most operated by the Royal Borough of Windsor & Maidenhead.",
    blocks: [
      {
        title: "Nicholsons Car Park",
        body: "Multi-storey parking in the heart of the town centre, directly serving Nicholsons Quarter, the High Street and the shopping area.",
      },
      {
        title: "Vicus Way & Hines Meadow",
        body: "Large multi-storey car parks close to the station — ideal for commuters and longer visits to the town centre.",
      },
      {
        title: "Broadway, West Street & Stafferton Way",
        body: "Additional surface and multi-storey parking, with short-stay options handy for a quick shop or coffee.",
      },
    ],
    note:
      "Blue Badge holders can use designated accessible bays across the town-centre car parks. Always check on-site signage for the latest tariffs and opening times.",
  },
  {
    id: "cycling",
    eyebrow: "On Foot & By Bike",
    heading: "Walking & Cycling",
    image: "/images/slide-river.jpg",
    intro:
      "The town centre is compact and flat, making it easy to get around on foot, with a growing network of cycle routes linking the town with the river and surrounding villages.",
    blocks: [
      {
        title: "Cycle routes",
        body: "Signed cycle routes connect the town centre, the station and residential neighbourhoods, with quieter riverside paths towards Boulter's Lock and the Thames Path.",
      },
      {
        title: "The riverside",
        body: "The Thames Path runs alongside the river just east of the town — a scenic, traffic-free walking and cycling route towards Boulter's Lock, Ray Mill Island and beyond.",
      },
    ],
  },
];

const stats = [
  { value: "~25 min", label: "To London Paddington" },
  { value: "Elizabeth", label: "Line & GWR services" },
  { value: "6+", label: "Town-centre car parks" },
  { value: "M4 J8/9", label: "Direct motorway access" },
];

const goodToKnow = [
  {
    id: "opening-hours",
    title: "Opening Hours",
    body: "Most shops in the town centre open from around 9am to 5:30pm, Monday to Saturday, with reduced hours on Sundays. Cafés, bars and restaurants keep their own hours, often staying open later into the evening. Individual opening times are listed on each business page.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: "Maidenhead station offers step-free access to all platforms, and the town centre is largely pedestrianised and level. Accessible parking bays, dropped kerbs and accessible toilets are available throughout. Many venues offer step-free entry — check individual business pages for details.",
  },
  {
    id: "maps",
    title: "Maps & Finding Your Way",
    body: "The town centre is easy to navigate on foot, with the High Street, Nicholsons Quarter and the regenerated waterway all within a few minutes' walk of one another. Use the Get Directions link on any business page to open turn-by-turn directions in your maps app.",
  },
];

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
    <div style={{ backgroundColor: "var(--sand)" }}>
      {/* ── Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "62vh" }}>
        <img src="/images/getting-here.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(20,33,42,0.45) 0%, rgba(20,33,42,0.55) 45%, rgba(20,33,42,0.9) 100%)" }}
        />
        <div
          className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-end"
          style={{ minHeight: "62vh", paddingTop: "6rem", paddingBottom: "3rem" }}
        >
          <nav className="mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--sage)" }}>
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-white">Getting Here</span>
          </nav>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--sage)" }}>
            Plan Your Visit
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.05] max-w-3xl">
            Getting Here & Good to Know
          </h1>
          <p className="text-base md:text-lg text-white/80 mt-4 max-w-2xl leading-relaxed">
            By rail, road, bus or bicycle, getting to and around Maidenhead is easy — with the Elizabeth
            Line putting central London just 25 minutes away.
          </p>
        </div>
      </section>

      {/* ── Quick nav ── */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(28,46,56,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex gap-2.5 overflow-x-auto py-3.5 scrollbar-none">
          {quickNav.map((q) => (
            <a
              key={q.href}
              href={q.href}
              onClick={(e) => scrollTo(e, q.href)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}
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
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--ink)", opacity: 0.6 }}>
                      Navigate from your location:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Nicholsons", q: "Nicholsons Car Park, Maidenhead" },
                        { label: "Vicus Way", q: "Vicus Way Car Park, Maidenhead" },
                        { label: "Hines Meadow", q: "Hines Meadow Car Park, Maidenhead" },
                        { label: "Stafferton Way", q: "Stafferton Way Car Park, Maidenhead" },
                      ].map((p) => (
                        <a
                          key={p.label}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.q)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors"
                          style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}
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
              ) : (
                <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-[0_24px_60px_-28px_rgba(28,46,56,0.5)]">
                  <img src={sec.image} alt={sec.heading} loading="lazy" className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>{sec.eyebrow}</p>
                <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>{sec.heading}</h2>
                <p className="text-base md:text-lg leading-relaxed mb-6" style={{ color: "var(--ink)", opacity: 0.82 }}>{sec.intro}</p>
                <div className="flex flex-col divide-y" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
                  {sec.blocks.map((b) => (
                    <div key={b.title} className="py-3.5">
                      <h3 className="font-bold text-base mb-1" style={{ color: "var(--forest)" }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.72 }}>{b.body}</p>
                    </div>
                  ))}
                </div>
                {sec.note && (
                  <p className="text-sm leading-relaxed mt-4 italic" style={{ color: "var(--forest)" }}>{sec.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Good to know ── */}
      <section id="good-to-know" className="scroll-mt-24 px-6 md:px-12 pt-20 pb-24 mt-20" style={{ backgroundColor: "var(--mint)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--leaf)" }}>Good to Know</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: "var(--forest)" }}>Before You Visit</h2>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.82 }}>
              A few practical things worth knowing before you head into the town centre.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goodToKnow.map((g) => (
              <div key={g.id} id={g.id} className="scroll-mt-24 bg-white rounded-3xl p-7" style={{ boxShadow: "0 10px 40px -20px rgba(28,46,56,0.3)" }}>
                <h3 className="font-bold text-lg mb-3" style={{ color: "var(--forest)" }}>{g.title}</h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--ink)", opacity: 0.78 }}>{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
