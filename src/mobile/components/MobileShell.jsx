import { useNavigate } from "react-router-dom";
import MobileTabBar from "./MobileTabBar";
import useMobileBack from "../hooks/useMobileBack";

// Native-app shell. Root is pinned to the viewport (see .mobile-root in
// index.css) so the body never rubber-band scrolls and the tab bar is a fixed
// flex child that never moves. Only `.mobile-scroll` scrolls.
//
// The header is the app's one consistent navigation surface: a back button
// wherever there is somewhere to go back to, the screen title, and the global
// search affordance — which stays in the same place on every screen so it never
// disappears as the user moves through the app. Screens that paint their own
// full-bleed hero (Home, the detail screens) pass `hideHeader` and render the
// floating back/search controls over the image instead.
export default function MobileShell({
  children,
  noPadding,
  title,
  onBack,
  backFallback = "/mobile/home",
  transparentHeader,
  hideHeader,
  showSearch = true,
}) {
  const navigate = useNavigate();
  const goBack = useMobileBack(backFallback);
  const showHeader = !hideHeader && (title != null || onBack || showSearch);

  return (
    <div className="mobile-root">
      <div className="mobile-frame">
        {/* status-bar safe area */}
        <div style={{ height: "env(safe-area-inset-top, 0px)", flexShrink: 0, backgroundColor: "#ffffff" }} />

        {showHeader && (
          <header
            className="flex items-center gap-2 px-4 h-13 shrink-0 z-10"
            style={{
              height: 52,
              backgroundColor: transparentHeader ? "transparent" : "#ffffff",
              borderBottom: transparentHeader ? "none" : "1px solid rgba(28,46,56,0.1)",
            }}
          >
            {(onBack || title != null) && (
              <button
                onClick={() => (typeof onBack === "function" ? onBack() : goBack())}
                className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full active:bg-black/5"
                aria-label="Back"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            {title && (
              <h1 className="text-base font-bold truncate flex-1" style={{ color: "var(--teal-deep)" }}>
                {title}
              </h1>
            )}
            {!title && <div className="flex-1" />}
            {showSearch && (
              <button
                onClick={() => navigate("/mobile/search")}
                className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full active:bg-black/5"
                aria-label="Search"
              >
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
              </button>
            )}
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
