import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ARTICLES } from "../../Data/adminMissingScreensMock";
import StatusTag from "../components/StatusTag";
import EmptyState from "../components/EmptyState";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";
const CARD = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
const TABS = ["All", "Published", "Draft", "Hidden"];

const CATEGORY_COLOURS = {
  "Offers":              { bg: "rgba(37,99,235,0.1)",  fg: "#1D4ED8" },
  "News":                { bg: "rgba(22,163,74,0.12)", fg: "#15803D" },
  "Featured Story":      { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
  "Neighbourhood Guide": { bg: "rgba(139,92,246,0.14)", fg: "#6D28D9" },
};

function CategoryBadge({ category }) {
  const c = CATEGORY_COLOURS[category] ?? { bg: "rgba(107,114,128,0.13)", fg: "#374151" };
  return <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{category}</span>;
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

export default function ArticlesPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState(ARTICLES);
  const [tab, setTab] = useState("All");
  const [toast, setToast] = useState(null);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 3500); }

  const filtered = tab === "All" ? articles : articles.filter((a) => a.status === tab);

  function handleHide(a) {
    setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: x.status === "Hidden" ? "Published" : "Hidden" } : x)));
    notify(a.status === "Hidden" ? `"${a.title}" unhidden.` : `"${a.title}" hidden from the public site.`);
  }
  function handleDelete(a) {
    setArticles((prev) => prev.filter((x) => x.id !== a.id));
    notify(`"${a.title}" deleted.`);
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Articles & Guides</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Editorial content published across Offers, News, Featured Stories and Neighbourhood Guides.</p>
        </div>
        <button onClick={() => navigate("/admin/articles/new")}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: BLUE }}>
          + New Article
        </button>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium transition-all"
            style={{ color: tab === t ? BLUE : MUTED, borderBottom: tab === t ? `2px solid ${BLUE}` : "2px solid transparent", marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No articles" message="Create your first article or adjust the filter." icon="📰" />
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={CARD}>
          <table className="w-full min-w-[800px] text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: "rgba(16,24,40,0.05)", borderBottom: `1px solid ${BORDER}` }}>
                {["", "Title", "Category", "Author", "Published", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td className="px-4 py-3"><img src={a.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" /></td>
                  <td className="px-4 py-3 font-semibold max-w-xs truncate" style={{ color: NAVY }}>{a.title}</td>
                  <td className="px-4 py-3"><CategoryBadge category={a.category} /></td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{a.author}</td>
                  <td className="px-4 py-3" style={{ color: MUTED }}>{a.published}</td>
                  <td className="px-4 py-3"><StatusTag status={a.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/admin/articles/${a.id}/edit`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Edit</button>
                      <button onClick={() => handleHide(a)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>{a.status === "Hidden" ? "Unhide" : "Hide"}</button>
                      <button onClick={() => handleDelete(a)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
