import { useParams, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import PhotoGallery from "../components/PhotoGallery";
import MiniMap from "../components/MiniMap";
import { itemBySlug, sections } from "../../Data/pages";
import StickyCta, { TicketIcon } from "../components/StickyCta";
import useMobileBack from "../hooks/useMobileBack";
import { FREELANCER_CATEGORIES } from "../lib/freelancerCategories";
import ServicesBusinessDetailScreen from "./ServicesBusinessDetailScreen";
import FreelancerDetailScreen from "./FreelancerDetailScreen";

const SOCIAL_ICONS = {
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M20 4L4 20" /></svg>,
};

function ActionButton({ icon, label, href, onClick }) {
  const inner = (
    <>
      <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)", color: "#fff" }}>
        {icon}
      </span>
      <span className="text-xs font-semibold text-center leading-snug" style={{ color: "#000000" }}>{label}</span>
    </>
  );
  const className = "flex flex-col items-center gap-2 active:opacity-70";
  if (onClick) return <button type="button" onClick={onClick} className={className}>{inner}</button>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>;
}

// Eat & Drink / Shop / See & Do business detail — the website's
// PlaceDetailLayout equivalent. Services (tradesperson/professional/
// freelancer) uses its own, richer native screens below since the website
// itself gives Services a completely different, deeper layout
// (ServicesDetailLayout/FreelancerDetailLayout) rather than this one.
function BusinessDetailScreen({ place, goBack }) {
  const [copied, setCopied] = useState(false);
  const section = sections[place.section];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.mapQuery || place.address)}`;
  const websiteUrl = place.website ? `https://${place.website.replace(/^https?:\/\//, "")}` : null;
  const news = place.news ?? [];
  const social = place.social
    ? Object.entries(place.social).filter(([k]) => SOCIAL_ICONS[k])
    : [];
  const more = (section?.items ?? []).filter((it) => it.slug !== place.slug).slice(0, 3);
  const gallery = (place.gallery ?? []).filter((g) => g !== place.image);

  async function handleShare() {
    const url = `${window.location.origin}/${place.section}/place/${place.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, text: place.description, url });
      } catch {
        /* user cancelled — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <MobileShell noPadding onBack={goBack}>
      <div className="flex flex-col">
        <div className="relative">
          <img src={place.image} alt={place.name} className="w-full h-56 object-cover" />
        </div>

        <div className="px-5 -mt-2 relative flex flex-col gap-4 pb-8 mobile-stagger">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--leaf)" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--leaf)" }} />
              {section?.label} · {place.tag}
            </span>
            <h1 className="text-2xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{place.name}</h1>
          </div>

          {place.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.description}</p>
          )}

          <MobileCard className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <span className="text-sm" style={{ color: "#000000" }}>{place.address}</span>
            </div>
            {place.phone && place.phone !== "—" && (
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
          </MobileCard>

          {place.hours?.length > 0 && (
            <MobileCard className="p-4 flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--leaf)" }}>Opening Hours</p>
              {place.hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between text-sm">
                  <span style={{ color: "#000000" }}>{h.day}</span>
                  <span className="font-semibold" style={{ color: "#000000" }}>{h.time}</span>
                </div>
              ))}
            </MobileCard>
          )}

          <MobileCard className="p-4 flex flex-col gap-4">
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
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>}
              />
              <ActionButton
                onClick={handleShare}
                label={copied ? "Link Copied" : "Share"}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" /></svg>}
              />
            </div>

            {social.length > 0 && (
              <div className="flex items-center justify-center gap-3 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                {social.map(([key, href]) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--leaf)" }}
                  >
                    {SOCIAL_ICONS[key]}
                  </a>
                ))}
              </div>
            )}
          </MobileCard>

          {/* Extra photos — matches the website's up-to-6, 2-per-row grid
              with a tap-to-enlarge lightbox. */}
          <PhotoGallery images={gallery} title={place.name} />

          {/* Location map — the website embeds one on every detail page;
              geocoded from the address since not every listing has stored
              coordinates. */}
          <div>
            <p className="section-eyebrow mb-2.5" style={{ color: "var(--teal-deep)" }}>Location</p>
            <MiniMap query={place.mapQuery || place.address} lat={place.lat} lng={place.lng} />
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

          {more.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>More {section?.label}</p>
              <div className="flex flex-col gap-3">
                {more.map((it) => (
                  <Link key={it.slug} to={`/mobile/place/${it.slug}`} className="flex items-stretch overflow-hidden bg-white active:opacity-90" style={{ borderRadius: 16, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)" }}>
                    <img src={it.image} alt="" className="w-20 h-20 object-cover shrink-0" />
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>{it.tag}</span>
                      <p className="text-sm font-bold truncate" style={{ color: "#000000" }}>{it.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky booking CTA — shown only for listings whose subscription
          enables it, matching the website's gate (DetailPage.jsx). */}
      {place.section === "eat-drink" && websiteUrl && (
        <StickyCta label="Make a Booking" href={websiteUrl} icon={<TicketIcon />} />
      )}
    </MobileShell>
  );
}

// Dispatcher — matches the website's own split: See & Do/Eat & Drink/Shop
// use PlaceDetailLayout (BusinessDetailScreen here); Services splits again
// into the local-directory profile (tradespeople/professionals) or the
// lighter portfolio-first profile (freelancers), same FREELANCER_CATEGORIES
// test the website's ServicesDetailPage.jsx uses.
export default function PlaceDetailScreen() {
  const { id } = useParams();
  const place = itemBySlug[id];
  const goBack = useMobileBack(place ? `/mobile/${place.section}` : "/mobile/explore");

  if (!place) return <Navigate to="/mobile/explore" replace />;

  if (place.section === "services") {
    if (FREELANCER_CATEGORIES.has(place.category)) {
      return <FreelancerDetailScreen place={place} goBack={goBack} />;
    }
    return <ServicesBusinessDetailScreen place={place} goBack={goBack} />;
  }

  return <BusinessDetailScreen place={place} goBack={goBack} />;
}
