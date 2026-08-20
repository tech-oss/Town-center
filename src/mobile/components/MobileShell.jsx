import { useNavigate } from "react-router-dom";
import MobileTabBar from "./MobileTabBar";

// Native-app shell. Root is pinned to the viewport (see .mobile-root in
// index.css) so the body never rubber-band scrolls and the tab bar is a fixed
// flex child that never moves. Only `.mobile-scroll` scrolls.
export default function MobileShell({ children, noPadding, title, onBack, transparentHeader }) {
  const navigate = useNavigate();
  const showHeader = title != null || onBack;

  return (
    <div className="mobile-root">
      <div className="mobile-frame">
        {/* status-bar safe area */}
        <div style={{ height: "env(safe-area-inset-top, 0px)", flexShrink: 0, backgroundColor: "#ffffff" }} />

        {showHeader && (
          <header
            className="flex items-center gap-3 px-4 h-12 shrink-0 z-10"
            style={{
              backgroundColor: transparentHeader ? "transparent" : "#ffffff",
              borderBottom: transparentHeader ? "none" : "1px solid rgba(28,46,56,0.08)",
            }}
          >
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full active:bg-black/5"
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0C1418" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            {title && <h1 className="text-base font-bold truncate" style={{ color: "#000000" }}>{title}</h1>}
          </header>
        )}

        <main className={`mobile-scroll ${noPadding ? "" : "px-5 pt-5"}`} style={{ paddingBottom: noPadding ? 0 : 24 }}>
          {children}
        </main>

        <MobileTabBar />
      </div>
    </div>
  );
}
