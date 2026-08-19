import { Link } from "react-router-dom";
import { useState } from "react";
import {
  PinIcon,
  PhoneIcon,
  GlobeIcon,
  MailIcon,
  ShareNodesIcon,
  ShareIcon,
  GalleryLightbox,
} from "./PlaceDetailLayout";

function StarIcon({ filled = true, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="shrink-0">
      <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.5 1.5-6.8-5.2-4.7 6.9-.7L12 2.5z" strokeLinejoin="round" />
    </svg>
  );
}
function SparkIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}
function ClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" />
    </svg>
  );
}
function LaptopIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M2 20h20" />
    </svg>
  );
}
function BriefcaseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
function LinkIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M10 14a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 5.5" />
      <path d="M14 10a5 5 0 00-7.07 0L4.1 12.83a5 5 0 007.07 7.07L12.5 18.5" />
    </svg>
  );
}

function StarRow({ value, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5" style={{ color: "#F5A623" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={size} filled={n <= Math.round(value)} />
      ))}
    </span>
  );
}

const TABS = ["Overview", "Portfolio", "Reviews", "FAQ"];

// ── Freelancer profile — a lighter, more personal variant of the Services
// business profile. Drops the storefront-oriented sections (areas covered,
// opening hours, address/map) that don't apply to an individual working
// remotely or on a project basis, in favour of skills, a portfolio, and
// practical info a client actually wants to know before reaching out. ──
export default function FreelancerDetailLayout({
  breadcrumbs,
  categoryLabel,
  title,
  heroImage,
  description,
  address,
  phone,
  email,
  website,
  social,
  rating,
  reviewCount,
  aboutHeading,
  aboutText,
  skills = [],
  portfolio = [],
  availability,
  workMode,
  responseTime,
  experience,
  reviewsBreakdown = [],
  reviewsList = [],
  faq = [],
  afterGrid,
  relatedHeading,
  related = [],
}) {
  const [tab, setTab] = useState("Overview");
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const websiteHref = website ? (website.startsWith("http") ? website : `https://${website}`) : null;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(title);
  const waShare = `https://wa.me/?text=${t}%20${u}`;

  const totalReviews = reviewsBreakdown.reduce((s, r) => s + r.count, 0) || reviewCount || 0;
  const portfolioImages = portfolio.map((p) => p.image).filter(Boolean);
  // Maps each portfolio entry to its position within portfolioImages (for
  // the lightbox), or -1 for a link-only entry with no image.
  let imgCounter = -1;
  const portfolioImageIndex = portfolio.map((p) => (p.image ? ++imgCounter : -1));

  // A portfolio entry isn't always a photo — a freelancer might instead
  // want to point to a piece of work hosted elsewhere (a live site, a
  // Behance/Dribbble case study, a YouTube reel, etc). Each tile renders as
  // either a clickable image (opens the lightbox) or a link card (opens the
  // external site, going through the sitewide "leaving our website"
  // confirmation like every other outbound link).
  const PortfolioTile = ({ p, index, big = false }) => {
    const shapeClass = big ? "col-span-2 sm:row-span-2 aspect-[16/9] sm:aspect-auto" : "aspect-square";
    if (p.image) {
      return (
        <button type="button" onClick={() => setGalleryIndex(portfolioImageIndex[index])} className={`${shapeClass} overflow-hidden cursor-pointer`}>
          <img src={p.image} alt={p.title || `${title} portfolio ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
        </button>
      );
    }
    if (p.link) {
      return (
        <a
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`${shapeClass} flex flex-col items-center justify-center gap-2 text-center p-3 transition-colors hover:opacity-80`}
          style={{ backgroundColor: "var(--sand)" }}
        >
          <LinkIcon size={22} />
          <span className="text-xs font-semibold leading-snug line-clamp-3" style={{ color: "var(--forest)" }}>{p.title || p.link}</span>
        </a>
      );
    }
    return null;
  };

  const Section = ({ heading, children, className = "" }) => (
    <div className={`bg-white p-6 md:p-7 ${className}`} style={{ boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
      {heading && <h3 className="text-lg font-bold mb-4" style={{ color: "#000000" }}>{heading}</h3>}
      {children}
    </div>
  );

  const infoRows = [
    availability && { icon: <SparkIcon />, label: "Availability", value: availability },
    workMode && { icon: <LaptopIcon />, label: "Works", value: workMode },
    responseTime && { icon: <ClockIcon />, label: "Response Time", value: responseTime },
    experience && { icon: <BriefcaseIcon />, label: "Experience", value: experience },
  ].filter(Boolean);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6">
        {/* ── Breadcrumb ── */}
        <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2 opacity-40">/</span>}
              {b.to ? <Link to={b.to} className="hover:opacity-70 transition-opacity">{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          {/* ══ Main column ══ */}
          <div className="min-w-0">
            {/* ── Profile header — one profile picture, name, rating, skills ── */}
            <div className="bg-white p-5 md:p-7 flex flex-col sm:flex-row gap-5 mb-6" style={{ boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
              <div className="w-full sm:w-36 h-36 shrink-0 overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
                <img src={heroImage} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl mb-1.5" style={{ color: "#000000" }}>{title}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-3 text-sm" style={{ color: "#000000" }}>
                  <StarRow value={rating} />
                  <span className="font-semibold">{rating?.toFixed(1)}</span>
                  <span className="opacity-70">({totalReviews} reviews)</span>
                  <span className="opacity-40">·</span>
                  <span>{categoryLabel}</span>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.slice(0, 8).map((s) => (
                      <span key={s} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--sand)", color: "var(--forest)", boxShadow: "0 0 0 1px rgba(28,46,56,0.1)" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {description && (
                  <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{description}</p>
                )}
              </div>
            </div>

            {/* ── Portfolio preview — same asymmetric big-image + two-tile
                layout as the Services/Eat & Drink gallery preview, with a
                link into the full Portfolio tab for the rest. ── */}
            {portfolio.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {portfolio.slice(0, 3).map((p, i) => (
                    <PortfolioTile key={i} p={p} index={i} big={i === 0} />
                  ))}
                </div>
                {portfolio.length > 3 && (
                  <button type="button" onClick={() => setTab("Portfolio")} className="mt-3 text-sm font-semibold cursor-pointer" style={{ color: "var(--leaf)" }}>
                    See full portfolio →
                  </button>
                )}
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="flex items-center gap-5 md:gap-7 mb-6 overflow-x-auto border-b" style={{ borderColor: "rgba(28,46,56,0.12)" }}>
              {TABS.map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => setTab(tb)}
                  className="pb-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
                  style={{
                    color: tab === tb ? "var(--leaf)" : "rgba(0,0,0,0.55)",
                    borderBottom: tab === tb ? "2px solid var(--leaf)" : "2px solid transparent",
                  }}
                >
                  {tb}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-6">
              {tab === "Overview" && (
                <>
                  <Section heading={aboutHeading}>
                    <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{aboutText}</p>
                  </Section>

                  {skills.length > 0 && (
                    <Section heading="Skills">
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s) => (
                          <span key={s} className="text-sm font-semibold px-3.5 py-2 rounded-full" style={{ backgroundColor: "var(--sand)", color: "var(--forest)", boxShadow: "0 0 0 1px rgba(28,46,56,0.1)" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}

                  <Section heading="Client Reviews">
                    <ReviewsSummary rating={rating} totalReviews={totalReviews} breakdown={reviewsBreakdown} />
                    {reviewsList[0] && <ReviewCard {...reviewsList[0]} />}
                    {reviewsList.length > 0 && (
                      <button type="button" onClick={() => setTab("Reviews")} className="mt-4 text-sm font-semibold cursor-pointer" style={{ color: "var(--leaf)" }}>View all reviews →</button>
                    )}
                  </Section>
                </>
              )}

              {tab === "Portfolio" && (
                <Section heading="Portfolio">
                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {portfolio.map((p, i) => (
                        <PortfolioTile key={i} p={p} index={i} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "#000000" }}>No portfolio examples added yet.</p>
                  )}
                </Section>
              )}

              {tab === "Reviews" && (
                <Section heading="Client Reviews">
                  <ReviewsSummary rating={rating} totalReviews={totalReviews} breakdown={reviewsBreakdown} />
                  <div className="flex flex-col gap-4 mt-2">
                    {reviewsList.map((r, i) => <ReviewCard key={i} {...r} />)}
                  </div>
                </Section>
              )}

              {tab === "FAQ" && (
                <Section heading="Frequently Asked Questions">
                  <div className="flex flex-col gap-5">
                    {faq.slice(0, 8).map((f, i, arr) => (
                      <div key={i} className={i < arr.length - 1 ? "pb-5 border-b" : ""} style={i < arr.length - 1 ? { borderColor: "rgba(28,46,56,0.1)" } : undefined}>
                        <div className="font-semibold text-sm mb-1.5" style={{ color: "#000000" }}>{f.q}</div>
                        <div className="text-sm leading-relaxed" style={{ color: "#000000" }}>{f.a}</div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </div>

          {/* ══ Sidebar ══ */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 self-start">
            {/* CTA + remaining contact details — one continuous card */}
            <div className="bg-white p-5 flex flex-col gap-3" style={{ boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
              {phone && (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}>
                  <PhoneIcon size={16} /> Call Now {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm border transition-colors hover:bg-black/[0.03]" style={{ borderColor: "rgba(28,46,56,0.15)", color: "var(--forest)" }}>
                  <MailIcon size={16} /> Get in Touch
                </a>
              )}
              {websiteHref && (
                <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-sm border transition-colors hover:bg-black/[0.03]" style={{ borderColor: "rgba(28,46,56,0.15)", color: "var(--forest)" }}>
                  <GlobeIcon size={16} /> Visit Website
                </a>
              )}
              <div className="grid grid-cols-1">
                <button type="button" onClick={() => setShareOpen(true)} className="flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-colors hover:bg-black/[0.03] cursor-pointer" style={{ borderColor: "rgba(28,46,56,0.15)", color: "var(--forest)" }}>
                  <ShareNodesIcon size={16} /> Share Profile
                </button>
              </div>

              {(address || social?.length > 0) && (
                <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
                  {address && (
                    <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                      <span className="mt-0.5" style={{ color: "var(--leaf)" }}><PinIcon /></span>
                      <span className="leading-relaxed">{address}</span>
                    </div>
                  )}
                </div>
              )}
              {social?.length > 0 && (
                <div className="flex items-center gap-3">
                  {social.map((sl) => (
                    <a key={sl.icon} href={sl.href} target="_blank" rel="noopener noreferrer" aria-label={sl.label} title={sl.label} className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: "var(--leaf)", color: "#fff" }}>
                      <ShareIcon name={sl.icon} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Practical info a prospective client actually needs, in place
                of storefront details like opening hours or areas covered. */}
            {infoRows.length > 0 && (
              <Section heading="Working With Me">
                <div className="flex flex-col gap-3.5">
                  {infoRows.map((r) => (
                    <div key={r.label} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5" style={{ color: "var(--leaf)" }}>{r.icon}</span>
                      <div className="min-w-0">
                        <div className="opacity-60 text-xs" style={{ color: "#000000" }}>{r.label}</div>
                        <div className="font-semibold" style={{ color: "#000000" }}>{r.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {afterGrid}

      {related.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 pb-16">
          <section className="pt-16">
            <h2 className="hero-title uppercase text-2xl md:text-3xl mb-5" style={{ color: "#000000" }}>{relatedHeading}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((it) => (
                <Link key={it.slug} to={it.to} className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    {it.rating && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: "#000000" }}>
                        <StarRow value={it.rating} size={11} /> <span className="opacity-70">({it.reviewCount})</span>
                      </div>
                    )}
                    <h3 className="font-bold text-sm leading-snug line-clamp-1" style={{ color: "#000000" }}>{it.name}</h3>
                    {it.category && <p className="text-xs opacity-70" style={{ color: "#000000" }}>{it.category}</p>}
                    <span className="text-xs font-semibold mt-1" style={{ color: "var(--leaf)" }}>View Profile</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={() => setShareOpen(false)}>
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold" style={{ color: "#000000" }}>Share</h3>
              <button onClick={() => setShareOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold" style={{ backgroundColor: "var(--forest)" }}>✕</button>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="w-full py-3.5 rounded-xl border text-sm font-medium mb-3 transition-colors"
              style={{ borderColor: "rgba(28,46,56,0.15)", color: copied ? "var(--leaf)" : "var(--forest)" }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            {[
              { label: "Email", icon: "email", href: `mailto:?subject=${t}&body=${u}` },
              { label: "WhatsApp", icon: "whatsapp", href: waShare },
              { label: "Facebook", icon: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
              { label: "X", icon: "x", href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
            ].map((opt) => (
              <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full py-3.5 px-1 border-t text-sm font-medium" style={{ borderColor: "rgba(28,46,56,0.1)", color: "#000000" }} onClick={() => setShareOpen(false)}>
                <span className="w-6 flex justify-center" style={{ color: "var(--leaf)" }}><ShareIcon name={opt.icon} /></span>
                {opt.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {galleryIndex !== null && (
        <GalleryLightbox
          images={portfolioImages}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onStep={(delta) => setGalleryIndex((i) => (i + delta + portfolioImages.length) % portfolioImages.length)}
        />
      )}
    </div>
  );
}

function ReviewsSummary({ rating, totalReviews, breakdown }) {
  const max = Math.max(...breakdown.map((b) => b.count), 1);
  return (
    <div className="flex flex-col sm:flex-row gap-6 mb-5 pb-5 border-b" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
      <div className="text-center sm:w-28 shrink-0">
        <div className="text-4xl font-bold" style={{ color: "#000000" }}>{rating?.toFixed(1)}</div>
        <StarRow value={rating} size={16} />
        <div className="text-xs opacity-60 mt-1" style={{ color: "#000000" }}>Based on {totalReviews} reviews</div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        {breakdown.map((b) => (
          <div key={b.stars} className="flex items-center gap-2 text-xs" style={{ color: "#000000" }}>
            <span className="w-3">{b.stars}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(28,46,56,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: `${(b.count / max) * 100}%`, backgroundColor: "#F5A623" }} />
            </div>
            <span className="w-6 text-right opacity-60">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ name, area, stars, timeAgo, text }) {
  return (
    <div className="flex gap-3 py-4 border-b last:border-b-0" style={{ borderColor: "rgba(28,46,56,0.08)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}>
        {name?.[0]}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm" style={{ color: "#000000" }}>{name}</span>
          <span className="text-xs opacity-50" style={{ color: "#000000" }}>{area}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 mb-1.5">
          <StarRow value={stars} size={12} />
          <span className="text-xs opacity-50" style={{ color: "#000000" }}>{timeAgo}</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{text}</p>
      </div>
    </div>
  );
}
