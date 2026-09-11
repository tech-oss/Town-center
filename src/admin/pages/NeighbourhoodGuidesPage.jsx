import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getGuides, saveGuide, deleteGuide } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../theme";

// The homepage guides strip is laid out for three cards.
const HOMEPAGE_LIMIT = 3;

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div onClick={() => onChange(!checked)} className="w-9 h-5 rounded-full transition-colors flex items-center px-0.5" style={{ backgroundColor: checked ? BLUE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }} />
      </div>
      <span className="text-xs font-medium" style={{ color: NAVY }}>{label}</span>
    </label>
  );
}

function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm" style={{ backgroundColor: NAVY, color: "#fff" }}>
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

export default function NeighbourhoodGuidesPage() {
  const navigate = useNavigate();
  const [nonce, setNonce] = useState(0);
  const { data: fetched } = useFetch(getGuides, [nonce]);
  const guides = fetched ?? [];
  const refresh = () => setNonce((n) => n + 1);
  const [toast, setToast] = useState(null);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  const onHomepage = guides.filter((g) => g.showOnHomepage).length;

  function toggle(id, key) {
    const guide = guides.find((g) => g.id === id);
    if (!guide) return;
    if (key === "showOnHomepage" && !guide.showOnHomepage && onHomepage >= HOMEPAGE_LIMIT) {
      notify(`Only ${HOMEPAGE_LIMIT} guides can be on the homepage. Turn one off first.`);
      return;
    }
    saveGuide({ ...guide, [key]: !guide[key] })
      .then(() => { refresh(); notify("Visibility updated."); })
      .catch((e) => notify(`Could not update: ${e.message}`));
  }
  function handleDelete(g) {
    deleteGuide(g.id).then(refresh);
    notify(`"${g.title}" deleted.`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Neighbourhood Guides</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage the area guide pages shown across the platform.</p>
        </div>
        <button onClick={() => navigate("/admin/neighbourhood-guides/new")}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE }}>
          + New Guide
        </button>
      </div>

      <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: NAVY }}>
        <div>
          <p className="text-sm font-bold text-white">On the homepage</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{Math.min(onHomepage, HOMEPAGE_LIMIT)}/{HOMEPAGE_LIMIT} slots used. Maximum {HOMEPAGE_LIMIT} guides.</p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: HOMEPAGE_LIMIT }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={i < onHomepage ? { backgroundColor: "#E8A33D", color: "#fff" } : { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.3)" }}>
              {i < onHomepage ? "★" : "○"}
            </div>
          ))}
        </div>
        {onHomepage > HOMEPAGE_LIMIT && (
          <p className="w-full text-xs font-semibold" style={{ color: "#FCD34D" }}>
            {onHomepage} guides are switched on — only the first {HOMEPAGE_LIMIT} are shown. Turn {onHomepage - HOMEPAGE_LIMIT} off so the choice is yours.
          </p>
        )}
      </div>

      {guides.length === 0 ? (
        <EmptyState title="No guides" message="Create your first neighbourhood guide." icon="🗺️" />
      ) : (
        <div className="flex flex-col gap-3">
          {guides.map((g) => (
            <div key={g.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 flex-wrap" style={CARD}>
              <img src={g.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold" style={{ color: NAVY }}>{g.title}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(16,24,40,0.06)", color: NAVY }}>{g.area}</span>
                  <StatusTag status={g.status} />
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <Toggle checked={g.showOnHomepage} onChange={() => toggle(g.id, "showOnHomepage")} label="Show on Homepage" />
                  <Toggle checked={g.showOnPlatform} onChange={() => toggle(g.id, "showOnPlatform")} label="Show on Platform" />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => navigate(`/admin/neighbourhood-guides/${g.id}/edit`)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Edit</button>
                <button onClick={() => handleDelete(g)} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
