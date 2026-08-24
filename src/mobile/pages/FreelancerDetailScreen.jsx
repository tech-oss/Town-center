import { Link } from "react-router-dom";
import { useState } from "react";
import MobileShell from "../components/MobileShell";
import MobileCard from "../components/MobileCard";
import ActionButton from "../components/ActionButton";
import PhotoGallery from "../components/PhotoGallery";
import { sections } from "../../Data/pages";
import { typeColor } from "../lib/typeColors";

const SOCIAL_ICONS = {
  instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="#fff" stroke="none" /></svg>,
  facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l16 16M20 4L4 20" /></svg>,
};

function StarIcon({ filled, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#F5A623" : "none"} stroke="#F5A623" strokeWidth="1.5" className="shrink-0">
      <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.5 1.5-6.8-5.2-4.7 6.9-.7L12 2.5z" strokeLinejoin="round" />
    </svg>
  );
}
function StarRow({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} size={size} filled={n <= Math.round(value)} />)}
    </span>
  );
}

function Pill({ children }) {
  return (
    <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}>
      {children}
    </span>
  );
}

function ReviewCard({ area, stars, timeAgo, text }) {
  return (
    <div className="py-3.5 border-t first:border-t-0" style={{ borderColor: "rgba(28,46,56,0.08)" }}>
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <StarRow value={stars} size={12} />
        <span className="text-xs" style={{ color: "#000000" }}>{timeAgo}{area ? ` · ${area}` : ""}</span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{text}</p>
    </div>
  );
}

// The website's freelancer profile (FreelancerDetailLayout.jsx) drops the
// storefront sections (opening hours, areas covered) a tradesperson/
// professional gets, in favour of skills, a portfolio and the practical
// info a client actually wants — availability, work mode, response time,
// experience — before reaching out.
export default function FreelancerDetailScreen({ place, goBack }) {
  const [copied, setCopied] = useState(false);
  const section = sections[place.section];
  const websiteUrl = place.website ? `https://${place.website.replace(/^https?:\/\//, "")}` : null;
  const news = place.news ?? [];
  const social = place.social ? Object.entries(place.social).filter(([k]) => SOCIAL_ICONS[k]) : [];
  const portfolio = (place.gallery ?? []).filter((g) => g !== place.image);
  const skills = place.servicesOffered ?? [];
  const reviewsList = place.reviewsList ?? [];
  const availability = place.availability || "Accepting new projects";
  const workMode = place.workMode || "Remote & on-site";
  const responseTime = place.responseTime || "Usually within 24 hours";
  const experience = place.experience || place.stats?.[0]?.value;
  const related = (section?.items ?? [])
    .filter((it) => it.slug !== place.slug && it.category === place.category)
    .slice(0, 3);

  const infoRows = [
    availability && { label: "Availability", value: availability, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg> },
    workMode && { label: "Works", value: workMode, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M2 20h20" /></svg> },
    responseTime && { label: "Response Time", value: responseTime, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg> },
    experience && { label: "Experience", value: experience, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg> },
  ].filter(Boolean);

  async function handleShare() {
    const url = `${window.location.origin}/${place.section}/place/${place.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: place.name, text: place.description, url }); } catch { /* cancelled */ }
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
            <span className="text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--leaf)" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--leaf)" }} />
              {section?.label} · {place.tag}
            </span>
            <h1 className="text-2xl font-bold mt-1 leading-snug" style={{ color: "#000000" }}>{place.name}</h1>
            {place.rating != null && (
              <div className="flex items-center gap-2 mt-1.5">
                <StarRow value={place.rating} />
                <span className="text-sm font-bold" style={{ color: "#000000" }}>{place.rating.toFixed(1)}</span>
                {place.reviewCount != null && <span className="text-xs" style={{ color: "#000000" }}>({place.reviewCount} reviews)</span>}
              </div>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {skills.slice(0, 4).map((s) => <Pill key={s}>{s}</Pill>)}
              </div>
            )}
          </div>

          {place.description && (
            <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.description}</p>
          )}

          <MobileCard className="p-4 flex flex-col gap-3">
            {place.phone && place.phone !== "—" && (
              <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ backgroundColor: "var(--forest)", color: "#fff" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
                Call Now · {place.phone}
              </a>
            )}
            <div className="grid grid-cols-3 gap-2">
              {place.email && (
                <ActionButton
                  href={`mailto:${place.email}`}
                  label="Get in Touch"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>}
                />
              )}
              {websiteUrl && (
                <ActionButton
                  href={websiteUrl}
                  label="Visit Website"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg>}
                />
              )}
              <ActionButton
                onClick={handleShare}
                label={copied ? "Link Copied" : "Share Profile"}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" /></svg>}
              />
            </div>
            {place.address && (
              <div className="flex items-start gap-3 text-sm pt-3" style={{ color: "#000000", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--leaf)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                {place.address}
              </div>
            )}
            {social.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {social.map(([key, href]) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={key} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--leaf)" }}>
                    {SOCIAL_ICONS[key]}
                  </a>
                ))}
              </div>
            )}
          </MobileCard>

          {infoRows.length > 0 && (
            <MobileCard className="p-4 flex flex-col gap-3.5">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>Working With Me</p>
              {infoRows.map((r) => (
                <div key={r.label} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5">{r.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs" style={{ color: "#000000" }}>{r.label}</div>
                    <div className="font-semibold" style={{ color: "#000000" }}>{r.value}</div>
                  </div>
                </div>
              ))}
            </MobileCard>
          )}

          <PhotoGallery images={portfolio} title={`${place.name} portfolio`} max={9} />

          {place.aboutText && (
            <MobileCard className="p-4 flex flex-col gap-2">
              {place.aboutHeading && <p className="text-sm font-bold" style={{ color: "#000000" }}>{place.aboutHeading}</p>}
              <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{place.aboutText}</p>
            </MobileCard>
          )}

          {skills.length > 0 && (
            <MobileCard className="p-4 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--leaf)" }}>Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => <Pill key={s}>{s}</Pill>)}
              </div>
            </MobileCard>
          )}

          {reviewsList.length > 0 && (
            <MobileCard className="p-4 flex flex-col">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--leaf)" }}>Client Reviews</p>
              {reviewsList.map((r, i) => <ReviewCard key={i} {...r} />)}
            </MobileCard>
          )}

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
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: typeColor(n.category) }}>{n.category}</span>
                      <p className="text-xs font-bold leading-snug line-clamp-2" style={{ color: "#000000" }}>{n.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-2">
              <p className="section-eyebrow mb-3" style={{ color: "var(--leaf)" }}>Similar Freelancers</p>
              <div className="flex flex-col gap-3">
                {related.map((it) => (
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
    </MobileShell>
  );
}
