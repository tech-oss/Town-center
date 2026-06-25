import { useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";

// ─── Brass SVG line icons ─────────────────────────────────────────────────────
const I = {
  dashboard:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  logs:          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  users:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  businesses:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  approvals:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  listings:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  featured:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  spotlight:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  stories:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  events:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  properties:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  projects:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  subscriptions: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  reporting:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  notifications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  settings:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  back:          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
};

const NAV = [
  { to: "/admin",                    label: "Dashboard",             icon: I.dashboard,      end: true },
  { to: "/admin/users",              label: "Users",                 icon: I.users },
  { to: "/admin/businesses",         label: "Business Registrations",icon: I.businesses },
  { to: "/admin/approvals",          label: "Approval Queue",        icon: I.approvals,      badge: "pending" },
  { to: "/admin/listings",           label: "Listings (Directory)",  icon: I.listings },
  {
    label: "Home Page Featured", icon: I.featured, group: true,
    children: [
      { to: "/admin/news-offers",      label: "In the Spotlight", icon: I.spotlight },
      { to: "/admin/featured-stories", label: "Featured Stories", icon: I.stories },
    ],
  },
  { to: "/admin/events-news",        label: "Events",                icon: I.events },
  { to: "/admin/properties",         label: "Properties",            icon: I.properties },
  { to: "/admin/projects",           label: "Explore (Projects)",    icon: I.projects },
  { to: "/admin/subscriptions",      label: "Subscriptions",         icon: I.subscriptions },
  { to: "/admin/reporting",          label: "Reporting",             icon: I.reporting },
  { to: "/admin/push-notifications", label: "Push Notifications",    icon: I.notifications },
  { to: "/admin/settings",           label: "Settings",              icon: I.settings },
  { to: "/admin/admin-logs",         label: "Admin Logs",            icon: I.logs },
];

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY      = "#13213B";              // dark navy-blue sidebar / dark text
const BRASS     = "#2563EB";              // primary blue accent / active
const BRASS_BG  = "rgba(37,99,235,0.16)"; // soft blue tint
const BRASS_BDR = "rgba(37,99,235,0.3)";
const TEXT_ON   = "rgba(255,255,255,0.75)";
const TEXT_DIM  = "rgba(255,255,255,0.45)";
const DIVIDER   = "rgba(255,255,255,0.10)";
const CINZEL    = "'Inter', system-ui, -apple-system, sans-serif";

// ─── NavGroup ─────────────────────────────────────────────────────────────────
function NavGroup({ item, closeSidebar }) {
  const location = useLocation();
  const anyActive = item.children.some((c) => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(anyActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
        style={{ color: anyActive ? "#fff" : TEXT_ON, backgroundColor: anyActive ? "rgba(255,255,255,0.06)" : "transparent" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = anyActive ? "#fff" : TEXT_ON; e.currentTarget.style.backgroundColor = anyActive ? "rgba(255,255,255,0.06)" : "transparent"; }}
      >
        <span className="shrink-0 w-4 flex items-center justify-center" style={{ color: "inherit" }}>{item.icon}</span>
        <span className="flex-1 text-left leading-snug">{item.label}</span>
        <span className="text-xs transition-transform duration-200" style={{ transform: open ? "rotate(90deg)" : "none", color: TEXT_DIM }}>›</span>
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 flex flex-col gap-0.5" style={{ borderLeft: `1px solid ${DIVIDER}` }}>
          {item.children.map(({ to, label, icon }) => (
            <NavLink
              key={to} to={to} onClick={closeSidebar}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isActive ? "font-medium" : ""}`}
              style={({ isActive }) => ({ color: isActive ? "#fff" : TEXT_DIM, backgroundColor: isActive ? BRASS : "transparent" })}
            >
              <span className="shrink-0" style={{ color: "inherit" }}>{icon}</span>
              <span className="flex-1 leading-snug">{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────
export default function AdminLayout({ pendingCount = 0 }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-root min-h-screen flex" style={{ backgroundColor: "#F5F7FB", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:z-auto md:!translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 240, minWidth: 240, backgroundColor: NAVY }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-mark.svg"
              alt="Maidenhead"
              className="shrink-0"
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span style={{ fontFamily: CINZEL, color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                Maidenhead
              </span>
              <span style={{ fontFamily: CINZEL, color: TEXT_ON, fontSize: 12, fontWeight: 400, lineHeight: 1.2 }}>
                Town Centre
              </span>
              <span style={{ fontFamily: CINZEL, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", backgroundColor: BRASS, borderRadius: 4, padding: "2px 7px", alignSelf: "flex-start", marginTop: 4, fontWeight: 600 }}>
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          {NAV.map((item) => {
            if (item.group) return <NavGroup key={item.label} item={item} closeSidebar={() => setSidebarOpen(false)} />;
            const { to, label, icon, end, badge } = item;
            return (
              <NavLink
                key={to} to={to} end={end}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                style={({ isActive }) => ({
                  color: isActive ? "#fff" : TEXT_ON,
                  backgroundColor: isActive ? BRASS : "transparent",
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <span className="shrink-0 w-4 flex items-center justify-center" style={{ color: "inherit" }}>{icon}</span>
                <span className="flex-1 leading-snug">{label}</span>
                {badge === "pending" && pendingCount > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20, backgroundColor: BRASS, color: "#fff" }}>
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ height: 1, backgroundColor: DIVIDER, margin: "0 20px" }} />

        {/* Footer */}
        <div className="px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80" style={{ color: TEXT_DIM }}>
            <span style={{ color: BRASS }}>{I.back}</span>
            View public site
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4"
          style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 12px rgba(16,24,40,0.05)" }}>
          <button className="md:hidden flex flex-col gap-1.5 w-5" onClick={() => setSidebarOpen((o) => !o)}>
            <span className="h-px w-full" style={{ backgroundColor: NAVY }} />
            <span className="h-px w-full" style={{ backgroundColor: NAVY }} />
            <span className="h-px w-full" style={{ backgroundColor: NAVY }} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: BRASS, color: "#fff", fontFamily: CINZEL }}>A</div>
            <span className="text-sm font-medium hidden sm:block" style={{ color: NAVY, fontFamily: CINZEL }}>Admin</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
