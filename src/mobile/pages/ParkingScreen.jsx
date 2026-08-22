import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { travelSections, carParks, goodToKnow } from "../../Data/gettingHere";

const parking = travelSections.find((s) => s.id === "parking");
const accessibility = goodToKnow.find((g) => g.id === "accessibility");

export default function ParkingScreen() {
  return (
    <MobileShell title="Parking" onBack backFallback="/mobile/transport" noPadding>
      <div className="flex flex-col">
        <img src={parking.image} alt="" className="w-full h-52 object-cover" />

        <div className="px-5 pt-5 pb-8 flex flex-col gap-6 mobile-stagger">
          <div>
            <p className="section-eyebrow mb-2" style={{ color: "var(--teal-deep)" }}>{parking.eyebrow}</p>
            <h1 className="text-2xl font-bold leading-tight mb-2" style={{ color: "#000000" }}>{parking.heading}</h1>
            <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>{parking.intro}</p>
          </div>

          {/* Directions to each town-centre car park */}
          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Directions</p>
            <p className="text-xs font-semibold mb-3" style={{ color: "#000000" }}>
              Navigate to the following car parks from your location:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {carParks.map((p) => (
                <a
                  key={p.label}
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-skip-external-confirm
                  className="flex items-center gap-2 px-3.5 py-3 rounded-xl active:opacity-80"
                  style={{ backgroundColor: "var(--mint)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="text-xs font-bold leading-tight" style={{ color: "#000000" }}>{p.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Car-park map */}
          <div className="rounded-2xl overflow-hidden bg-white" style={{ height: 220, boxShadow: "0 10px 30px -14px rgba(28,46,56,0.5)" }}>
            <iframe
              title="Maidenhead town-centre car parks — interactive map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7320%2C51.5140%2C-0.7060%2C51.5290&layer=mapnik&marker=51.5208%2C-0.7200"
              loading="lazy"
              className="w-full h-full border-0"
            />
          </div>

          {/* Car parks in and around the town centre */}
          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Where to Park</p>
            <MobileCard className="px-4 divide-y" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
              {parking.blocks.map((b) => (
                <div key={b.title} className="py-3.5">
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#000000" }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>{b.body}</p>
                </div>
              ))}
            </MobileCard>
          </div>

          {parking.note && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--forest)" }}>
              <p className="text-sm leading-relaxed font-medium text-white">{parking.note}</p>
            </div>
          )}

          {accessibility && (
            <MobileCard className="p-4">
              <h3 className="font-bold text-sm mb-1.5" style={{ color: "#000000" }}>{accessibility.title}</h3>
              <p className="text-sm leading-relaxed font-medium" style={{ color: "#000000" }}>{accessibility.body}</p>
            </MobileCard>
          )}

          <Link
            to="/mobile/transport"
            className="flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold text-white active:opacity-85"
            style={{ backgroundColor: "var(--teal-deep)" }}
          >
            Transport &amp; Getting Here
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
