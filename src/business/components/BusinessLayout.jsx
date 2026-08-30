import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import { BUSINESS_SUPPORT_TICKETS } from "../../Data/businessPortalMock";

const FOREST = "var(--forest)", SAGE = "var(--sage)", LEAF = "var(--leaf)";
const TEXT_ON  = "rgba(255,255,255,0.75)";
const TEXT_DIM = "rgba(255,255,255,0.45)";
const DIVIDER  = "rgba(255,255,255,0.10)";

const NAV = [
  { to: "/business/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/business/listing",   label: "My Listing", icon: "📄" },
  { to: "/business/articles",  label: "News & Articles", icon: "📰" },
  { to: "/business/billing",   label: "Subscriptions & Billing", icon: "💳" },
  { to: "/business/reviews",   label: "Reviews", icon: "⭐" },
  { to: "/business/support",   label: "Support", icon: "🎫" },
  { to: "/business/settings",  label: "Account Settings", icon: "⚙️" },
];

export default function BusinessLayout({ children }) {
  const { user, logout } = useBusinessAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const openTickets = (BUSINESS_SUPPORT_TICKETS[user.id] ?? []).filter((t) => t.status !== "Resolved").length;

  function handleLogout() {
    logout();
    navigate("/business/login");
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F4F8F7", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 h-screen z-30 flex flex-col transition-transform duration-300 md:z-auto md:!translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 240, minWidth: 240, backgroundColor: FOREST }}>

        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="Maidenhead" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-bold" style={{ color: "#fff" }}>Maidenhead</span>
              <span className="text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded w-fit" style={{ backgroundColor: SAGE, color: FOREST }}>Business</span>
            </div>
          </Link>
        </div>

        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <p className="text-sm font-bold truncate" style={{ color: "#fff" }}>{user.businessName}</p>
          <p className="text-xs mt-0.5 capitalize" style={{ color: TEXT_DIM }}>{user.plan.replace(/-/g, " ")} plan</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
              style={({ isActive }) => ({
                color: isActive ? "#fff" : TEXT_ON,
                backgroundColor: isActive ? SAGE : "transparent",
                fontWeight: isActive ? 600 : 400,
              })}>
              <span className="shrink-0 w-4 text-center">{item.icon}</span>
              <span className="flex-1 leading-snug">{item.label}</span>
              {item.to === "/business/support" && openTickets > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>{openTickets}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ height: 1, backgroundColor: DIVIDER, margin: "0 20px" }} />

        <div className="px-5 py-4 flex flex-col gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: SAGE }}>
            View my public page →
          </a>
          <button onClick={handleLogout} className="text-left text-xs transition-opacity hover:opacity-80" style={{ color: TEXT_DIM }}>Log out</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
        {!user.visible && (
          <div className="px-6 py-2.5 text-center text-xs font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
            ⚠ Your business profile is currently hidden from the public site.
          </div>
        )}

        <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4"
          style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 12px rgba(16,24,40,0.05)" }}>
          <button className="md:hidden flex flex-col gap-1.5 w-5" onClick={() => setSidebarOpen((o) => !o)}>
            <span className="h-px w-full" style={{ backgroundColor: FOREST }} />
            <span className="h-px w-full" style={{ backgroundColor: FOREST }} />
            <span className="h-px w-full" style={{ backgroundColor: FOREST }} />
          </button>
          <span className="text-base font-bold hidden sm:block" style={{ color: FOREST }}>{user.businessName}</span>
          <div className="flex-1" />

          <button className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100">
            🔔
            {openTickets > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#DC2626" }} />}
          </button>

          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: SAGE }}>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden bg-white z-20" style={{ border: "1.5px solid rgba(28,46,56,0.14)", boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(28,46,56,0.1)" }}>
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>{user.firstName} {user.lastName}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>{user.email}</p>
                </div>
                <Link to="/business/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: FOREST }}>Account Settings</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50" style={{ color: "#991B1B" }}>Log out</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
