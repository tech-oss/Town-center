import { useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";

// Nav items — use `children` for a collapsible group (no `to` on the parent)
const NAV = [
  { to: "/admin", label: "Dashboard", icon: "⊞", end: true },
  { to: "/admin/users", label: "Users & Businesses", icon: "👥" },
  { to: "/admin/businesses", label: "Business Registrations", icon: "🏢" },
  { to: "/admin/approvals", label: "Approval Queue", icon: "✅", badge: "pending" },
  { to: "/admin/listings", label: "Listings (Directory)", icon: "🏪" },
  {
    label: "Home Page Featured",
    icon: "🏠",
    group: true,
    children: [
      { to: "/admin/news-offers", label: "In the Spotlight", icon: "★" },
      { to: "/admin/featured-stories", label: "Featured Stories", icon: "📰" },
    ],
  },
  { to: "/admin/events-news", label: "Events", icon: "📅" },
  { to: "/admin/properties", label: "Properties", icon: "🏠" },
  { to: "/admin/projects", label: "Explore (Projects)", icon: "🗺" },
  { to: "/admin/subscriptions", label: "Subscriptions", icon: "💳" },
  { to: "/admin/reporting", label: "Reporting", icon: "📊" },
  { to: "/admin/push-notifications", label: "Push Notifications", icon: "🔔" },
  { to: "/admin/settings", label: "Settings", icon: "⚙" },
];

function NavGroup({ item, pendingCount, closeSidebar }) {
  const location = useLocation();
  const childPaths = item.children.map((c) => c.to);
  const anyChildActive = childPaths.some((p) => location.pathname.startsWith(p));
  const [open, setOpen] = useState(anyChildActive);

  return (
    <div className="mb-0.5">
      {/* Group header — clickable to toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        style={{ color: anyChildActive ? "#fff" : "rgba(255,255,255,0.65)", backgroundColor: anyChildActive ? "rgba(255,255,255,0.12)" : "transparent" }}
        onMouseEnter={(e) => { if (!anyChildActive) e.currentTarget.style.color = "#fff"; e.currentTarget.style.backgroundColor = anyChildActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = anyChildActive ? "#fff" : "rgba(255,255,255,0.65)"; e.currentTarget.style.backgroundColor = anyChildActive ? "rgba(255,255,255,0.12)" : "transparent"; }}
      >
        <span className="text-base leading-none w-5 text-center shrink-0">{item.icon}</span>
        <span className="flex-1 leading-snug text-left">{item.label}</span>
        <span
          className="text-xs transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "none", color: "rgba(255,255,255,0.45)" }}
        >
          ›
        </span>
      </button>

      {/* Children — slide in/out */}
      {open && (
        <div className="mt-0.5 ml-4 pl-3 flex flex-col gap-0.5" style={{ borderLeft: "1.5px solid rgba(255,255,255,0.12)" }}>
          {item.children.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/8"}`
              }
              style={({ isActive }) => isActive ? { backgroundColor: "rgba(255,255,255,0.12)" } : undefined}
            >
              <span className="text-xs leading-none w-4 text-center shrink-0" style={{ color: "#E8A33D" }}>{icon}</span>
              <span className="flex-1 leading-snug">{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ pendingCount = 0 }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F5F0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300 md:sticky md:top-0 md:h-screen md:z-auto md:!translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: 240,
          minWidth: 240,
          backgroundColor: "#1B4332",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/" className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#52B788" }}>Maidenhead</span>
            <span className="text-sm font-bold text-white leading-tight">Town Centre</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 self-start" style={{ backgroundColor: "rgba(82,183,136,0.2)", color: "#52B788" }}>Admin</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV.map((item) => {
            if (item.group) {
              return (
                <NavGroup
                  key={item.label}
                  item={item}
                  pendingCount={pendingCount}
                  closeSidebar={() => setSidebarOpen(false)}
                />
              );
            }
            const { to, label, icon, end, badge } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-150 ${isActive ? "text-white" : "text-white/65 hover:text-white hover:bg-white/8"}`
                }
                style={({ isActive }) => isActive ? { backgroundColor: "rgba(255,255,255,0.12)" } : undefined}
              >
                <span className="text-base leading-none w-5 text-center shrink-0">{icon}</span>
                <span className="flex-1 leading-snug">{label}</span>
                {badge === "pending" && pendingCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#E8A33D", color: "#fff" }}>{pendingCount}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <Link to="/" className="flex items-center gap-2 text-xs font-medium transition-opacity hover:opacity-80" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>←</span> View public site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4" style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(27,67,50,0.1)", boxShadow: "0 1px 8px rgba(13,42,51,0.06)" }}>
          {/* Mobile hamburger */}
          <button className="md:hidden flex flex-col gap-1.5 w-6" onClick={() => setSidebarOpen((o) => !o)}>
            <span className="h-0.5 w-full rounded" style={{ backgroundColor: "#1B4332" }} />
            <span className="h-0.5 w-full rounded" style={{ backgroundColor: "#1B4332" }} />
            <span className="h-0.5 w-full rounded" style={{ backgroundColor: "#1B4332" }} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#2D6A4F" }}>A</div>
            <span className="text-sm font-medium hidden sm:block" style={{ color: "#1B4332" }}>Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
