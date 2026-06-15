import { useState } from "react";
import { Link } from "react-router-dom";
import { footer, header } from "../Data/content";
import AppBadges from "./AppBadges";

// ── Social icons ──────────────────────────────────────────────────────────────
function SocialIcon({ icon }) {
  if (icon === "instagram") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
  if (icon === "facebook") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
  if (icon === "x") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
    </svg>
  );
  if (icon === "linkedin") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
  return null;
}

// ── Nav link (internal or external) ──────────────────────────────────────────
function NavLink({ href, children }) {
  const isInternal = href?.startsWith("/");
  const cls = "text-sm transition-opacity duration-150 hover:opacity-70" ;
  return isInternal
    ? <Link to={href} className={cls} style={{ color: "rgba(255,255,255,0.75)" }}>{children}</Link>
    : <a href={href} className={cls} style={{ color: "rgba(255,255,255,0.75)" }}>{children}</a>;
}

// ── Mobile accordion section ──────────────────────────────────────────────────
function AccordionSection({ heading, links }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-sm font-semibold uppercase tracking-widest text-white"
      >
        {heading}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="pb-4 flex flex-col gap-3">
          {links.map((l) => (
            <li key={l.label}><NavLink href={l.href}>{l.label}</NavLink></li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── App card ──────────────────────────────────────────────────────────────────
function AppCard() {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
      <div>
        <p className="font-bold text-white text-base mb-1">{footer.app.heading}</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{footer.app.body}</p>
      </div>
      <AppBadges className="flex-col" size="sm" />
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
  return (
    <footer className="px-6 md:px-12 pt-12 pb-6" style={{ backgroundColor: "var(--ink)", color: "white" }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Desktop layout ── */}
        <div className="hidden md:grid gap-10 mb-12" style={{ gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.5fr" }}>

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <a href="/" aria-label={header.logoAlt} className="inline-flex flex-col items-start leading-none">
              <span className="flex flex-col items-center">
                <img src={header.markSrc} alt="" aria-hidden="true" className="h-12 w-auto shrink-0 -mb-1" />
                <span className="text-base font-semibold tracking-[0.26em] text-white whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                  {header.logo}
                </span>
              </span>
              <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap" style={{ color: "var(--sage)" }}>
                {header.tagline}
              </span>
            </a>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              {footer.blurb}
            </p>
            <div className="flex items-center gap-4">
              {footer.social.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <SocialIcon icon={s.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footer.columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-white">{col.heading}</p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}><NavLink href={l.href}>{l.label}</NavLink></li>
                ))}
              </ul>
            </div>
          ))}

          {/* App card */}
          <AppCard />
        </div>

        {/* ── Mobile layout ── */}
        <div className="md:hidden mb-8">
          {/* Logo + social */}
          <div className="flex items-center justify-between mb-6">
            <a href="/" aria-label={header.logoAlt} className="inline-flex flex-col items-start leading-none">
              <span className="flex flex-col items-center">
                <img src={header.markSrc} alt="" aria-hidden="true" className="h-10 w-auto shrink-0 -mb-1" />
                <span className="text-sm font-semibold tracking-[0.26em] text-white whitespace-nowrap" style={{ fontFamily: "var(--font-body)" }}>
                  {header.logo}
                </span>
              </span>
              <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap" style={{ color: "var(--sage)" }}>
                {header.tagline}
              </span>
            </a>
            <div className="flex items-center gap-4">
              {footer.social.map((s) => (
                <a key={s.label} href={s.href} aria-label={s.label} className="transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <SocialIcon icon={s.icon} />
                </a>
              ))}
            </div>
          </div>

          {/* Accordion sections */}
          {footer.columns.map((col) => (
            <AccordionSection key={col.heading} heading={col.heading} links={col.links} />
          ))}
          <div className="border-t mb-6" style={{ borderColor: "rgba(255,255,255,0.1)" }} />

          {/* App card */}
          <AppCard />
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{footer.legal}</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-xs transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.45)" }}>Privacy Policy</a>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
            <a href="/terms" className="text-xs transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.45)" }}>Terms &amp; Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
