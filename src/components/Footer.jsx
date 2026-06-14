import { Link } from "react-router-dom";
import { footer, header } from "../Data/content";
import AppBadges from "./AppBadges";

export default function Footer() {
  return (
    <footer className="px-6 md:px-12 pt-16 pb-8" style={{ backgroundColor: "var(--ink)", color: "white" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <a href="/" className="inline-flex flex-col items-start leading-none" aria-label={header.logoAlt}>
              {/* Mark + wordmark grouped in a fit-width column so the mark centers
                  over the wordmark (like the header). The SVG has ~24% internal padding
                  (content at x=8,y=44 inside 180×180); -mb-2 crops the bottom whitespace.
                  The group and tagline stay flush-left with the rest of the column. */}
              <span className="flex flex-col items-center">
                <img
                  src={header.markSrc}
                  alt=""
                  aria-hidden="true"
                  className="h-14 w-auto shrink-0 -mb-2"
                />
                <span
                  className="text-lg font-semibold tracking-[0.26em] text-white whitespace-nowrap"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {header.logo}
                </span>
              </span>
              <span
                className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap"
                style={{ color: "var(--sage)" }}
              >
                {header.tagline}
              </span>
            </a>
            <div className="flex gap-4 mt-2">
              {footer.social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="text-xs text-white hover:text-white transition-colors duration-150"
                >
                  {s.label}
                </a>
              ))}
            </div>

            {/* App download badges */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--sage)" }}>
                Get the App
              </p>
              <AppBadges />
            </div>
          </div>

          {/* Link columns */}
          {footer.columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="text-xs font-semibold tracking-widest uppercase text-white">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href?.startsWith("/") ? (
                      <Link
                        to={link.href}
                        className="text-sm text-white hover:text-white transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-white hover:text-white transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-xs text-white">{footer.legal}</p>
        </div>
      </div>
    </footer>
  );
}
