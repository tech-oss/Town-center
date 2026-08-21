import { useParams, Link, Navigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import { itemBySlug, sections } from "../../Data/pages";

function Row({ icon, children, href }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    pin: <svg {...p}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>,
    phone: <svg {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>,
    globe: <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>,
  };
  const content = (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-0.5">{icons[icon]}</span>
      <span className="text-sm" style={{ color: "#000000" }}>{children}</span>
    </div>
  );
  return href ? <a href={href} target={icon === "globe" ? "_blank" : undefined} rel="noopener noreferrer">{content}</a> : content;
}

export default function PlaceDetailScreen() {
  const { id } = useParams();
  const place = itemBySlug[id];

  if (!place) return <Navigate to="/mobile/explore" replace />;

  const section = sections[place.section];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`;
  const websiteUrl = place.website ? `https://${place.website.replace(/^https?:\/\//, "")}` : null;
  const news = place.news ?? [];

  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        {/* Hero */}
        <div className="relative">
          <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(12,20,24,0.35) 0%, rgba(12,20,24,0) 40%, #ffffff 100%)" }} />
          <Link to={`/mobile/${place.section}`} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
        </div>

        <div className="px-5 -mt-2 relative flex flex-col gap-4 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{section?.label} · {place.tag}</span>
            <h1 className="text-2xl font-bold mt-1" style={{ color: "#000000" }}>{place.name}</h1>
          </div>

          <MobileCard className="p-4 flex flex-col gap-3">
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.description}</p>
            <div className="h-px" style={{ background: "rgba(0,0,0,0.07)" }} />
            <Row icon="pin">{place.address}</Row>
            {place.phone && place.phone !== "—" && <Row icon="phone" href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}>{place.phone}</Row>}
            {websiteUrl && <Row icon="globe" href={websiteUrl}>{place.website}</Row>}
          </MobileCard>

          {place.hours?.length > 0 && (
            <MobileCard className="p-4 flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--leaf)" }}>Opening Hours</p>
              {place.hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between text-sm">
                  <span style={{ color: "rgba(0,0,0,0.6)" }}>{h.day}</span>
                  <span className="font-semibold" style={{ color: "#000000" }}>{h.time}</span>
                </div>
              ))}
            </MobileCard>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>
              Directions
            </a>
            <Link to="/mobile/map" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}>
              View on Map
            </Link>
          </div>

          {/* News & Offers — same glassmorphic dark-teal card treatment as
              the website's Eat & Drink business pages, condensed to a
              horizontal scroller for mobile. */}
          {news.length > 0 && (
            <div
              className="-mx-5 mt-2 px-5 py-6 flex flex-col gap-4"
              style={{ background: "linear-gradient(135deg, #16252E 0%, #245C63 50%, #2F8C8C 100%)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--mint)" }}>News &amp; Offers</p>
              <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5">
                {news.map((n) => (
                  <Link
                    key={n.slug}
                    to={`/mobile/news/${n.slug}`}
                    className="shrink-0 w-48 overflow-hidden flex flex-col"
                    style={{ borderRadius: 14, backgroundColor: "rgba(240,250,250,0.9)" }}
                  >
                    <img src={n.image} alt="" className="w-full h-28 object-cover" />
                    <div className="p-2.5 flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{n.category}</span>
                      <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{n.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
