import { useEffect, useState } from "react";
import { formatUK } from "../../lib/ukDate";
import { ADDON_KINDS, ADDON_SMALLPRINT, getAddonAllowance, buyAddonSlots } from "../api/addonSlots";
import { raisePurchaseRequest } from "../api/purchaseRequests";
import PurchasedSlots from "../components/PurchasedSlots";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import {
  listArticles, listAdminPosts, setArticleStatus, deleteArticle, swapLiveArticle,
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
function SwapModal({ candidate, liveArticles, onSwap, onCancel, busy, allowance, isOwner, onBuy, buying, onAsk, requested }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto" style={{ backgroundColor: "rgba(16,24,40,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full flex flex-col gap-5 my-6" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div>
          <p className="text-base font-bold" style={{ color: FOREST }}>
            You already have {allowance} article{allowance === 1 ? "" : "s"} live
          </p>
          <p className="text-sm mt-1.5" style={{ color: MUTED }}>
            Please see the options below to get <strong style={{ color: FOREST }}>{candidate.title}</strong> live on
            Maidenhead.com and The Maidenhead App as well — or swap it in by choosing which existing article to take down.
          </p>
        </div>

        {/* ── Swap one out ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Swap one out</p>
          {liveArticles.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3" style={{ border: `1.5px solid ${BORDER}` }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: FOREST }}>{a.title}</p>
                <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{a.type} · {formatUK(a.date)}</p>
              </div>
              <button onClick={() => onSwap(a)} disabled={busy}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-40"
                style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#2563EB", border: "1.5px solid rgba(37,99,235,0.3)" }}>
                Replace this
              </button>
            </div>
          ))}
        </div>

        {/* ── Or buy more room ── */}
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(37,99,235,0.05)", border: "1.5px solid rgba(37,99,235,0.2)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: FOREST }}>Boost your content</p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              Want to get more of your news and offers seen across Maidenhead.com and The Maidenhead App?
              Purchase additional article slots and use them throughout the year.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {ADDON_KINDS.article.packs.map((p) => (
              <div key={p.pack} className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 bg-white" style={{ border: `1.5px solid ${BORDER}` }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: FOREST }}>{p.label}</p>
                  <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{p.price} · valid 12 months</p>
                </div>
                {isOwner ? (
                  <button onClick={() => onBuy(p.pack)} disabled={buying}
                    className="text-xs font-bold px-4 py-2 rounded-lg shrink-0 text-white disabled:opacity-40"
                    style={{ backgroundColor: SAGE }}>
                    {buying ? "Opening…" : "Purchase"}
                  </button>
                ) : requested.has(p.pack) ? (
                  <span className="text-[11px] font-semibold shrink-0" style={{ color: "#15803D" }}>Requested ✓</span>
                ) : (
                  <button onClick={() => onAsk(p.pack)}
                    className="text-xs font-bold px-4 py-2 rounded-lg shrink-0"
                    style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
                    Ask the owner
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold" style={{ color: FOREST }}>Your slots give you flexibility:</p>
            <ul className="flex flex-col gap-0.5">
              {ADDON_KINDS.article.terms.map((t) => (
                <li key={t} className="text-[11px] flex gap-1.5" style={{ color: MUTED }}><span>•</span>{t}</li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] leading-relaxed" style={{ color: MUTED }}>
            Slots are not one-off articles — each slot can be re-used for different content during its 12-month
            validity. Additional article slots are available while your Business Visibility subscription is active;
            if your subscription is cancelled, additional paid add-ons, including unused article slots, are
            deactivated.
          </p>
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
  const [slots, setSlots] = useState(null);
  const [buying, setBuying] = useState(false);
  const [busy, setBusy] = useState(false);

  const [adminPosts, setAdminPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listArticles(user.id).then((data) => {
      if (!cancelled) { setArticles(data); setLoading(false); }
    });
    // Posts Maidenhead wrote for this business, shown separately: they are
    // free, they don't touch the slot count, and the business doesn't edit them.
    listAdminPosts(user.id).then((data) => { if (!cancelled) setAdminPosts(data); });
    return () => { cancelled = true; };
  }, [user.id]);

  useEffect(() => {
    let cancelled = false;
    getAddonAllowance(user.id, "article")
      .then((s) => { if (!cancelled) setSlots(s); })
      .catch(() => { /* the included 3 still apply */ });
    return () => { cancelled = true; };
  }, [user.id]);

  // Back from Stripe: re-read the allowance so the new slots show immediately.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("slots") === "success") {
      setToast("Thanks — your extra article slots are ready to use.");
      getAddonAllowance(user.id, "article").then(setSlots).catch(() => {});
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("slots") === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [requested, setRequested] = useState(() => new Set());

  // A Content Manager can't buy — this sends the owner the request with the
  // package already chosen.
  async function handleAskOwner(pack) {
    try {
      await raisePurchaseRequest(user.id, {
        kind: "article", pack,
        note: swapFor ? `To get "${swapFor.title}" live.` : "",
        requestedName: `${user.firstName} ${user.lastName}`,
      });
      setRequested((prev) => new Set(prev).add(pack));
      setToast("Sent to the business owner.");
    } catch (e) {
      setToast(e.message);
    }
  }

  async function handleBuySlots(pack) {
    setBuying(true);
    try {
      await buyAddonSlots(user.id, "article", pack);
    } catch (e) {
      setToast(e.message);
      setBuying(false);
    }
  }

  const liveArticles = articles.filter((a) => a.status === "Live");
  // 3 included, plus any extra slots the owner has bought.
  const allowance = slots?.allowance ?? LIVE_ARTICLE_LIMIT;
  const atLiveLimit = liveArticles.length >= allowance;

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
  //
  // Only a Hidden article goes straight back to Live — it was already
  // approved once and the business just switched it off. A Draft or
  // Rejected one has never been in front of Maidenhead admin, so it goes to
  // Pending Approval instead; the database refuses "Live" from here for
  // exactly that reason (business_content_needs_approval_2026_09.sql).
  async function handleMakeLive(a) {
    if (atLiveLimit) { setSwapFor(a); return; }
    const goLive = a.status === "Hidden";
    const status = goLive ? "Live" : "Pending Approval";
    try {
      await setArticleStatus(a.id, status);
      patch(a.id, { status });
      setToast(goLive ? `"${a.title}" is now live.` : `"${a.title}" sent to Maidenhead for approval.`);
    } catch (e) {
      setToast(e.message);
    }
  }

  async function handleSwap(toHide) {
    setBusy(true);
    const goLive = swapFor.status === "Hidden";
    const status = goLive ? "Live" : "Pending Approval";
    try {
      await swapLiveArticle(toHide.id, swapFor.id, status);
      patch(toHide.id, { status: "Hidden" });
      patch(swapFor.id, { status });
      setToast(goLive
        ? `"${swapFor.title}" is now live in place of "${toHide.title}".`
        : `"${toHide.title}" was hidden, and "${swapFor.title}" was sent to Maidenhead for approval.`);
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
          allowance={allowance} isOwner={user.role === "Owner"} onBuy={handleBuySlots} buying={buying}
          onAsk={handleAskOwner} requested={requested}
          onSwap={handleSwap} onCancel={() => setSwapFor(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>News &amp; Articles</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              Manage your News and Offer articles from here. {ADDON_KINDS.article.included} are included in your subscription.
              You can purchase more any time you need. Edit / Hide / Delete as needed and all will show on your
              business homepage and the News &amp; Offers main page across the website and app. Promote your
              articles for prime visibility on the homepage of the website and app by upgrading.
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
              <strong>{liveArticles.length} of {allowance}</strong> live article{liveArticles.length === 1 ? "" : "s"} in use{slots?.extra ? ` (${ADDON_KINDS.article.included} included + ${slots.extra} purchased)` : ""}
            </p>
            {atLiveLimit && (
              <p className="text-xs" style={{ color: "#92400E" }}>
                At your limit — subscribe for more, or swap one out when you publish something new.
              </p>
            )}
          </div>
        )}

        {/* What's been bought, and when each slot runs out. */}
        <PurchasedSlots businessId={user.id} kind="article" refreshKey={slots?.extra ?? 0} />

        {/* Added by Maidenhead — free, and outside the slot count entirely. */}
        {adminPosts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
            <div>
              <p className="text-sm font-bold" style={{ color: FOREST }}>Added by Maidenhead</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Written for you by the Maidenhead team, free of charge. These don't use any of your
                article slots. To change one, get in touch through Support.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminPosts.map((a) => (
                <div key={a.id} className="rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${BORDER}` }}>
                  {a.image && <img src={a.image} alt="" className="w-full h-28 object-cover" />}
                  <div className="p-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{a.type}</span>
                      <StatusBadge status={a.status} />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#047857" }}>FREE</span>
                    </div>
                    <p className="text-sm font-bold leading-snug" style={{ color: FOREST }}>{a.title}</p>
                    {a.date && <p className="text-[11px]" style={{ color: MUTED }}>{a.date}</p>}
                  </div>
                </div>
              ))}
            </div>
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
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Submitted {formatUK(a.date)}</p>
                  {/* Why admin turned it down — without this the business just
                      saw "Rejected" with no explanation. */}
                  {(a.status === "Rejected" || a.status === "Removed") && a.rejectionReason && (
                    <p className="text-xs rounded-lg px-2.5 py-2" style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#7F1D1D" }}>
                      <span className="font-bold">{a.status === "Removed" ? "Taken down" : "Not approved"}:</span> {a.rejectionReason}
                    </p>
                  )}
                  <div className="flex gap-2 flex-wrap mt-auto pt-2">
                    <button onClick={() => navigate(`/business/articles/${a.id}/edit`)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Edit</button>
                    {a.status === "Live" ? (
                      <button onClick={() => handleHide(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>Hide</button>
                    ) : a.status === "Hidden" ? (
                      <button onClick={() => handleMakeLive(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: "#2563EB" }}>Make Live</button>
                    ) : a.status === "Draft" || a.status === "Rejected" ? (
                      <button onClick={() => handleMakeLive(a)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: "#2563EB" }}>Submit for Approval</button>
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
