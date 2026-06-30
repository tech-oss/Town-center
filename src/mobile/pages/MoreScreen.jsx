import { Link } from "react-router-dom";

const ITEMS = [
  { label: "Get the App", to: "/get-the-app", icon: "download" },
  { label: "Newsletter", to: "/", icon: "mail" },
  { label: "Alerts & Updates", to: "/", icon: "bell" },
  { label: "Business Directory", to: "/traders", icon: "list" },
  { label: "Settings", to: "/", icon: "settings" },
  { label: "Help & Support", to: "/", icon: "help" },
  { label: "About", to: "/about", icon: "info" },
];

function Icon({ name }) {
  const stroke = "var(--forest)";
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "download":
      return <svg {...common}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "bell":
      return <svg {...common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "list":
      return <svg {...common}><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="4" width="7" height="7" rx="1.5" /><rect x="3" y="13" width="7" height="7" rx="1.5" /><rect x="14" y="13" width="7" height="7" rx="1.5" /></svg>;
    case "settings":
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>;
    case "help":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.2" /><circle cx="12" cy="17" r="0.5" fill={stroke} /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 16v-5M12 8h.01" /></svg>;
  }
}

export default function MoreScreen() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#fff" }}>More</h1>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)" }}>
        {ITEMS.map((item, i) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[rgba(0,0,0,0.03)]"
            style={i < ITEMS.length - 1 ? { borderBottom: "1px solid rgba(0,0,0,0.06)" } : undefined}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(82,199,182,0.12)" }}>
              <Icon name={item.icon} />
            </div>
            <span className="flex-1 text-sm font-semibold" style={{ color: "var(--forest)" }}>{item.label}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,26,26,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
