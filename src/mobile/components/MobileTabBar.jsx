import { useLocation, useNavigate } from "react-router-dom";

const ACTIVE = "var(--leaf)";
const IDLE = "rgba(28,46,56,0.45)";

const TABS = [
  {
    key: "home",
    to: "/mobile/home",
    label: "Home",
    match: ["/mobile/home"],
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    key: "offers",
    to: "/mobile/offers",
    label: "Offers",
    match: ["/mobile/offers"],
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.6 2.6 21 11a2 2 0 0 1 0 2.8l-7.2 7.2a2 2 0 0 1-2.8 0L2.6 12.6A2 2 0 0 1 2 11.2V4a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6Z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </svg>
    ),
  },
  {
    key: "explore",
    to: "/mobile/explore",
    label: "Explore",
    // Explore is the hub for the section + info screens
    match: ["/mobile/explore", "/mobile/see-do", "/mobile/eat-drink", "/mobile/shop", "/mobile/services", "/mobile/place", "/mobile/info", "/mobile/plan", "/mobile/about", "/mobile/guides", "/mobile/whats-on", "/mobile/live", "/mobile/work"],
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    key: "more",
    to: "/mobile/more",
    label: "More",
    match: ["/mobile/more"],
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="12" r="1.5" fill={c} stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill={c} stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill={c} stroke="none" />
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
        backgroundColor: "rgba(255,255,255,0.98)",
        borderTop: "1px solid rgba(28,46,56,0.08)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 16px -8px rgba(28,46,56,0.15)",
      }}
    >
      {TABS.map((tab) => {
        const active = tab.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
        const color = active ? ACTIVE : IDLE;
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.to)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 active:opacity-70"
          >
            {tab.icon(color)}
            <span className="text-[10px] font-semibold tracking-wide" style={{ color }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
