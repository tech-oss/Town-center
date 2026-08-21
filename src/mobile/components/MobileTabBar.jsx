import { useLocation, useNavigate } from "react-router-dom";

// Idle items are pure black (not grey) so the bar reads sharp on white; the
// active item takes the brand's dark teal plus a top rule, giving a clear,
// premium selected state. Items are separated by hairline dividers.
const ACTIVE = "var(--teal-deep)";
const IDLE = "#000000";

const TABS = [
  {
    key: "home",
    to: "/mobile/home",
    label: "Home",
    match: ["/mobile/home"],
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    key: "offers",
    to: "/mobile/offers",
    label: "Offers",
    match: ["/mobile/offers", "/mobile/news", "/mobile/story"],
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
        <circle cx="7.5" cy="7.5" r="1.2" fill={c} />
      </svg>
    ),
  },
  {
    key: "explore",
    to: "/mobile/explore",
    label: "Explore",
    // Explore is the hub for every section, guide and practical-info screen.
    match: [
      "/mobile/explore", "/mobile/see-do", "/mobile/eat-drink", "/mobile/shop",
      "/mobile/services", "/mobile/place", "/mobile/guides", "/mobile/whats-on",
      "/mobile/event", "/mobile/live", "/mobile/stay", "/mobile/work",
      "/mobile/about", "/mobile/more", "/mobile/parking", "/mobile/transport",
    ],
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-2 6-6 2 2-6z" />
      </svg>
    ),
  },
  {
    key: "map",
    to: "/mobile/map",
    label: "Map",
    match: ["/mobile/map"],
    icon: (c) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="flex items-stretch shrink-0 z-20"
      style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid rgba(28,46,56,0.16)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -6px 20px -12px rgba(28,46,56,0.35)",
      }}
    >
      {TABS.map((tab, i) => {
        const active = tab.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
        const color = active ? ACTIVE : IDLE;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.to)}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 active:opacity-60"
            style={i > 0 ? { borderLeft: "1px solid rgba(28,46,56,0.12)" } : undefined}
            aria-current={active ? "page" : undefined}
          >
            {/* Active indicator rule, mirroring the reference apps' bottom nav. */}
            {active && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{ width: 34, height: 3, borderRadius: "0 0 3px 3px", backgroundColor: ACTIVE }}
              />
            )}
            {tab.icon(color)}
            <span
              className="text-[11px] tracking-tight"
              style={{ color, fontWeight: active ? 800 : 600 }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
