import { useParams, Navigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import useFetch from "../../hooks/useFetch";
import { getHotelBySlug, getAccommodationBySlug } from "../../api";
import StickyCta, { TicketIcon } from "../components/StickyCta";
import { OffersLink } from "../components/ListSearch";

export default function StayDetailScreen() {
  const { kind, slug } = useParams();
  const isHotel = kind === "hotels";
  const { data: place, loading } = useFetch(
    () => (isHotel ? getHotelBySlug(slug) : getAccommodationBySlug(slug)),
    [kind, slug]
  );

  if (!loading && !place) return <Navigate to="/mobile/live" replace />;
  if (loading || !place) return null;

  const mapsUrl = place.mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.mapQuery)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const websiteUrl = place.website ? `https://${place.website.replace(/^https?:\/\//, "")}` : null;
  const gallery = place.gallery?.length ? place.gallery : [place.image];

  return (
    <MobileShell noPadding>
      <div className="flex flex-col">
        <div className="relative">
          <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
          <button onClick={() => window.history.back()} className="absolute top-3 left-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} aria-label="Back">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>

        <div className="px-5 -mt-2 relative flex flex-col gap-4 pb-8 mobile-stagger">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>
              {isHotel ? `Hotel${place.stars ? ` · ${"★".repeat(place.stars)}` : ""}` : place.type}
            </span>
            <h1 className="text-2xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{place.name}</h1>
            {place.tagline && <p className="text-sm mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>{place.tagline}</p>}
          </div>

          {place.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.description}</p>
          )}

          <MobileCard className="p-4 flex flex-col gap-3">
            {place.address && (
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{place.address}</span>
              </div>
            )}
            {place.phone && (
              <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{place.phone}</span>
              </a>
            )}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{place.website}</span>
              </a>
            )}
          </MobileCard>

          {place.amenities?.length > 0 && (
            <MobileCard className="p-4 flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--leaf)" }}>Amenities</p>
              <div className="flex flex-col gap-2">
                {place.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2.5 text-sm" style={{ color: "#000000" }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--leaf)" }} />
                    {a}
                  </div>
                ))}
              </div>
            </MobileCard>
          )}

          {gallery.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {gallery.slice(1, 5).map((src, i) => (
                <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "var(--leaf)", color: "#ffffff" }}>
              Directions
            </a>
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-center py-3 rounded-2xl text-sm font-bold active:opacity-80" style={{ backgroundColor: "rgba(28,46,56,0.06)", color: "#000000" }}>
                Book / Website
              </a>
            )}
          </div>

          <OffersLink className="mt-1" />
        </div>
      </div>

      {/* Sticky booking CTA for stays that link out to their own booking page. */}
      {websiteUrl && <StickyCta label="Make a Booking" href={websiteUrl} icon={<TicketIcon />} />}
    </MobileShell>
  );
}
