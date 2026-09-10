import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import {
  listArticles, setArticleStatus, deleteArticle, swapLiveArticle,
  LIVE_ARTICLE_LIMIT,
} from "../api/businessArticles";

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

// Shown when the business is already at its live limit and tries to put
// another article on the site. It carries the subscribe message and the way
// out of it in the same place — picking which live article to stand down —
// so the cap isn't a dead end.
function SwapModal({ candidate, liveArticles, onSwap, onCancel, busy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full flex flex-col gap-4" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div>
          <p className="text-base font-bold" style={{ color: FOREST }}>
            You already have {LIVE_ARTICLE_LIMIT} articles live
          </p>
          <p className="text-sm mt-1.5" style={{ color: MUTED }}>
            Please subscribe to get <strong style={{ color: FOREST }}>{candidate.title}</strong> live on the site as well —
            or swap it in by choosing which article to take down.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {liveArticles.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3" style={{ border: `1.5px solid ${BORDER}` }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: FOREST }}>{a.title}</p>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{a.type} · {a.date}</p>
              </div>
              <button onClick={() => onSwap(a)} disabled={busy}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-40"
                style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB", border: "1.5px solid rgba(37,99,235,0.3)" }}>
                Replace this
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>
            Keep as is
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const navigate = useNavigate();
  const { user } = useBusinessAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useToast();
  const [deleting, setDeleting] = useState(null);
  const [swapFor, setSwapFor] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listArticles(user.id).then((data) => {
      if (!cancelled) { setArticles(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [user.id]);

  const liveArticles = articles.filter((a) => a.status === "Live");
  const atLiveLimit = liveArticles.length >= LIVE_ARTICLE_LIMIT;

  function patch(id, changes) {
    setArticles((prev) => prev.map((x) => (x.id === id ? { ...x, ...changes } : x)));
  }

  async function handleHide(a) {
    try {
      await setArticleStatus(a.id, "Hidden");
      patch(a.id, { status: "Hidden" });
      setToast(`"${a.title}" hidden from the public site.`);
    } catch (e) {
      setToast(e.message);
    }
  }

  // Putting an article on the site. At the limit this opens the swap modal
  // rather than failing — the trigger would reject it anyway, and a refusal
  // with no way forward isn't much use to the business.
  async function handleMakeLive(a) {
    if (atLiveLimit) { setSwapFor(a); return; }
    try {
      await setArticleStatus(a.id, "Live");
      patch(a.id, { status: "Live" });
      setToast(`"${a.title}" is now live.`);
    } catch (e) {
      setToast(e.message);
    }
  }

  async function handleSwap(toHide) {
    setBusy(true);
    try {
      await swapLiveArticle(toHide.id, swapFor.id);
      patch(toHide.id, { status: "Hidden" });
      patch(swapFor.id, { status: "Live" });
      setToast(`"${swapFor.title}" is now live in place of "${toHide.title}".`);
      setSwapFor(null);
    } catch (e) {
      setToast(e.message);
    }
    setBusy(false);
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
      {swapFor && (
        <SwapModal candidate={swapFor} liveArticles={liveArticles} busy={busy}
          onSwap={handleSwap} onCancel={() => setSwapFor(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>News &amp; Articles</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Write as many as you like. Up to {LIVE_ARTICLE_LIMIT} can be live on your business page at a time.
            </p>
          </div>
          <button onClick={() => navigate("/business/articles/new")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: SAGE }}>
            + Create New Article
          </button>
        </div>

        {/* Live allowance — the number that actually constrains them, shown
            before they hit it rather than only in the refusal. */}
        {!loading && articles.length > 0 && (
          <div className="rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 flex-wrap" style={CARD}>
            <p className="text-sm" style={{ color: FOREST }}>
              <strong>{liveArticles.length} of {LIVE_ARTICLE_LIMIT}</strong> live article{liveArticles.length === 1 ? "" : "s"} in use
            </p>
            {atLiveLimit && (
              <p className="text-xs" style={{ color: "#92400E" }}>
                At your limit — subscribe for more, or swap one out when you publish something new.
              </p>
            )}
          </div>
        )}

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
                    {a.status === "Live" ? (
                      <button onClick={() => handleHide(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>Hide</button>
                    ) : a.status === "Hidden" || a.status === "Draft" ? (
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
