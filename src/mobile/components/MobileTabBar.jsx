import { NavLink } from "react-router-dom";

const TABS = [
  {
    to: "/mobile/home",
    label: "Home",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    to: "/mobile/whats-on",
    label: "What's On",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3.5 10h17" />
      </svg>
    ),
  },
  {
    to: "/mobile/explore",
    label: "Explore",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M15 9l-2 6-6 2 2-6z" />
      </svg>
    ),
  },
  {
    to: "/mobile/map",
    label: "Map",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </svg>
    ),
  },
  {
    to: "/mobile/more",
    label: "More",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5" cy="12" r="1.4" fill={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} />
        <circle cx="12" cy="12" r="1.4" fill={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} />
        <circle cx="19" cy="12" r="1.4" fill={active ? "var(--sage)" : "rgba(255,255,255,0.55)"} />
      </svg>
    ),
  },
];

export default function MobileTabBar() {
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 flex items-stretch z-20"
      style={{
        backgroundColor: "rgba(15,26,32,0.96)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
        >
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: isActive ? "var(--sage)" : "rgba(255,255,255,0.55)" }}
              >
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
