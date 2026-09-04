import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { listArticles, setArticleStatus, deleteArticle } from "../api/businessArticles";

const STATUS_COLOURS = {
  Draft: { bg: "rgba(107,114,128,0.13)", fg: "#374151" },
  "Pending Approval": { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  Live: { bg: "rgba(37,99,235,0.16)", fg: "#2563EB" },
  Rejected: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  Hidden: { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
};
function StatusBadge({ status }) {
  const c = STATUS_COLOURS[status] ?? STATUS_COLOURS.Draft;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function ArticlesPage() {
  const navigate = useNavigate();
  const { user } = useBusinessAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useToast();
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listArticles(user.id).then((data) => {
      if (!cancelled) { setArticles(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [user.id]);

  const atMax = articles.length >= 3;

  async function handleHide(a) {
    const status = a.status === "Hidden" ? "Live" : "Hidden";
    await setArticleStatus(a.id, status);
    setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status } : x)));
    setToast(a.status === "Hidden" ? `"${a.title}" is live again.` : `"${a.title}" hidden from the public site.`);
  }
  async function handleMakeLive(a) {
    await setArticleStatus(a.id, "Live");
    setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: "Live" } : x)));
    setToast(`"${a.title}" is now live.`);
  }
  async function confirmDelete() {
    await deleteArticle(deleting.id);
    setArticles((prev) => prev.filter((x) => x.id !== deleting.id));
    setToast(`"${deleting.title}" deleted.`);
    setDeleting(null);
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {deleting && (
        <ConfirmModal title="Delete this article?" body={`"${deleting.title}" will be permanently removed.`} confirmLabel="Delete"
          onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>News & Articles</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Write up to 3 articles that appear on your business page and in Offers.</p>
          </div>
          <div className="relative group">
            <button onClick={() => !atMax && navigate("/business/articles/new")} disabled={atMax}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: SAGE }}>
              + Create New Article
            </button>
            {atMax && (
              <div className="absolute right-0 top-full mt-1 w-56 text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10"
                style={{ backgroundColor: FOREST, color: "#fff" }}>
                You've reached the maximum of 3 articles. Delete one to add a new one.
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading articles…</p>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: MUTED }}>You haven't created any articles yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl overflow-hidden flex flex-col" style={CARD}>
                <img src={a.thumbnail} alt="" className="w-full h-32 object-cover" />
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{a.type}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: FOREST }}>{a.title}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{a.date}</p>
                  <div className="flex gap-2 flex-wrap mt-auto pt-2">
                    <button onClick={() => navigate(`/business/articles/${a.id}/edit`)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Edit</button>
                    {a.status === "Live" || a.status === "Hidden" ? (
                      <button onClick={() => handleHide(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>{a.status === "Hidden" ? "Make Live" : "Hide"}</button>
                    ) : a.status === "Draft" ? (
                      <button onClick={() => handleMakeLive(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: "#2563EB" }}>Make Live</button>
                    ) : null}
                    <button onClick={() => setDeleting(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}
