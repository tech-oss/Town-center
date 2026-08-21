import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { travelSections, travelStats, goodToKnow } from "../../Data/gettingHere";

// The website's own Getting Here content, laid out natively. Parking has its
// own dedicated screen, so it is linked to rather than repeated here.
const sections = travelSections.filter((s) => s.id !== "parking");

const MAPS = {
  transport: {
    src: "https://www.openstreetmap.org/export/embed.html?bbox=-0.7820%2C51.4880%2C-0.6560%2C51.5520&layer=transportmap&marker=51.5217%2C-0.7177",
    title: "Maidenhead train & bus routes",
  },
  driving: {
    src: "https://www.openstreetmap.org/export/embed.html?bbox=-0.8000%2C51.4820%2C-0.6400%2C51.5600&layer=mapnik&marker=51.5217%2C-0.7177",
    title: "Maidenhead town centre",
  },
  cycling: {
    src: "https://www.openstreetmap.org/export/embed.html?bbox=-0.7820%2C51.4880%2C-0.6560%2C51.5520&layer=cyclemap&marker=51.5217%2C-0.7177",
    title: "Maidenhead cycle routes",
  },
};

export default function TransportScreen() {
  return (
    <MobileShell title="Getting Here" onBack noPadding>
      <div className="flex flex-col">
        {/* Hero */}
        <div className="relative">
          <img src="/images/getting-here.jpg" alt="" className="w-full h-52 object-cover" />
        </div>

        <div className="px-5 pt-5 pb-8 flex flex-col gap-6 mobile-stagger">
          <div>
            <p className="section-eyebrow mb-2" style={{ color: "var(--teal-deep)" }}>Plan Your Visit</p>
            <h1 className="text-2xl font-bold leading-tight mb-2" style={{ color: "#000000" }}>
              Getting Here &amp; Good to Know
            </h1>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>
              By rail, road, bus or bicycle, getting to and around Maidenhead is easy — with the
              Elizabeth Line putting central London just 25 minutes away.
            </p>
          </div>

          {/* Travel stats band */}
          <div className="rounded-2xl px-5 py-6 grid grid-cols-2 gap-5 text-center" style={{ background: "linear-gradient(135deg, var(--forest), var(--teal-deep))" }}>
            {travelStats.map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-[11px] mt-2 leading-snug font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Parking signpost — parking lives on its own screen. */}
          <Link
            to="/mobile/parking"
            className="flex items-center gap-3 p-4 rounded-2xl active:opacity-85"
            style={{ backgroundColor: "var(--mint)" }}
          >
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--forest)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 18V6h4.5a3.5 3.5 0 0 1 0 7H8" /></svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-bold" style={{ color: "#000000" }}>Parking in Maidenhead</span>
              <span className="block text-xs font-medium mt-0.5" style={{ color: "#000000" }}>Car parks, tariffs & directions</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </Link>

          {sections.map((sec) => (
            <div key={sec.id} className="flex flex-col gap-3">
              <div>
                <p className="section-eyebrow mb-1.5" style={{ color: "var(--teal-deep)" }}>{sec.eyebrow}</p>
                <h2 className="text-xl font-bold leading-tight mb-2" style={{ color: "#000000" }}>{sec.heading}</h2>
                <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>{sec.intro}</p>
              </div>

              {MAPS[sec.id] && (
                <div className="rounded-2xl overflow-hidden bg-white" style={{ height: 200, boxShadow: "0 10px 30px -14px rgba(28,46,56,0.5)" }}>
                  <iframe
                    title={`${MAPS[sec.id].title} — interactive map`}
                    src={MAPS[sec.id].src}
                    loading="lazy"
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {sec.id === "driving" && (
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Maidenhead+Town+Centre%2C+Maidenhead"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white active:opacity-85"
                  style={{ backgroundColor: "var(--teal-deep)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  Get Directions
                </a>
              )}

              <MobileCard className="px-4 divide-y" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
                {sec.blocks.map((b) => (
                  <div key={b.title} className="py-3.5">
                    <h3 className="font-bold text-sm mb-1" style={{ color: "#000000" }}>{b.title}</h3>
                    <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>{b.body}</p>
                  </div>
                ))}
              </MobileCard>
            </div>
          ))}

          {/* Good to know */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="section-eyebrow mb-1.5" style={{ color: "var(--teal-deep)" }}>Good to Know</p>
              <h2 className="text-xl font-bold leading-tight" style={{ color: "#000000" }}>Before You Visit</h2>
            </div>
            {goodToKnow.map((g) => (
              <MobileCard key={g.id} className="p-4">
                <h3 className="font-bold text-sm mb-1.5" style={{ color: "#000000" }}>{g.title}</h3>
                <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>{g.body}</p>
              </MobileCard>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
