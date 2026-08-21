import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";

// `to` → navigates in-app. `soon: true` → demo placeholder (no web redirect).
const ITEMS = [
  { label: "Services", icon: "list", to: "/mobile/services" },
  { label: "Live & Stay", icon: "list", to: "/mobile/live" },
  { label: "Offers & News", icon: "bell", to: "/mobile/offers" },
  { label: "Neighbourhood Guides", icon: "list", to: "/mobile/guides" },
  { label: "Work", icon: "list", to: "/mobile/work" },
  { label: "Business Directory", icon: "list", to: "/mobile/map" },
  { label: "Parking", icon: "map", to: "/mobile/parking" },
  { label: "Transport & Getting Here", icon: "train", to: "/mobile/transport" },
  { label: "Get the App", icon: "download", soon: true },
  { label: "Newsletter", icon: "mail", soon: true },
  { label: "Settings", icon: "settings", soon: true },
  { label: "About", icon: "info", to: "/mobile/about" },
];

function Icon({ name }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "var(--forest)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "download": return <svg {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>;
    case "mail": return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
    case "bell": return <svg {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    case "list": return <svg {...p}><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="4" width="7" height="7" rx="1.5" /><rect x="3" y="13" width="7" height="7" rx="1.5" /><rect x="14" y="13" width="7" height="7" rx="1.5" /></svg>;
    case "train": return <svg {...p}><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M5 11h14M9 16l-2 4M15 16l2 4" /></svg>;
    case "map": return <svg {...p}><path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>;
    case "help": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.2" /><circle cx="12" cy="17" r="0.5" fill="var(--forest)" stroke="none" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 16v-5M12 8h.01" /></svg>;
  }
}

export default function MoreScreen() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  function handle(item) {
    if (item.to) navigate(item.to);
    else { setToast(`${item.label} — coming soon in the full app`); setTimeout(() => setToast(null), 2000); }
  }

  return (
    <MobileShell onBack backFallback="/mobile/explore">
      <div className="flex flex-col gap-5 mobile-stagger">
        <h1 className="section-heading text-2xl font-bold" style={{ color: "#000000" }}>More</h1>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)" }}>
          {ITEMS.map((item, i) => (
            <button
              key={item.label}
              onClick={() => handle(item)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-black/[0.03]"
              style={i < ITEMS.length - 1 ? { borderBottom: "1px solid rgba(0,0,0,0.06)" } : undefined}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(28,46,56,0.045)" }}>
                <Icon name={item.icon} />
              </div>
              <span className="flex-1 text-left text-sm font-semibold" style={{ color: "#000000" }}>{item.label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          ))}
        </div>

        <p className="text-center text-[11px]" style={{ color: "rgba(0,0,0,0.35)" }}>Maidenhead Town Centre · Demo v1</p>
      </div>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-semibold" style={{ bottom: 88, backgroundColor: "rgba(15,26,32,0.95)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }}>
          {toast}
        </div>
      )}
    </MobileShell>
  );
}
