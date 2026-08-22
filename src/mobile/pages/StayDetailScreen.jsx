import { useParams, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import PhotoGallery from "../components/PhotoGallery";
import MiniMap from "../components/MiniMap";
import useFetch from "../../hooks/useFetch";
import { getHotelBySlug, getAccommodationBySlug, getHotels, getAccommodations } from "../../api";
import useMobileBack from "../hooks/useMobileBack";
import StickyCta, { TicketIcon } from "../components/StickyCta";
import { OffersLink } from "../components/ListSearch";

const SOCIAL_ICONS = {
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M20 4L4 20" /></svg>,
};

// Keyword → {icon, blurb} for each amenity label, matching the website's
// StayDetailPage.jsx AmenitiesSection so a bare checklist reads as curated
// feature cards instead.
const AMENITY_META = [
  [/wi-?fi/i, "wifi", "Stay connected with Wi-Fi throughout your stay."],
  [/spa|pool|swim/i, "swim", "Relax and unwind with the on-site spa and pool."],
  [/restaurant|bar/i, "restaurant", "Enjoy a meal or drink without leaving the building."],
  [/garden/i, "garden", "Step outside to a private, landscaped garden."],
  [/parking/i, "parking", "Secure, convenient parking on site."],
  [/family/i, "family", "Spacious rooms well suited to families and groups."],
  [/kitchen/i, "kitchen", "Cook your own meals in a fully equipped kitchen."],
  [/washer|dryer/i, "laundry", "Laundry facilities on hand for longer stays."],
  [/river|thames|waterside/i, "river", "Soak up riverside views just steps away."],
  [/station|walk/i, "walk", "A short, easy walk from the station and town centre."],
  [/pet/i, "pet", "Bring your pet along — this stay welcomes them."],
  [/entrance/i, "door", "A private entrance for added privacy and ease."],
  [/kettle|microwave/i, "cup", "Handy extras on hand for tea, coffee and quick snacks."],
  [/bbq|furniture/i, "bbq", "Outdoor furniture and a BBQ for al fresco evenings."],
  [/conference/i, "conference", "Well-equipped spaces for meetings and events."],
  [/guarantee/i, "shield", "Book with confidence, backed by a satisfaction guarantee."],
];
function amenityMeta(label) {
  const hit = AMENITY_META.find(([re]) => re.test(label));
  return hit ? { icon: hit[1], blurb: hit[2] } : { icon: "star", blurb: "A thoughtful extra included with your stay." };
}

function AmenityIcon({ name }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "var(--leaf)", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "wifi": return (<svg {...p}><path d="M2 8.5a16 16 0 0 1 20 0" /><path d="M5.5 12a11 11 0 0 1 13 0" /><path d="M9 15.5a6 6 0 0 1 6 0" /><circle cx="12" cy="19" r="1" fill="var(--leaf)" stroke="none" /></svg>);
    case "swim": return (<svg {...p}><circle cx="18" cy="6" r="1.5" fill="var(--leaf)" stroke="none" /><path d="M4 12l3-3 3 2 3-3 3 2 3-3" /><path d="M3 18c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" /></svg>);
    case "restaurant": return (<svg {...p}><path d="M3 17a9 6 0 0 1 18 0" /><path d="M2 17h20M12 17V6" /></svg>);
    case "garden": return (<svg {...p}><path d="M12 21V10" /><path d="M12 10C12 6 9 4 6 4c0 4 2.5 6.5 6 6z" /><path d="M12 13c0-3.5 2.5-5.5 6-6 0 3.5-2.5 6-6 6z" /></svg>);
    case "parking": return (<svg {...p}><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M7 18v2M17 18v2M3 12h18" /><path d="M6.5 12V9h2a1.5 1.5 0 0 1 0 3h-2z" /></svg>);
    case "family": return (<svg {...p}><circle cx="8" cy="8" r="3" /><path d="M2 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20a5 5 0 0 1 6-4.5" /></svg>);
    case "kitchen": return (<svg {...p}><path d="M4 3v7a3 3 0 0 0 6 0V3M7 10v11" /><path d="M15 3c-1 2-1 4 0 6s1 4 0 6M15 3v18" /></svg>);
    case "laundry": return (<svg {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><circle cx="8" cy="6.5" r="0.8" fill="var(--leaf)" stroke="none" /></svg>);
    case "river": return (<svg {...p}><path d="M2 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M2 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M2 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /></svg>);
    case "walk": return (<svg {...p}><circle cx="14" cy="4" r="1.6" fill="var(--leaf)" stroke="none" /><path d="M10 22l1.5-6L9 14l1-5 3 1 3 4-2 1-1-2-1.5 2 2 2-1 5" /></svg>);
    case "pet": return (<svg {...p}><circle cx="7" cy="9" r="1.6" /><circle cx="11.5" cy="6.5" r="1.6" /><circle cx="16" cy="9" r="1.6" /><circle cx="18" cy="13.5" r="1.6" /><path d="M6 19c0-3 3-4 6-4s6 1 6 4c0 1.5-1.5 2-3 1.5-2-1-4-1-6 0-1.5.5-3 0-3-1.5z" /></svg>);
    case "door": return (<svg {...p}><rect x="5" y="2" width="14" height="20" rx="1" /><circle cx="14.5" cy="12" r="1" fill="var(--leaf)" stroke="none" /></svg>);
    case "cup": return (<svg {...p}><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" /><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17M7 3c0 1-1 1-1 2M11 3c0 1-1 1-1 2" /></svg>);
    case "bbq": return (<svg {...p}><path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.5.5-2.5 1.5-3.5C9 10 9.5 11 9.5 11S9 6 12 3z" /></svg>);
    case "conference": return (<svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>);
    case "shield": return (<svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>);
    default: return (<svg {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" /></svg>);
  }
}

export default function StayDetailScreen() {
  const { kind, slug } = useParams();
  const isHotel = kind === "hotels";
  const [copied, setCopied] = useState(false);
  const { data: place, loading } = useFetch(
    () => (isHotel ? getHotelBySlug(slug) : getAccommodationBySlug(slug)),
    [kind, slug]
  );
  const { data: siblings } = useFetch(isHotel ? getHotels : getAccommodations, [kind]);

  const goBack = useMobileBack("/mobile/live");
  if (!loading && !place) return <Navigate to="/mobile/live" replace />;
  if (loading || !place) return null;

  const mapsUrl = place.mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.mapQuery)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const websiteUrl = place.website ? `https://${place.website.replace(/^https?:\/\//, "")}` : null;
  const gallery = (place.gallery?.length ? place.gallery : [place.image]).filter((g) => g !== place.image);
  const social = place.social ? Object.entries(place.social).filter(([k]) => SOCIAL_ICONS[k]) : [];
  const related = (siblings ?? []).filter((s) => s.slug !== place.slug).slice(0, 3);

  async function handleShare() {
    const url = `${window.location.origin}/live/stay/${kind}/${place.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: place.name, text: place.tagline, url }); } catch { /* cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
        </div>

        <div className="px-5 pt-4 relative flex flex-col gap-4 pb-8 mobile-stagger">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>
              {isHotel ? `Hotel${place.stars ? ` · ${"★".repeat(place.stars)}` : ""}` : place.type}
            </span>
            <h1 className="text-2xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{place.name}</h1>
            {place.tagline && <p className="text-sm mt-1" style={{ color: "#000000" }}>{place.tagline}</p>}
          </div>

          {!isHotel && (place.guests || place.bedrooms || place.host) && (
            <p className="text-sm font-medium" style={{ color: "#000000" }}>
              {place.guests} guests · {place.bedrooms} bedroom{place.bedrooms !== 1 ? "s" : ""}{place.host ? ` · ${place.host}` : ""}
            </p>
          )}

          {place.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.description}</p>
          )}

          <MobileCard className="p-4 flex flex-col gap-3">
            {(place.address ?? place.area) && (
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{place.address ?? place.area}</span>
              </div>
            )}
            {place.phone && (
              <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
                <span className="text-sm" style={{ color: "#000000" }}>{place.phone}</span>
              </a>
            )}
            {place.email && (
              <a href={`mailto:${place.email}`} className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <span className="text-sm break-all" style={{ color: "#000000" }}>{place.email}</span>
              </a>
            )}
            {social.length > 0 && (
              <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {social.map(([key, href]) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={key} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)" }}>
                    {SOCIAL_ICONS[key]}
                  </a>
                ))}
              </div>
            )}
          </MobileCard>

          <div className="grid grid-cols-3 gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" data-skip-external-confirm className="flex flex-col items-center gap-2 active:opacity-70">
              <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              </span>
              <span className="text-xs font-semibold text-center" style={{ color: "#000000" }}>Directions</span>
            </a>
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 active:opacity-70">
                <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>
                </span>
                <span className="text-xs font-semibold text-center" style={{ color: "#000000" }}>Book / Website</span>
              </a>
            )}
            <button type="button" onClick={handleShare} className="flex flex-col items-center gap-2 active:opacity-70">
              <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" /></svg>
              </span>
              <span className="text-xs font-semibold text-center" style={{ color: "#000000" }}>{copied ? "Copied!" : "Share"}</span>
            </button>
          </div>

          <PhotoGallery images={gallery} title={place.name} />

          {place.amenities?.length > 0 && (
            <div>
              <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>
                {isHotel ? "Amenities" : "What This Place Offers"}
              </p>
              <div className="flex flex-col gap-2.5">
                {place.amenities.map((a) => {
                  const { icon, blurb } = amenityMeta(a);
                  return (
                    <MobileCard key={a} className="p-3.5 flex items-center gap-3.5">
                      <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--mint)" }}>
                        <AmenityIcon name={icon} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "#000000" }}>{a}</p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: "#000000" }}>{blurb}</p>
                      </div>
                      <span className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 text-xs" style={{ borderColor: "var(--leaf)", color: "var(--leaf)" }}>✓</span>
                    </MobileCard>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Location</p>
            <MiniMap query={place.mapQuery || place.address || place.area} lat={place.lat} lng={place.lng} />
          </div>

          {related.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>
                {isHotel ? "More Hotels in Maidenhead" : "More Accommodation in Maidenhead"}
              </p>
              <div className="flex flex-col gap-3">
                {related.map((it) => (
                  <Link key={it.slug} to={`/mobile/stay/${kind}/${it.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={it.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{isHotel ? `${it.stars}-Star Hotel` : it.type}</span>
                      <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{it.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <OffersLink className="mt-1" />
        </div>
      </div>

      {websiteUrl && <StickyCta label="Make a Booking" href={websiteUrl} icon={<TicketIcon />} />}
    </MobileShell>
  );
}
