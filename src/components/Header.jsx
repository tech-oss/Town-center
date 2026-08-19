import { useState, useEffect, useRef, forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { header } from "../Data/content";
import { menus } from "../Data/pages";
import { liveMenu } from "../Data/live";
import { exploreMenu } from "../Data/explore";
import { workMenu } from "../Data/work";
import SmartLink from "./SmartLink";
import BrandMark from "./BrandMark/BrandMark";
import useHeaderScroll from "../hooks/useHeaderScroll";
import useLogoReveal from "../hooks/useLogoReveal";
import useOverImmersive from "../hooks/useOverImmersive";

const menusByLabel = Object.fromEntries([...menus, liveMenu, exploreMenu, workMenu].map((m) => [m.label, m]));

// Routes whose hero banner the header floats transparently over.
const TRANSPARENT_HERO_PATHS = ["/", "/see-do", "/shop", "/eat-drink", "/services", "/offers", "/explore/the-future", "/live", "/live/stay/hotels", "/live/stay/accommodation"];

const Header = forwardRef(function Header(_, ref) {
  const [menuOpen, setMenuOpen] = useState(false); // mobile drawer
  const [openDropdown, setOpenDropdown] = useState(null); // desktop hover
  const [mobileExpanded, setMobileExpanded] = useState(null); // mobile accordion
  const [search, setSearch] = useState("");
  const { pathname } = useLocation();
  const closeTimer = useRef(null);

  // Cinematic brand entrance (once per session) — see hooks/useLogoReveal.
  const logoRef = useRef(null);
  useLogoReveal(logoRef, { id: "header" });

  // Premium overlay-header behaviour: transparent over the hero at the top,
  // hides on scroll-down, reveals (solid brand blue) on scroll-up / hover.
  const { hidden, solid } = useHeaderScroll(TRANSPARENT_HERO_PATHS.includes(pathname));
  // The mobile drawer or an open desktop mega-menu always need the solid
  // backing and a visible header, regardless of scroll position.
  // Full-bleed interactive regions (the traders map) push the header out of the
  // way while they're under it, so pointer events reach the map rather than the
  // nav floating over it.
  const overImmersive = useOverImmersive();
  const forceSolid = solid || menuOpen || openDropdown !== null;
  const isHidden = (hidden || overImmersive) && !menuOpen && openDropdown === null;

  // Open immediately on hover; close with a short grace delay so the cursor
  // can travel from the nav item down into the open panel without it shutting.
  const openMenu = (label) => {
    clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };
  const cancelClose = () => clearTimeout(closeTimer.current);

  // Keep --header-height CSS variable in sync (used by the hero-section CSS rule)
  useEffect(() => {
    const el = document.querySelector("header");
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--header-height", el.offsetHeight + "px");
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const closeAll = () => {
    setMenuOpen(false);
    setMobileExpanded(null);
    setOpenDropdown(null);
  };

  return (
    <header
      ref={ref}
      className="site-header fixed top-0 inset-x-0 z-[600]"
      data-solid={forceSolid}
      data-hidden={isHidden}
    >
      {/* Utility bar — links on the left, search on the right */}
      <div
        className="hidden lg:flex justify-between items-center gap-5 px-8 py-1.5 text-xs font-medium"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center gap-5">
          {header.utilityLinks.map((link) => (
            <SmartLink
              key={link.label}
              to={link.href}
              className="transition-colors duration-150"
              style={{ color: "#ffffff" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--sage)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
            >
              {link.label}
            </SmartLink>
          ))}
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center gap-2 rounded-full px-3.5 py-1.5 w-56 lg:w-64"
          style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: "var(--mint)" }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search the site"
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-white/45 text-white"
          />
        </form>
      </div>

      {/* Main nav bar */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-2">
        {/* Logo lockup */}
        <Link ref={logoRef} to="/" onClick={closeAll} className="brand-lockup shrink-0 flex flex-col items-center leading-none" aria-label={header.logoAlt}>
          <BrandMark imgClassName="h-14 lg:h-16 w-auto" />
          <span data-logo-word className="-mt-1.5 text-base lg:text-xl font-semibold tracking-[0.02em] text-white" style={{ fontFamily: "var(--font-body)" }}>
            {header.logo}
          </span>
          <span data-logo-tag className="mt-1 text-[9px] lg:text-[10px] font-semibold uppercase tracking-[0.02em]" style={{ color: "var(--sage)" }}>
            {header.tagline}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7" aria-label="Primary">
          {header.navItems.map((nav) => {
            const menu = menusByLabel[nav.label];
            if (menu) {
              const isOpen = openDropdown === menu.label;
              return (
                <div key={nav.label} className="relative" onMouseEnter={() => openMenu(menu.label)} onMouseLeave={scheduleClose}>
                  <Link
                    to={menu.path}
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-1 text-[16px] font-medium tracking-[0.02em] transition-colors duration-150 py-1"
                    style={{ color: isOpen ? "var(--sage)" : "#ffffff" }}
                  >
                    {nav.label}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </Link>
                </div>
              );
            }
            if (nav.href?.startsWith("/")) {
              const active = pathname === nav.href || pathname.startsWith(nav.href + "/");
              return (
                <Link
                  key={nav.label}
                  to={nav.href}
                  className="text-[16px] font-medium tracking-[0.02em] transition-colors duration-150"
                  style={{ color: active ? "var(--sage)" : "#ffffff" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--sage)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = active ? "var(--sage)" : "#ffffff")}
                >
                  {nav.label}
                </Link>
              );
            }
            return (
              <a
                key={nav.label}
                href={nav.href}
                className="text-[16px] font-medium tracking-[0.02em] transition-colors duration-150"
                style={{ color: "#ffffff" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--sage)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
              >
                {nav.label}
              </a>
            );
          })}
        </nav>

        {/* Hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-1"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-200 origin-center ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-200 origin-center ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Desktop mega-menu dropdown */}
      {openDropdown && menusByLabel[openDropdown] && (
        <div className="hidden lg:block absolute inset-x-0 top-full" style={{ backgroundColor: "#fff", boxShadow: "0 24px 48px -24px rgba(28,46,56,0.4)" }} onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
          <div
            className={`py-8 grid gap-10 ${openDropdown === "Explore" ? "ml-auto px-8 w-max" : "max-w-6xl mx-auto px-8"}`}
            style={{ gridTemplateColumns: `repeat(${menusByLabel[openDropdown].columns.length}, minmax(0, 1fr))` }}
          >
            {menusByLabel[openDropdown].columns.map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-bold uppercase tracking-[0.02em] mb-4" style={{ color: "var(--leaf)" }}>{col.heading}</p>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        onClick={() => setOpenDropdown(null)}
                        className="text-sm transition-colors duration-150"
                        style={{ color: "#000000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--leaf)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--forest)")}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="lg:hidden px-6 pb-5 flex flex-col gap-1 max-h-[75vh] overflow-y-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} aria-label="Mobile primary">
          {/* Search */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2.5 rounded-full px-4 py-2.5 mt-4 mb-3"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: "var(--mint)" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              aria-label="Search the site"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/45 text-white"
            />
          </form>
          {header.navItems.map((nav) => {
            const menu = menusByLabel[nav.label];
            if (menu) {
              const expanded = mobileExpanded === menu.label;
              return (
                <div key={nav.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <button
                    className="w-full flex items-center justify-between py-3 text-sm font-medium"
                    style={{ color: "#ffffff" }}
                    aria-expanded={expanded}
                    onClick={() => setMobileExpanded(expanded ? null : menu.label)}
                  >
                    {nav.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {expanded && (
                    <div className="pb-3 flex flex-col gap-4">
                      {menu.columns.map((col) => (
                        <div key={col.heading}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.02em] mb-2" style={{ color: "var(--sage)" }}>{col.heading}</p>
                          <ul className="flex flex-col gap-1.5 pl-1">
                            {col.links.map((l) => (
                              <li key={l.to}>
                                <Link to={l.to} onClick={closeAll} className="block py-1 text-sm" style={{ color: "#ffffff" }}>
                                  {l.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            if (nav.href?.startsWith("/")) {
              return (
                <Link
                  key={nav.label}
                  to={nav.href}
                  className="py-3 text-sm font-medium"
                  style={{ color: "#ffffff", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                  onClick={closeAll}
                >
                  {nav.label}
                </Link>
              );
            }
            return (
              <a
                key={nav.label}
                href={nav.href}
                className="py-3 text-sm font-medium"
                style={{ color: "#ffffff", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                onClick={closeAll}
              >
                {nav.label}
              </a>
            );
          })}
          <div className="mt-3 flex flex-col gap-1">
            {header.utilityLinks.map((link) => (
              <SmartLink key={link.label} to={link.href} className="py-2 text-xs font-medium" style={{ color: "var(--sage)" }} onClick={closeAll}>
                {link.label}
              </SmartLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
});

export default Header;
