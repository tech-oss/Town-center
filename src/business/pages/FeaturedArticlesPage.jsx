import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import AddonSlotsCard from "../components/AddonSlotsCard";
import { ADDON_KINDS, getAddonAllowance } from "../api/addonSlots";
import { listFeatureArticles, setFeatureArticleStatus, deleteFeatureArticle } from "../api/businessFeatureArticles";
import { Toast, useToast, ConfirmModal, CARD, FOREST, SAGE, MUTED, BORDER } from "../components/FormKit";
import { formatUK } from "../../lib/ukDate";

const STATUS_COLOURS = {
  Draft:              { bg: "rgba(100,116,139,0.12)", fg: "#475569" },
  "Pending Approval": { bg: "rgba(217,119,6,0.14)",   fg: "#92400E" },
  Live:               { bg: "rgba(22,163,74,0.12)",   fg: "#15803D" },
  Hidden:             { bg: "rgba(100,116,139,0.12)", fg: "#475569" },
  Rejected:           { bg: "rgba(220,38,38,0.1)",    fg: "#991B1B" },
  Removed:            { bg: "rgba(220,38,38,0.1)",    fg: "#991B1B" },
};

function StatusBadge({ status }) {
  const c = STATUS_COLOURS[status] ?? STATUS_COLOURS.Draft;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function FeaturedArticlesPage() {
  const navigate = useNavigate();
  const { user } = useBusinessAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState(null);
  const [showSlots, setShowSlots] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useToast();

  const load = useCallback(() => {
    setLoading(true);
    listFeatureArticles(user.id)
      .then(setArticles)
      .catch((e) => setToast(e.message))
      .finally(() => setLoading(false));
    getAddonAllowance(user.id, "featured_article").then(setSlots).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(load, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("slots") === "success") setToast("Thanks — your Featured Article slots are ready to use.");
    if (params.get("slots")) window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A piece uses its slot while it is live or waiting on admin; hiding it
  // frees the slot for the next one.
  const active = articles.filter((a) => a.status === "Live" || a.status === "Pending Approval");
  const allowance = slots?.allowance ?? ADDON_KINDS.featured_article.included;
  const atLimit = active.length >= allowance;
  const premium = user.plan ? String(user.plan).toLowerCase() === "premium" : true;

  async function changeStatus(a, status, message) {
    try {
      await setFeatureArticleStatus(a.id, status);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, status } : x)));
      setToast(message);
    } catch (e) {
      setToast(e.message);
    }
  }

  async function confirmDelete() {
    await deleteFeatureArticle(deleting.id);
    setArticles((prev) => prev.filter((x) => x.id !== deleting.id));
    setToast(`"${deleting.title}" deleted.`);
    setDeleting(null);
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {deleting && (
        <ConfirmModal title="Delete this Featured Article?" body={`"${deleting.title}" will be permanently removed. The slot stays yours to re-use.`}
          confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Featured Articles</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Longer, editorial-style pieces with a hero image and pictures through the text. They go to admin for
              approval, then appear on your profile and first on the Offers page.
            </p>
          </div>
          <button onClick={() => (atLimit ? setShowSlots(true) : navigate("/business/featured-articles/new"))}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: SAGE }}>
            + Write a Featured Article
          </button>
        </div>

        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
          style={{ backgroundColor: atLimit ? "rgba(217,119,6,0.08)" : "rgba(37,99,235,0.06)" }}>
          <span className="text-sm" style={{ color: atLimit ? "#92400E" : FOREST }}>
            {allowance === 0
              ? "You have no Featured Article slots yet. Each slot holds one active Featured Article, and you can replace it with a new one whenever you like."
              : <><strong>{active.length} of {allowance}</strong> Featured Article slot{allowance === 1 ? "" : "s"} in use.</>}
          </span>
          <button onClick={() => setShowSlots((v) => !v)} className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
            style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
            {showSlots ? "Hide packages" : allowance === 0 ? "Get a slot" : "Get more slots"}
          </button>
        </div>

        {showSlots && (
          <AddonSlotsCard businessId={user.id} kind="featured_article" premium={premium}
            isOwner={user.role === "Owner"} requestedBy={`${user.firstName} ${user.lastName}`} onToast={setToast} />
        )}

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading…</p>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: MUTED }}>You haven't written a Featured Article yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl overflow-hidden flex flex-col" style={CARD}>
                {a.cardImage || a.heroImage
                  ? <img src={a.cardImage || a.heroImage} alt="" className="w-full h-32 object-cover" />
                  : <div className="w-full h-32" style={{ backgroundColor: "#f1f5f9" }} />}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <StatusBadge status={a.status} />
                  <p className="text-sm font-bold" style={{ color: FOREST }}>{a.title}</p>
                  {a.submittedAt && (
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Submitted {formatUK(a.submittedAt.slice(0, 10))}</p>
                  )}
                  {(a.status === "Rejected" || a.status === "Removed") && a.rejectionReason && (
                    <p className="text-xs rounded-lg px-2.5 py-2" style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#7F1D1D" }}>
                      <span className="font-bold">{a.status === "Removed" ? "Taken down" : "Not approved"}:</span> {a.rejectionReason}
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap mt-auto pt-2">
                    <button onClick={() => navigate(`/business/featured-articles/${a.id}/edit`)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Edit</button>
                    {a.status === "Live" ? (
                      <button onClick={() => changeStatus(a, "Hidden", `"${a.title}" hidden. The slot is free for another.`)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>Hide</button>
                    ) : (a.status === "Hidden" || a.status === "Draft" || a.status === "Rejected") ? (
                      <button onClick={() => changeStatus(a, "Pending Approval", `"${a.title}" sent for approval.`)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: "#2563EB" }}>Send for approval</button>
                    ) : null}
                    <button onClick={() => setDeleting(a)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
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
