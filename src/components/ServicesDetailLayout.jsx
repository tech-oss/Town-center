import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import LocationMap from "./LocationMap";
import {
  PinIcon,
  PhoneIcon,
  GlobeIcon,
  MailIcon,
  ShareNodesIcon,
  ShareIcon,
  GalleryLightbox,
  ActionCircle,
} from "./PlaceDetailLayout";

function StarIcon({ filled = true, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="shrink-0">
      <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.5 1.5-6.8-5.2-4.7 6.9-.7L12 2.5z" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function BadgeIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="8" r="6" /><path d="M9 13.5 7 22l5-3 5 3-2-8.5" />
    </svg>
  );
}
function CardIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
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

const TABS = ["Overview", "Services", "Reviews", "Photos", "Areas Covered", "FAQ"];

// ── The Services business-profile page — a distinct, richer layout used
// only for /services/place/:slug, modeled on a classic local-directory
// profile: one continuous two-column grid (≈68% main / 32% sidebar) so the
// sidebar sits alongside the header, gallery, tabs and overview content
// from the very top of the page, not just below them. Does not affect
// See & Do / Eat & Drink / Shop, which keep PlaceDetailLayout. ──
export default function ServicesDetailLayout({
  breadcrumbs,
  categoryLabel,
  title,
  heroImage,
  extraImages = [],
  description,
  hours,
  address,
  phone,
  email,
  website,
  social,
  directionsQuery,
  rating,
  reviewCount,
  badges = [],
  aboutHeading,
  aboutText,
  stats = [],
  servicesOffered = [],
  whyChooseUs = [],
  areasCovered = [],
  reviewsBreakdown = [],
  reviewsList = [],
  accreditations = [],
  faq = [],
  afterGrid,
  relatedHeading,
  related = [],
}) {
  const [tab, setTab] = useState("Overview");
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const tabsRef = useRef(null);

  // Switching tabs (including the "View all …" shortcuts below) can make the
  // page much shorter than the scroll position the user is currently at —
  // without this, the viewport stays at the same pixel offset and appears to
  // jump down near the footer. Scroll the tab bar back into view instead.
  const goToTab = (tb) => {
    setTab(tb);
    // Instant, not smooth — an animated scroll here visibly travels down
    // past the tab bar before correcting back up to it, which reads as a
    // jarring double-motion. Snapping directly shows the new tab's content
    // in full immediately.
    tabsRef.current?.scrollIntoView({ block: "start" });
  };

  const galleryImages = [heroImage, ...extraImages].filter(Boolean);
  const websiteHref = website ? (website.startsWith("http") ? website : `https://${website}`) : null;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(title);
  const waShare = `https://wa.me/?text=${t}%20${u}`;

  const defaultReviewSourceUrl = `https://www.google.com/search?q=${encodeURIComponent(`${title} reviews`)}`;

  const Section = ({ heading, children, className = "" }) => (
    <div className={`bg-white p-6 md:p-7 ${className}`} style={{ boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
      {heading && <h3 className="text-lg font-bold mb-4" style={{ color: "#000000" }}>{heading}</h3>}
      {children}
    </div>
  );

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6">
        {/* ── 1. Breadcrumb ── */}
        <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-2 opacity-40">/</span>}
              {b.to ? <Link to={b.to} className="hover:opacity-70 transition-opacity">{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </nav>

        {/* ── One continuous 2-column grid: ~68% main / 32% sidebar. The
            sidebar starts here (top of the header) and runs the full
            height of the profile, alongside the gallery/tabs/overview
            content below — not just next to the header. ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          {/* ══ Main column (~68%) ══ */}
          <div className="min-w-0">
            {/* ── 2. Business header ── */}
            <div className="bg-white p-5 md:p-7 flex flex-col sm:flex-row gap-5 mb-6" style={{ boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
              <div className="w-full sm:w-36 h-36 shrink-0 overflow-hidden" style={{ backgroundColor: "var(--forest)" }}>
                <img src={heroImage} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl md:text-3xl" style={{ color: "#000000" }}>{title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3 text-sm" style={{ color: "#000000" }}>
                  <span>{categoryLabel}</span>
                </div>
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {badges.map((b) => (
                      <span key={b} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--sand)", color: "var(--forest)", boxShadow: "0 0 0 1px rgba(28,46,56,0.1)" }}>
                        {b}
                      </span>
                    ))}
                  </div>
                )}
                {description && (
                  <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{description}</p>
                )}
              </div>
            </div>

            {/* ── 3. Photo gallery — the business's profile picture is the
                header image above; here just three supporting photos, with
                a link into the full Photos tab for the rest. ── */}
            {galleryImages.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => setGalleryIndex(0)} className="col-span-2 sm:row-span-2 aspect-[16/9] sm:aspect-auto overflow-hidden cursor-pointer">
                    <img src={galleryImages[0]} alt={title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                  </button>
                  {galleryImages.slice(1, 3).map((src, i) => (
                    <button key={i} type="button" onClick={() => setGalleryIndex(i + 1)} className="aspect-square overflow-hidden cursor-pointer">
                      <img src={src} alt={`${title} ${i + 2}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                    </button>
                  ))}
                </div>
                {galleryImages.length > 3 && (
                  <button type="button" onClick={() => goToTab("Photos")} className="mt-3 text-sm font-semibold cursor-pointer" style={{ color: "var(--leaf)" }}>
                    See all {galleryImages.length} photos →
                  </button>
                )}
              </div>
            )}

            {/* ── 4. Profile tabs — full width of the main column ── */}
            <div ref={tabsRef} className="flex items-center gap-5 md:gap-7 mb-6 overflow-x-auto border-b" style={{ borderColor: "rgba(28,46,56,0.12)", scrollMarginTop: "96px" }}>
              {TABS.map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => goToTab(tb)}
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
                  {/* ── 5. About — full main-column width, stats row underneath ── */}
                  <Section heading={aboutHeading}>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: "#000000" }}>{aboutText}</p>
                    {stats.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
                        {stats.map((s) => (
                          <div key={s.label} className="text-center">
                            <div className="text-lg font-bold" style={{ color: "var(--leaf)" }}>{s.value}</div>
                            <div className="text-xs" style={{ color: "#000000" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* ── 6. Services + Why Choose Us — two equal-width cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Section heading="Services We Offer">
                      <ul className="flex flex-col gap-2.5">
                        {servicesOffered.slice(0, 8).map((s) => (
                          <li key={s} className="flex items-center gap-2.5 text-sm" style={{ color: "#000000" }}>
                            <span style={{ color: "var(--leaf)" }}><CheckIcon /></span>{s}
                          </li>
                        ))}
                      </ul>
                      {servicesOffered.length > 0 && (
                        <button type="button" onClick={() => goToTab("Services")} className="mt-4 text-sm font-semibold cursor-pointer" style={{ color: "var(--leaf)" }}>View all services →</button>
                      )}
                    </Section>
                    <Section heading="Why Choose Us?">
                      <ul className="flex flex-col gap-2.5">
                        {whyChooseUs.map((w) => (
                          <li key={w} className="flex items-center gap-2.5 text-sm" style={{ color: "#000000" }}>
                            <span style={{ color: "var(--leaf)" }}><BadgeIcon /></span>{w}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  </div>

                  {/* ── 7. Areas We Cover + Opening Hours — two equal-width cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Section heading="Areas We Cover">
                      <p className="text-sm mb-4" style={{ color: "#000000" }}>{title} provides service across the following areas.</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {areasCovered.slice(0, 6).map((a) => (
                          <span key={a} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--sand)", color: "var(--forest)", boxShadow: "0 0 0 1px rgba(28,46,56,0.1)" }}>{a}</span>
                        ))}
                      </div>
                      <button type="button" onClick={() => goToTab("Areas Covered")} className="text-sm font-semibold cursor-pointer" style={{ color: "var(--leaf)" }}>View all areas →</button>
                    </Section>
                    {hours?.length > 0 && (
                      <Section heading="Opening Hours">
                        <ul className="flex flex-col">
                          {hours.map((h, i) => (
                            <li key={h.day} className="flex items-center justify-between text-sm py-2" style={i < hours.length - 1 ? { borderBottom: "1px solid rgba(28,46,56,0.08)" } : undefined}>
                              <span style={{ color: "#000000" }}>{h.day}</span>
                              <span className="font-semibold" style={{ color: h.time === "Closed" ? "#C0392B" : "#000000" }}>{h.time}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                  </div>

                  {/* ── 8. Customer Reviews — full main-column width ── */}
                  <Section heading="Customer Reviews">
                    {reviewsList[0] && <ReviewCard {...reviewsList[0]} sourceUrl={reviewsList[0].sourceUrl || defaultReviewSourceUrl} />}
                    <button type="button" onClick={() => goToTab("Reviews")} className="mt-4 text-sm font-semibold cursor-pointer" style={{ color: "var(--leaf)" }}>View all reviews →</button>
                  </Section>
                </>
              )}

              {tab === "Services" && (
                <Section heading="Services We Offer">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {servicesOffered.map((s) => (
                      <li key={s} className="flex items-center gap-2.5 text-sm" style={{ color: "#000000" }}>
                        <span style={{ color: "var(--leaf)" }}><CheckIcon /></span>{s}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {tab === "Reviews" && (
                <Section heading="Customer Reviews">
                  <div className="flex flex-col gap-4">
                    {reviewsList.map((r, i) => <ReviewCard key={i} {...r} sourceUrl={r.sourceUrl || defaultReviewSourceUrl} />)}
                  </div>
                </Section>
              )}

              {tab === "Photos" && (
                <Section heading="Photos">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((src, i) => (
                      <button key={i} type="button" onClick={() => setGalleryIndex(i)} className="aspect-square overflow-hidden cursor-pointer">
                        <img src={src} alt={`${title} ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {tab === "Areas Covered" && (
                <Section heading="Areas We Cover">
                  <p className="text-sm mb-5" style={{ color: "#000000" }}>{title} provides service across the following areas.</p>
                  <div className="flex flex-wrap gap-2">
                    {areasCovered.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ backgroundColor: "var(--sand)", color: "var(--forest)", boxShadow: "0 0 0 1px rgba(28,46,56,0.1)" }}>
                        <PinIcon size={14} />{a}
                      </span>
                    ))}
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

          {/* ══ Sidebar (~32%) — starts at the very top, alongside the
              header, and runs down next to the gallery/tabs/overview
              content the whole way. ══ */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 self-start">
            {/* CTA rail + remaining contact details — one continuous card */}
            <div className="bg-white p-5 flex flex-col gap-3" style={{ boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}>
              {phone && (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--forest)", color: "#ffffff" }}>
                  <PhoneIcon size={16} /> Call Now {phone}
                </a>
              )}
              <div className="grid grid-cols-3 gap-2">
                {websiteHref && (
                  <ActionCircle
                    href={websiteHref}
                    label="Visit Website"
                    icon={<GlobeIcon size={20} />}
                  />
                )}
                {directionsQuery && (
                  <ActionCircle
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`}
                    label="Get Directions"
                    icon={<PinIcon size={20} />}
                  />
                )}
                <ActionCircle
                  onClick={() => setShareOpen(true)}
                  label="Share"
                  icon={<ShareNodesIcon size={18} />}
                />
              </div>

              {(address || email) && (
                <div className="flex flex-col gap-3 pt-3 border-t" style={{ borderColor: "rgba(28,46,56,0.1)" }}>
                  {email && (
                    <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                      <span className="mt-0.5" style={{ color: "var(--leaf)" }}><MailIcon /></span>
                      <a href={`mailto:${email}`} className="hover:underline break-all">{email}</a>
                    </div>
                  )}
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

            {hours?.length > 0 && (
              <Section heading="Opening Hours">
                <ul className="flex flex-col">
                  {hours.map((h, i) => (
                    <li key={h.day} className="flex items-center justify-between text-sm py-2" style={i < hours.length - 1 ? { borderBottom: "1px solid rgba(28,46,56,0.08)" } : undefined}>
                      <span style={{ color: "#000000" }}>{h.day}</span>
                      <span className="font-semibold" style={{ color: h.time === "Closed" ? "#C0392B" : "#000000" }}>{h.time}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {directionsQuery && (
              <Section heading={null} className="p-0! overflow-hidden">
                <LocationMap query={directionsQuery} heading={null} note={null} rounded={false} widthClassName="w-full" aspectClassName="aspect-[4/3]" />
                <div className="p-4">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-colors hover:bg-black/[0.03]" style={{ borderColor: "rgba(28,46,56,0.15)", color: "var(--forest)" }}>
                    Get Directions
                  </a>
                </div>
              </Section>
            )}

            {accreditations.length > 0 && (
              <Section heading="Accreditations & Certifications">
                <div className="flex flex-wrap gap-2">
                  {accreditations.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--sand)", color: "var(--forest)", boxShadow: "0 0 0 1px rgba(28,46,56,0.1)" }}>
                      <CardIcon size={13} />{a}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* ── News & Offers — same full-width glassmorphic section as Eat &
          Drink / See & Do / Shop detail pages, sitting between the profile
          grid and Similar Businesses. ── */}
      {afterGrid}

      {/* ── 9. Similar businesses — full-width 4-card grid below both columns ── */}
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
          images={galleryImages}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onStep={(delta) => setGalleryIndex((i) => (i + delta + galleryImages.length) % galleryImages.length)}
        />
      )}
    </div>
  );
}


function ReviewCard({ area, stars, timeAgo, text, sourceUrl }) {
  return (
    <div className="py-4 border-b last:border-b-0" style={{ borderColor: "rgba(28,46,56,0.08)" }}>
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <StarRow value={stars} size={12} />
        <span className="text-xs opacity-50" style={{ color: "#000000" }}>{timeAgo}</span>
        {area && <span className="text-xs opacity-50" style={{ color: "#000000" }}>· {area}</span>}
      </div>
      <p className="text-sm leading-relaxed mb-2.5" style={{ color: "#000000" }}>{text}</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          style={{ backgroundColor: "var(--sand)", color: "var(--forest)" }}
        >
          Read verified review <span>↗</span>
        </a>
      )}
    </div>
  );
}
