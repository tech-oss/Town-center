import { Link } from "react-router-dom";
import { useState } from "react";
import LocationMap from "./LocationMap";

// ── Shared icon set — used across the meta rows, contact block and share UI ──
export function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
export function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
export function TicketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M3 9a2 2 0 002-2V5h14v2a2 2 0 000 4v2a2 2 0 000 4v2H5v-2a2 2 0 00-2-2V9z" /><path d="M9 5v14" strokeDasharray="2 2" />
    </svg>
  );
}
export function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
}
function ShareIcon({ name }) {
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
  afterMap,
  extraButtonLabel,
  extraButtonHref,
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const u = encodeURIComponent(shareUrl);
  const t = encodeURIComponent(shareTitle || title);
  const waShare = `https://wa.me/?text=${t}%20${u}`;
  const websiteHref = normalizeUrl(website);

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      {/* ── 1. Single main hero image — 80% page width, square corners ── */}
      <section className="pt-6 md:pt-10">
        <div className="relative w-[80%] mx-auto overflow-hidden h-[60vh] md:h-[75vh] min-h-[420px] bg-black">
          <img src={heroImage} alt={title} className="w-full h-full object-cover" />
        </div>
      </section>

      {/* ── 2. Category · title · description ── */}
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

          {categoryLabel && (
            <span
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full mb-5"
              style={{ backgroundColor: "#fff", color: "#000000", boxShadow: "0 4px 16px -8px rgba(28,46,56,0.3)" }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColor }} />
              {categoryLabel}
            </span>
          )}

          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6" style={{ color: "#000000" }}>
            {title}
          </h1>

          {metaRows.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {metaRows.map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-base" style={{ color: "#000000" }}>
                  <span style={{ color: "#000000" }}>{row.icon}</span>
                  <span>{row.text}</span>
                </div>
              ))}
            </div>
          )}

          {description && (
            <div className="flex flex-col gap-5 mb-2">
              {Array.isArray(description)
                ? description.map((p, i) => (
                    <p key={i} className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>
                      {typeof p === "string" ? p : (<>{p.lead && <strong>{p.lead} </strong>}{p.text}</>)}
                    </p>
                  ))
                : <p className="text-base md:text-lg leading-relaxed" style={{ color: "#000000" }}>{description}</p>}
            </div>
          )}

          {/* ── 3. Opening hours / contact / social, then the action buttons —
              always rendered so Get the App / Share stay consistent even when
              an item has no hours/contact/website/directions data. ── */}
          <div className="mt-8 p-6 md:p-7 rounded-3xl flex flex-col gap-6" style={{ backgroundColor: "var(--sand)" }}>
              {hours?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--leaf)" }}>Opening Hours</h3>
                  <ul className="flex flex-col gap-1.5 max-w-sm">
                    {hours.map((h) => (
                      <li key={h.day} className="flex justify-between text-sm">
                        <span style={{ color: "#000000" }}>{h.day}</span>
                        <span className="font-semibold" style={{ color: "#000000" }}>{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(address || (phone && phone !== "—") || email) && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.02em] mb-3" style={{ color: "var(--leaf)" }}>Find Us</h3>
                  {address && <p className="text-sm leading-relaxed mb-2" style={{ color: "#000000" }}>{address}</p>}
                  {phone && phone !== "—" && (
                    <p className="text-sm" style={{ color: "#000000" }}><span className="font-semibold">Tel:</span> {phone}</p>
                  )}
                  {email && (
                    <p className="text-sm" style={{ color: "#000000" }}><span className="font-semibold">Email:</span> {email}</p>
                  )}
                </div>
              )}

              {social?.length > 0 && (
                <div className="flex items-center gap-2.5">
                  {social.map((sl) => (
                    <a
                      key={sl.icon}
                      href={sl.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={sl.label}
                      title={sl.label}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                      style={{ backgroundColor: "var(--mint)", color: "var(--forest)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--leaf)"; e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "var(--mint)"; e.currentTarget.style.color = "var(--forest)"; }}
                    >
                      <ShareIcon name={sl.icon} />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-colors"
                    style={{ backgroundColor: "var(--forest)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--forest)")}
                  >
                    <GlobeIcon /> Visit Website
                  </a>
                )}
                {extraButtonLabel && (
                  <a
                    href={extraButtonHref || websiteHref || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-colors"
                    style={{ backgroundColor: "var(--sage)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--leaf)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--sage)")}
                  >
                    <TicketIcon /> {extraButtonLabel}
                  </a>
                )}
                {directionsQuery && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
                    style={{ border: "2px solid var(--forest)", color: "#000000" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--forest)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#000000"; }}
                  >
                    <PinIcon /> Get Directions
                  </a>
                )}
                <Link
                  to="/get-the-app"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors"
                  style={{ border: "2px solid var(--forest)", color: "#000000" }}
                >
                  Get the App
                </Link>
                <button
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-colors border"
                  style={{ borderColor: "rgba(28,46,56,0.2)", color: "#000000" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
        </div>
      </section>

      {/* ── 4. Additional photos — up to 6, two per row. 80% page width, 20%
          taller than square, square corners. ── */}
      {extraImages.length > 0 && (
        <section className="py-12 md:py-16 px-6 md:px-12">
          <div className="w-[80%] mx-auto">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {extraImages.slice(0, 6).map((src, i) => (
                <div key={i} className="aspect-[5/6] overflow-hidden">
                  <img src={src} alt={`${title} ${i + 2}`} loading="lazy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. Location map — 80% page width, address shown as an always-open
          tile above the pin rather than a separate text block ── */}
      {directionsQuery && (
        <section className="pb-16">
          <LocationMap query={directionsQuery} heading={null} note={address} rounded={false} width="80%" />
        </section>
      )}

      {afterMap}

      {/* ── 6. Related ── */}
      {related.length > 0 && (
        <section className="py-16 md:py-20 px-6 md:px-12" style={{ backgroundColor: "var(--sand)" }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "#000000" }}>{relatedHeading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {related.map((it) => (
                <Link
                  key={it.slug}
                  to={it.to}
                  className="group bg-white overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 6px 28px -14px rgba(28,46,56,0.28)" }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden" style={it.logo ? { backgroundColor: "var(--mint)" } : undefined}>
                    {it.logo ? (
                      <img src={it.logo} alt={it.name} loading="lazy" className="w-full h-full object-contain p-10 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <img src={it.image} alt={it.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    {it.tag && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.92)", color: "#000000" }}>
                        {it.tagDotColor && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.tagDotColor }} />}
                        {it.tag}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    {!it.tag && it.category && <span className="text-[11px] font-bold uppercase tracking-[0.02em]" style={{ color: "var(--leaf)" }}>{it.category}</span>}
                    <h3 className="font-bold text-xl leading-snug" style={{ color: "#000000" }}>{it.name}</h3>
                    {it.date && <p className="text-xs" style={{ color: "#000000" }}>{it.date}</p>}
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
    </div>
  );
}
