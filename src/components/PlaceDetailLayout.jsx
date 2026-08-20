import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LocationMap from "./LocationMap";

// ── Gallery lightbox — full-screen image with prev/next arrows, a counter,
// and keyboard/backdrop-click dismissal. Shared by every detail page's
// photo grid. ──
export function GalleryLightbox({ images, index, onClose, onStep }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onStep(-1);
      if (e.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onStep]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 md:top-6 md:right-6 text-white hover:opacity-70 transition-opacity z-10 cursor-pointer"
        style={{ fontSize: 26, lineHeight: 1 }}
      >
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onStep(-1); }}
            aria-label="Previous photo"
            className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center text-white transition-colors hover:bg-white/10 cursor-pointer"
            style={{ fontSize: 22 }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onStep(1); }}
            aria-label="Next photo"
            className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full items-center justify-center text-white transition-colors hover:bg-white/10 cursor-pointer"
            style={{ fontSize: 22 }}
          >
            ›
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain"
      />

      {images.length > 1 && (
        <div
          className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 text-white text-sm"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
        >
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// ── Shared icon set — used across the meta rows, contact block and share UI ──
export function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
export function PinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
export function TicketIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 9a2 2 0 002-2V5h14v2a2 2 0 000 4v2a2 2 0 000 4v2H5v-2a2 2 0 00-2-2V9z" /><path d="M9 5v14" strokeDasharray="2 2" />
    </svg>
  );
}
export function GlobeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}
export function PhoneIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
    </svg>
  );
}
export function MailIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
    </svg>
  );
}
export function ShareNodesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
export function ShareIcon({ name }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24" };
  if (name === "instagram") return (<svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" /></svg>);
  if (name === "facebook") return (<svg {...p} fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5z" /></svg>);
  if (name === "x") return (<svg {...p} fill="currentColor"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.3-5.6L6.3 21H3.3l7-8L2.6 3h6.1l3.9 5.1L17.5 3zm-2.1 16h1.6L8.7 4.7H7L15.4 19z" /></svg>);
  if (name === "whatsapp") return (<svg {...p} fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.5c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.2 7.2 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 6.5 10a4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6.1c.5-.1 1.4-.6 1.6-1.1s.2-1 .1-1.1-.3-.2-.5-.3z" /></svg>);
  return (<svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
}

function normalizeUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `https://${url}`;
}

// ── The one shared body used by every place/event detail page ──
// (See & Do events, Eat & Drink businesses, Shop businesses, Services
// businesses) so all four read as one consistent design:
//   1. single main hero image (no carousel/thumbnails in the hero)
//   2. category · title · description
//   3. opening hours / contact / social — then Visit Website, Get
//      Directions, Get the App and Share buttons
//   4. up to 6 additional photos, 2 per row
//   5. location map
//   6. "related" grid
export default function PlaceDetailLayout({
  breadcrumbs,
  categoryLabel,
  categoryColor = "var(--leaf)",
  title,
  heroImage,
  extraImages = [],
  metaRows = [],
  description,
  hours,
  address,
  phone,
  email,
  website,
  social,
  directionsQuery,
  shareTitle,
  relatedHeading,
  related = [],
  afterGallery,
  afterMap,
  extraButtonLabel,
  extraButtonHref,
  // Optional extra pills rendered alongside the category pill — same
  // styling, just additional badges (e.g. a star rating) for listing types
  // that need one more piece of at-a-glance info than the base layout.
  extraBadges,
  relatedBackground = "var(--sand)",
  // Optional "back to listing" link rendered under the breadcrumb — used by
  // the What's On event page to point back to the full events calendar.
  backLink,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [showStickyBooking, setShowStickyBooking] = useState(false);
  const galleryImages = extraImages.slice(0, 6);

  // Sticky "Make a booking" button — floats in once the page's own booking
  // button (in the info card) has scrolled out of view, so it's always
  // reachable without duplicating the CTA above the fold.
  useEffect(() => {
    if (extraButtonLabel !== "Booking") return;
    const onScroll = () => setShowStickyBooking(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [extraButtonLabel]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(shareTitle || title);
  const waShare = `https://wa.me/?text=${t}%20${u}`;
  const websiteHref = normalizeUrl(website);

  // The info card's action rail. Built as data so the rail can render each
  // entry identically (circular icon + label) and place dividers between
  // them, whichever subset of actions this listing actually has.
  const actions = [
    websiteHref && {
      label: "Visit Website",
      href: websiteHref,
      icon: <GlobeIcon size={22} />,
    },
    extraButtonLabel && {
      label: extraButtonLabel,
      href: extraButtonHref || websiteHref || "#",
      icon: <TicketIcon size={22} />,
    },
    directionsQuery && {
      label: "Get Directions",
      href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`,
      icon: <PinIcon size={22} />,
    },
  ].filter(Boolean);

  // Tagline shown under the title above the hero: the first description
  // paragraph, so nothing needs to be authored twice. The remaining
  // paragraphs (if any) still render in their usual place below the hero.
  const firstParagraphText = Array.isArray(description)
    ? (typeof description[0] === "string" ? description[0] : description[0]?.text)
    : description;
  const remainingDescription = Array.isArray(description) ? description.slice(1) : null;

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* ── 1. Title & tagline, centered above the hero ── */}
      <section className="pt-10 md:pt-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="hero-title uppercase text-3xl md:text-6xl mb-4" style={{ color: "#000000" }}>
            {title}
          </h1>
          {firstParagraphText && (
            <p className="text-sm md:text-base uppercase tracking-[0.08em] leading-relaxed" style={{ color: "#000000" }}>
              {firstParagraphText}
            </p>
          )}
        </div>
      </section>

      {/* ── 2. Single main hero image — full width on mobile, 60% on
          desktop, square corners ── */}
      <section className="pt-8 md:pt-10">
        {backLink && (
          <div className="w-[80%] sm:w-[60%] mx-auto mb-3 text-right">
            <Link
              to={backLink.to}
              className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: "#000000" }}
            >
              {backLink.label} <span>→</span>
            </Link>
          </div>
        )}
        <div className="relative w-[80%] sm:w-[60%] mx-auto overflow-hidden aspect-[4/3] sm:aspect-[16/10] bg-black">
          <img src={heroImage} alt={title} className="w-full h-full object-cover" />
        </div>
      </section>

      {/* ── 3. Breadcrumb · category · description ── */}
      <section className="pt-10 md:pt-14 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-5 text-xs font-semibold tracking-[0.02em] uppercase" style={{ color: "var(--leaf)" }}>
            {breadcrumbs.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-2 opacity-40">/</span>}
                {b.to ? (
                  <Link to={b.to} className="hover:opacity-70 transition-opacity">{b.label}</Link>
                ) : (
                  <span>{b.label}</span>
                )}
              </span>
            ))}
          </nav>

          {(categoryLabel || extraBadges) && (
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {categoryLabel && (
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full"
                  style={{ backgroundColor: "#fff", color: "#000000", boxShadow: "0 4px 16px -8px rgba(28,46,56,0.3)" }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColor }} />
                  {categoryLabel}
                </span>
              )}
              {extraBadges}
            </div>
          )}

          {remainingDescription?.length > 0 && (
            <div className="flex flex-col gap-5 mb-2 text-center max-w-3xl mx-auto">
              {remainingDescription.map((p, i) => (
                <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>
                  {typeof p === "string" ? p : (<>{p.lead && <strong>{p.lead} </strong>}{p.text}</>)}
                </p>
              ))}
            </div>
          )}

          {/* ── 3. Info card — opening hours, contact/social and the action
              rail, as three divider-separated columns on a white card. Stacks
              vertically on mobile; the action rail wraps to a grid there. ── */}
          <div
            className="mt-8 overflow-hidden flex flex-col lg:flex-row lg:items-stretch transition-transform duration-300 ease-out hover:scale-[1.015]"
            style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 18px -8px rgba(28,46,56,0.18), 0 0 0 1px rgba(28,46,56,0.07)" }}
          >
              {hours?.length > 0 ? (
                <div
                  className="px-6 py-7 md:px-8 lg:w-[26%] shrink-0 border-b lg:border-b-0 lg:border-r"
                  style={{ borderColor: "rgba(28,46,56,0.1)" }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--leaf)" }}>Opening Hours</h3>
                  <ul className="flex flex-col">
                    {hours.map((h, i) => (
                      <li
                        key={h.day}
                        className="text-sm py-2.5"
                        style={i < hours.length - 1 ? { borderBottom: "1px solid rgba(28,46,56,0.08)" } : undefined}
                      >
                        <div style={{ color: "#000000" }}>{h.day}</div>
                        <div className="font-semibold mt-0.5" style={{ color: "#000000" }}>{h.time}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : metaRows.length > 0 ? (
                // Events have no opening hours — date/time, location and
                // ticket type take this column instead, so every detail page
                // reads as the same card layout.
                <div
                  className="px-6 py-7 md:px-8 lg:w-[26%] shrink-0 border-b lg:border-b-0 lg:border-r"
                  style={{ borderColor: "rgba(28,46,56,0.1)" }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.02em] mb-4" style={{ color: "var(--leaf)" }}>Event Details</h3>
                  <div className="flex flex-col gap-3">
                    {metaRows.map((row, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                        <span className="mt-0.5" style={{ color: "var(--leaf)" }}>{row.icon}</span>
                        <span className="leading-relaxed">{row.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(address || (phone && phone !== "—") || email || social?.length > 0) && (
                <div
                  className="px-6 py-7 md:px-8 lg:w-[28%] shrink-0 border-b lg:border-b-0 lg:border-r"
                  style={{ borderColor: "rgba(28,46,56,0.1)" }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-[0.02em] mb-4" style={{ color: "var(--leaf)" }}>Find Us</h3>

                  <div className="flex flex-col gap-3">
                    {address && (
                      <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                        <span className="mt-0.5" style={{ color: "var(--leaf)" }}><PinIcon /></span>
                        <span className="leading-relaxed">{address}</span>
                      </div>
                    )}
                    {phone && phone !== "—" && (
                      <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                        <span className="mt-0.5" style={{ color: "var(--leaf)" }}><PhoneIcon /></span>
                        <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:underline break-all">{phone}</a>
                      </div>
                    )}
                    {email && (
                      <div className="flex items-start gap-3 text-sm" style={{ color: "#000000" }}>
                        <span className="mt-0.5" style={{ color: "var(--leaf)" }}><MailIcon /></span>
                        <a href={`mailto:${email}`} className="hover:underline break-all">{email}</a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-5">
                    {social?.map((sl) => (
                      <a
                        key={sl.icon}
                        href={sl.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={sl.label}
                        title={sl.label}
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                        style={{ backgroundColor: "var(--leaf)", color: "#fff" }}
                      >
                        <ShareIcon name={sl.icon} />
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShareOpen(true)}
                      aria-label="Share"
                      title="Share"
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ backgroundColor: "var(--leaf)", color: "#fff" }}
                    >
                      <ShareNodesIcon size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Action rail — circular icon buttons with the label beneath,
                  for the listing's own actions (Website/Tickets/Directions).
                  Share moved into the Find Us column next to the social
                  icons, and Get the App is its own full-width bar below the
                  card — neither belongs here anymore since they aren't
                  actions specific to this listing. */}
              <div className="flex-1 min-w-0 px-6 py-7 md:px-8 flex items-center">
                <div className="w-full grid grid-cols-3 gap-y-6 lg:flex lg:flex-nowrap lg:items-start lg:justify-center lg:gap-x-6">
                  {actions.map((a) => {
                    const inner = (
                      <>
                        <span
                          className="w-14 h-14 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-colors"
                          style={{ backgroundColor: "var(--leaf)", color: "#fff" }}
                        >
                          <span className="flex items-center justify-center lg:scale-125">{a.icon}</span>
                        </span>
                        <span className="text-sm lg:text-xs text-center leading-snug" style={{ color: "#000000" }}>{a.label}</span>
                      </>
                    );
                    const cls = "group flex flex-col items-center gap-2.5 lg:gap-2 transition-opacity hover:opacity-70 cursor-pointer";
                    if (a.to) return <Link key={a.label} to={a.to} className={cls}>{inner}</Link>;
                    if (a.onClick) return <button key={a.label} type="button" onClick={a.onClick} className={cls}>{inner}</button>;
                    return <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
                  })}
                </div>
              </div>
            </div>

        {/* ── Get the App — its own bar rather than a small icon in the
            action rail, since downloading the app is a site-wide promo
            rather than an action specific to this listing. Matches the
            card's own width (full-bleed only on mobile, where the card
            itself is full-bleed). Centered content reads clearly as a
            distinct call to action. ── */}
        <Link
          to="/get-the-app"
          className="mt-4 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--forest)", color: "#fff" }}
        >
          <img src="/logo-mark.svg" alt="" aria-hidden="true" className="h-[18px] w-auto shrink-0" />
          <span className="text-sm font-semibold uppercase tracking-[0.06em]">
            The Maidenhead App
          </span>
        </Link>
        </div>
      </section>

      {/* ── 4. Additional photos — up to 6, two per row. 90% width on
          mobile; on desktop matched to the content column above (max-w-4xl)
          then reduced 20% further, square corners. ── */}
      {extraImages.length > 0 && (
        <section className="py-12 md:py-16 px-6 md:px-12">
          <div className="w-[90%] sm:w-full sm:max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              {galleryImages.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGalleryIndex(i)}
                  aria-label={`Enlarge photo ${i + 2}`}
                  className="aspect-[25/24] overflow-hidden cursor-pointer"
                >
                  <img
                    src={src}
                    alt={`${title} ${i + 2}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-110"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {afterGallery}

      {/* ── 5. Location map — 90% width and taller on mobile, 80% width on
          desktop; address shown as an always-open tile above the pin rather
          than a separate text block ── */}
      {directionsQuery && (
        <section className="pb-16">
          <LocationMap
            query={directionsQuery}
            heading={null}
            note={address}
            rounded={false}
            widthClassName="w-[90%] sm:w-[80%]"
            aspectClassName="aspect-[8/5] sm:aspect-[16/9] md:aspect-[21/9]"
          />
        </section>
      )}

      {afterMap}

      {/* ── 6. Related ── */}
      {related.length > 0 && (
        <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: relatedBackground }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="hero-title uppercase text-2xl md:text-3xl mb-8" style={{ color: "#000000" }}>{relatedHeading}</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 md:gap-8">
              {related.map((it) => (
                <Link
                  key={it.slug}
                  to={it.to}
                  className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden" style={it.logo ? { backgroundColor: "var(--mint)" } : undefined}>
                    {it.logo ? (
                      <img src={it.logo} alt={it.name} loading="lazy" className="w-full h-full object-contain p-3 sm:p-10 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    {it.tag && (
                      <span className="absolute top-1 left-1 sm:top-3 sm:left-3 inline-flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#000000" }}>
                        {it.tagDotColor && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: it.tagDotColor }} />}
                        {it.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 sm:gap-2 p-2 sm:p-6">
                    {!it.tag && it.category && <span className="text-[8px] sm:text-[11px] font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{it.category}</span>}
                    <h3 className="font-bold text-xs sm:text-xl leading-snug line-clamp-2" style={{ color: "#000000" }}>{it.name}</h3>
                    {it.date && <p className="text-[9px] sm:text-xs line-clamp-1" style={{ color: "#000000" }}>{it.date}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Share modal ── */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShareOpen(false)}
        >
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold" style={{ color: "#000000" }}>Share</h3>
              <button
                onClick={() => setShareOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{ backgroundColor: "var(--forest)" }}
              >✕</button>
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
              { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/" },
            ].map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full py-3.5 px-1 border-t text-sm font-medium"
                style={{ borderColor: "rgba(28,46,56,0.1)", color: "#000000" }}
                onClick={() => setShareOpen(false)}
              >
                <span className="w-6 flex justify-center" style={{ color: "var(--leaf)" }}>
                  <ShareIcon name={opt.icon} />
                </span>
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

      {/* Sticky booking button — floats with the page scroll once the
          in-card booking button is out of view. */}
      {extraButtonLabel === "Booking" && (
        <a
          href={extraButtonHref || websiteHref || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed z-40 bottom-6 right-6 inline-flex items-center gap-2 text-sm font-bold px-5 py-3.5 rounded-full transition-all duration-300"
          style={{
            backgroundColor: "var(--leaf)",
            color: "#ffffff",
            boxShadow: "0 10px 30px -8px rgba(28,46,56,0.5)",
            opacity: showStickyBooking ? 1 : 0,
            transform: showStickyBooking ? "translateY(0)" : "translateY(16px)",
            pointerEvents: showStickyBooking ? "auto" : "none",
          }}
        >
          <TicketIcon size={18} /> Make a Booking
        </a>
      )}
    </div>
  );
}
