import { useParams, Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { placesById } from "../data/mobileMock";

function Row({ icon, children }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    pin: <svg {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>,
    clock: <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
    tag: <svg {...p}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1.5" fill="var(--leaf)" stroke="none" /></svg>,
  };
  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-0.5">{icons[icon]}</span>
      <span className="text-sm" style={{ color: "#000000" }}>{children}</span>
    </div>
  );
}

export default function PlaceDetailScreen() {
  const { id } = useParams();
  const place = placesById[id];

  if (!place) {
    return (
      <MobileShell title="Not found" onBack>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>This place could not be found.</p>
      </MobileShell>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        {/* Hero with floating back */}
        <div className="relative">
          <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0.35) 0%, rgba(12,20,24,0) 40%, var(--forest) 100%)" }} />
          <Link to={`/mobile/${place.sectionKey}`} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
        </div>

        <div className="px-5 -mt-6 relative flex flex-col gap-4 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--sage)" }}>{place.sectionTitle} · {place.category}</span>
            <h1 className="text-2xl font-bold mt-1" style={{ color: "#fff" }}>{place.name}</h1>
          </div>

          <MobileCard className="p-4 flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.blurb}</p>
            <div className="h-px" style={{ background: "rgba(0,0,0,0.07)" }} />
            <Row icon="pin">{place.address}</Row>
            <Row icon="clock">{place.hours}</Row>
            <Row icon="tag">{place.category}</Row>
          </MobileCard>

          <div className="grid grid-cols-2 gap-3">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "var(--sage)", color: "#000000" }}>
              Directions
            </a>
            <Link to="/mobile/map" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
              View on Map
            </Link>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
