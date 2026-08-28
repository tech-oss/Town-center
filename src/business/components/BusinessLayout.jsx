import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutBusinessAccount } from "../../api/business/auth";

const NAVY      = "#13213B";
const BRASS     = "#2563EB";
const TEXT_ON   = "rgba(255,255,255,0.75)";
const TEXT_DIM  = "rgba(255,255,255,0.45)";
const DIVIDER   = "rgba(255,255,255,0.10)";
const CINZEL    = "'Inter', system-ui, -apple-system, sans-serif";

const SECTION_LABELS = {
  "see-do": "See & Do", "eat-drink": "Eat & Drink", "shop": "Shop",
  "services": "Services", "live-stay": "Live & Stay",
};

export default function BusinessLayout({ account, children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logoutBusinessAccount();
    onLogout?.();
    navigate("/business/login");
  }

  return (
    <div className="admin-root min-h-screen flex" style={{ backgroundColor: "#F5F7FB", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed top-0 left-0 h-screen z-30 flex flex-col transition-transform duration-300 md:z-auto md:!translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 240, minWidth: 240, backgroundColor: NAVY }}
      >
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-mark.svg" alt="Maidenhead" className="shrink-0" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span style={{ fontFamily: CINZEL, color: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                Maidenhead
              </span>
              <span style={{ fontFamily: CINZEL, color: TEXT_ON, fontSize: 12, fontWeight: 400, lineHeight: 1.2 }}>
                Town Centre
              </span>
              <span style={{ fontFamily: CINZEL, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", backgroundColor: BRASS, borderRadius: 4, padding: "2px 7px", alignSelf: "flex-start", marginTop: 4, fontWeight: 600 }}>
                Business
              </span>
            </div>
          </Link>
        </div>

        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
          <p className="text-sm font-bold truncate" style={{ color: "#fff" }}>{account.businessName}</p>
          <p className="text-xs mt-0.5" style={{ color: TEXT_DIM }}>{SECTION_LABELS[account.section] || account.section}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          <Link to="/business/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
            style={{ color: "#fff", backgroundColor: BRASS, fontWeight: 600 }}>
            <span className="shrink-0 w-4 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </span>
            <span className="flex-1 leading-snug">Manage My Page</span>
          </Link>
        </nav>

        <div style={{ height: 1, backgroundColor: DIVIDER, margin: "0 20px" }} />

        <div className="px-5 py-4 flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80" style={{ color: TEXT_DIM }}>
            <span style={{ color: BRASS }}>←</span>
            View public site
          </Link>
          <button onClick={handleLogout} className="text-left text-xs transition-opacity hover:opacity-80" style={{ color: TEXT_DIM }}>
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px]">
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
              style={{ backgroundColor: BRASS, color: "#fff" }}>
              {account.businessName?.[0]?.toUpperCase() ?? "B"}
            </div>
            <span className="text-sm font-medium hidden sm:block" style={{ color: NAVY }}>{account.email}</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
