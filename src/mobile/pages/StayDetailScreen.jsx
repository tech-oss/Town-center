import { useParams, useSearchParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import ActionButton from "../components/ActionButton";
import PhotoGallery from "../components/PhotoGallery";
import MiniMap from "../components/MiniMap";
import useFetch from "../../hooks/useFetch";
import { getHotelBySlug, getAccommodationBySlug } from "../../api";
import { STAY_DISCOVER } from "../../Data/stayDiscover";
import { typeColor } from "../lib/typeColors";
import useMobileBack from "../hooks/useMobileBack";
import StickyCta, { TicketIcon } from "../components/StickyCta";
import { OffersLink } from "../components/ListSearch";

const SOCIAL_ICONS = {
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M20 4L4 20" /></svg>,
};

// Categorised amenities — matches the website's StayDetailPage.jsx
// AmenitiesSection: a clean checkmark + name row grouped under Property
// Facilities / Room Facilities / Travel Group, no per-item icon or blurb.
function AmenityCategory({ title, items }) {
  if (!items?.length) return null;
  return (
    <MobileCard className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide mb-3 pb-2.5" style={{ color: "var(--leaf)", borderBottom: "1px solid rgba(28,46,56,0.1)" }}>
        {title}
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((a) => (
          <div key={a} className="flex items-start gap-2.5 text-sm leading-snug" style={{ color: "#000000" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{a}</span>
          </div>
        ))}
      </div>
    </MobileCard>
  );
}

export default function StayDetailScreen() {
  const { kind, slug } = useParams();
  const isHotel = kind === "hotels";
  const [copied, setCopied] = useState(false);
  const { data: place, loading } = useFetch(
    () => (isHotel ? getHotelBySlug(slug) : getAccommodationBySlug(slug)),
    [kind, slug]
  );

  const [searchParams] = useSearchParams();
  const backTo = searchParams.get("back");
  const navigate = useNavigate();
  const defaultBack = useMobileBack("/mobile/live");
  // When we arrived here from a filtered listing (via `back`), the back
  // button should return to that exact filtered view, not just "go back
  // one screen" — same URL a "Back to results" link would use.
  const goBack = backTo ? () => navigate(backTo) : defaultBack;
  if (!loading && !place) return <Navigate to="/mobile/live" replace />;
  if (loading || !place) return null;

  const mapsUrl = place.mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.mapQuery)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
  const websiteUrl = place.website ? `https://${place.website.replace(/^https?:\/\//, "")}` : null;
  const gallery = (place.gallery?.length ? place.gallery : [place.image]).filter((g) => g !== place.image);
  const social = place.social ? Object.entries(place.social).filter(([k]) => SOCIAL_ICONS[k]) : [];
  const news = place.news ?? [];

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
          {backTo && (
            <Link to={backTo} className="inline-flex items-center gap-1.5 self-start text-xs font-bold" style={{ color: "var(--teal-deep)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              Back to results
            </Link>
          )}
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

          {place.description && place.description.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "#000000" }}>{para}</p>
          ))}

          {/* Action rail — same design as the Services/Freelancer profiles:
              a full-width Call Now bar, then circular Website/Directions/
              Share buttons, then address + email, then social icons, all in
              one card. */}
          <MobileCard className="p-4 flex flex-col gap-3">
            {place.phone && (
              <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: "var(--forest)", color: "#fff" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
                Call Now · {place.phone}
              </a>
            )}
            <div className="grid grid-cols-3 gap-2">
              {websiteUrl && (
                <ActionButton
                  href={websiteUrl}
                  label="Visit Website"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>}
                />
              )}
              <ActionButton
                href={mapsUrl}
                label="Get Directions"
                skipExternalConfirm
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>}
              />
              <ActionButton
                onClick={handleShare}
                label={copied ? "Link Copied" : "Share"}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" /></svg>}
              />
            </div>
            {((place.address ?? place.area) || place.email) && (
              <div className="flex flex-col gap-2.5 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {(place.address ?? place.area) && (
                  <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    {place.address ?? place.area}
                  </div>
                )}
                {place.email && (
                  <div className="flex items-start gap-3 text-sm break-all" style={{ color: "#000000" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                    {place.email}
                  </div>
                )}
              </div>
            )}
            {social.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-1">
                {social.map(([key, href]) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={key} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)" }}>
                    {SOCIAL_ICONS[key]}
                  </a>
                ))}
              </div>
            )}
          </MobileCard>

          <PhotoGallery images={gallery} title={place.name} />

          {(place.propertyTypes?.length || place.facilities?.length || place.roomFacilities?.length || place.travelGroup?.length) > 0 && (
            <div>
              <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>
                {isHotel ? "Amenities" : "What This Place Offers"}
              </p>
              <div className="flex flex-col gap-3">
                <AmenityCategory title="Property Types" items={place.propertyTypes} />
                <AmenityCategory title="Property Facilities" items={place.facilities} />
                <AmenityCategory title="Room Facilities" items={place.roomFacilities} />
                <AmenityCategory title="Travel Group" items={place.travelGroup} />
              </div>
            </div>
          )}

          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Location</p>
            <MiniMap query={place.mapQuery || place.address || place.area} lat={place.lat} lng={place.lng} />
          </div>

          {news.length > 0 && (
            <div
              className="-mx-5 mt-2 px-5 py-6 flex flex-col gap-4"
              style={{ background: "linear-gradient(135deg, #16252E 0%, #245C63 50%, #2F8C8C 100%)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--mint)" }}>News &amp; Offers</p>
              <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5">
                {news.map((n) => (
                  <Link key={n.slug} to={`/mobile/news/${n.slug}`} className="shrink-0 w-48 overflow-hidden flex flex-col" style={{ borderRadius: 14, backgroundColor: "rgba(240,250,250,0.9)" }}>
                    <img src={n.image} alt="" className="w-full h-28 object-cover" />
                    <div className="p-2.5 flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide w-fit" style={{ color: "var(--teal-deep)" }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: typeColor(n.category) }} />
                        {n.category}
                      </span>
                      <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{n.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {STAY_DISCOVER.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Stay Here &amp; Discover</p>
              <div className="flex flex-col gap-3">
                {STAY_DISCOVER.map((it) => (
                  <Link key={it.slug} to={it.mobileTo} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={it.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{it.tag}</span>
                      <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{it.name}</p>
                      <span className="inline-flex items-center gap-0.5 self-start text-[10px] font-bold mt-0.5" style={{ color: "var(--leaf)" }}>
                        Read more
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                      </span>
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
