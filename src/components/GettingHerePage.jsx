import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// ── Authentic Maidenhead travel / good-to-know content ──
const sections = [
  {
    id: "transport",
    eyebrow: "By Train & Bus",
    heading: "Public Transport",
    intro:
      "Maidenhead is one of the best-connected towns in the Thames Valley, sitting on the Elizabeth Line with direct, frequent services into central London and out towards Reading.",
    blocks: [
      {
        title: "Elizabeth Line",
        body: "Direct trains run from Maidenhead station to London Paddington in around 25–30 minutes, continuing across central London to Liverpool Street, Canary Wharf and Abbey Wood without changing. Westbound services run to Twyford and Reading.",
      },
      {
        title: "Great Western Railway (GWR)",
        body: "GWR services also call at Maidenhead, with connections towards Reading and the West, and the branch line to Furze Platt, Cookham, Bourne End and Marlow (the Marlow Line).",
      },
      {
        title: "Buses",
        body: "Local bus services link the town centre with surrounding neighbourhoods, Maidenhead station and nearby towns. The main stops are a short walk from the High Street and Nicholsons Quarter.",
      },
    ],
  },
  {
    id: "driving",
    eyebrow: "By Car",
    heading: "Driving & Roads",
    intro:
      "Maidenhead is easily reached from the motorway and trunk-road network, making it a simple drive from London, Reading, Heathrow and the wider Thames Valley.",
    blocks: [
      {
        title: "From the M4",
        body: "Leave the M4 at Junction 8/9 (Maidenhead) and follow the A404(M) and A308(M) towards the town centre. Junction 7 (Slough West) also gives access via the A4.",
      },
      {
        title: "From the M40 & A404",
        body: "From the M40, the A404 links down through Marlow to Maidenhead, connecting to the M4 — a convenient route from High Wycombe and the north.",
      },
      {
        title: "Main routes",
        body: "The A4 (Bath Road), A308 (towards Windsor and the M4) and A4094 (towards Cookham) all feed directly into the town centre.",
      },
    ],
  },
  {
    id: "parking",
    eyebrow: "Where to Park",
    heading: "Parking",
    intro:
      "There are several town-centre car parks within a short walk of the shops, restaurants and the waterway — most are operated by the Royal Borough of Windsor & Maidenhead.",
    blocks: [
      {
        title: "Nicholsons Car Park",
        body: "Multi-storey parking in the heart of the town centre, directly serving Nicholsons Quarter, the High Street and the shopping area.",
      },
      {
        title: "Vicus Way & Hines Meadow",
        body: "Large multi-storey car parks close to Maidenhead station — ideal for commuters and for longer visits to the town centre.",
      },
      {
        title: "Broadway, West Street & Stafferton Way",
        body: "Additional surface and multi-storey parking around the town centre, with short-stay options handy for a quick shop or coffee.",
      },
    ],
    note:
      "Blue Badge holders can use designated accessible bays across the town-centre car parks. Always check on-site signage for the latest tariffs and opening times.",
  },
  {
    id: "cycling",
    eyebrow: "On Foot & By Bike",
    heading: "Walking & Cycling",
    intro:
      "Maidenhead town centre is compact and flat, making it easy to get around on foot, and there's a growing network of cycle routes linking the town with the river and surrounding villages.",
    blocks: [
      {
        title: "Cycle routes",
        body: "Signed cycle routes connect the town centre, the station and residential neighbourhoods, with quieter riverside paths towards Boulter's Lock and the Thames Path.",
      },
      {
        title: "The riverside",
        body: "The Thames Path runs alongside the river just east of the town, offering a scenic, traffic-free walking and cycling route towards Boulter's Lock, Ray Mill Island and beyond.",
      },
    ],
  },
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
    body: "Maidenhead station offers step-free access to all platforms, and the town centre is largely pedestrianised and level. Accessible parking bays, dropped kerbs and accessible toilets are available throughout the town centre. Many venues offer step-free entry — check individual business pages for details.",
  },
  {
    id: "maps",
    title: "Maps & Finding Your Way",
    body: "The town centre is easy to navigate on foot, with the High Street, Nicholsons Quarter and the regenerated waterway all within a few minutes' walk of one another. Use the Get Directions link on any business page to open turn-by-turn directions in your maps app.",
  },
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

  return (
    <div style={{ backgroundColor: "var(--sand)", minHeight: "100vh" }}>
      {/* Hero band */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-32 overflow-hidden"
        style={{ backgroundColor: "var(--forest)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 110%, rgba(47,164,164,0.28) 0%, transparent 70%)",
          }}
        />
        <span className="relative text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--sage)" }}>
          Plan Your Visit
        </span>
        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
          Getting Here & Good to Know
        </h1>
        <p className="relative text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: "var(--mint)" }}>
          By rail, road, bus or bicycle, getting to and around Maidenhead is easy — with the Elizabeth
          Line putting central London just 25 minutes away.
        </p>
      </section>

      {/* Body */}
      <section className="py-16 md:py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-12 text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--leaf)" }}>
            <Link to="/" className="hover:opacity-70 transition-opacity">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <span>Getting Here</span>
          </nav>

          <div className="flex flex-col gap-16">
            {sections.map((sec) => (
              <div key={sec.id} id={sec.id} className="scroll-mt-28">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>
                  {sec.eyebrow}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold mt-2 mb-4 leading-tight" style={{ color: "var(--forest)" }}>
                  {sec.heading}
                </h2>
                <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--ink)", opacity: 0.82 }}>
                  {sec.intro}
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {sec.blocks.map((b) => (
                    <div key={b.title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                      <h3 className="font-bold text-lg mb-2" style={{ color: "var(--forest)" }}>{b.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--ink)", opacity: 0.78 }}>{b.body}</p>
                    </div>
                  ))}
                </div>
                {sec.note && (
                  <p className="text-sm leading-relaxed mt-5 italic" style={{ color: "var(--forest)" }}>{sec.note}</p>
                )}
              </div>
            ))}

            {/* Good to know */}
            <div className="scroll-mt-28">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--leaf)" }}>
                Good to Know
              </span>
              <h2 className="text-2xl md:text-4xl font-bold mt-2 mb-8 leading-tight" style={{ color: "var(--forest)" }}>
                Before You Visit
              </h2>
              <div className="flex flex-col gap-5">
                {goodToKnow.map((g) => (
                  <div key={g.id} id={g.id} className="scroll-mt-28 bg-white rounded-2xl p-6 md:p-7" style={{ boxShadow: "0 6px 28px -16px rgba(28,46,56,0.28)" }}>
                    <h3 className="font-bold text-lg mb-2" style={{ color: "var(--forest)" }}>{g.title}</h3>
                    <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--ink)", opacity: 0.8 }}>{g.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
