import { useCallback, useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getBusinessFeatureArticles, approveFeatureArticle, rejectFeatureArticle, takeDownFeatureArticle,
  setFeatureArticleStatus, getFeatureArticleById, deleteFeatureArticle,
  getSpotlightBusinesses, getSlotUsage,
} from "../../api/admin";
import StoryForm from "../components/StoryForm";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ReviewActions from "../components/ReviewActions";
import Toast from "../components/Toast";
import { formatUK } from "../../lib/ukDate";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

const FILTERS = ["Pending Approval", "Live", "Hidden", "Rejected", "Removed", "All"];

// Who wrote it. Admin-written articles used to be missing from this screen
// altogether, so once saved there was nowhere to edit or hide one.
const AUTHORS = [
  { key: "All", label: "Everyone" },
  { key: "business", label: "Written by the business" },
  { key: "admin", label: "Written here" },
];

// A business's Featured Article read the way the public page lays it out —
// hero, title, standfirst, then each section with its own picture — so the
// whole piece can be judged before it goes live.
function FeatureReview({ article: a, position, total, onBack, onPrev, onNext, onApprove, onReject, onTakeDown, onEdit, onSetStatus, onDelete }) {
  const [mode, setMode] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmTakeDown() {
    if (!reason.trim()) return;
    setBusy(true);
    try { await onTakeDown(reason.trim()); } finally { setBusy(false); setMode(null); setReason(""); }
  }

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm font-medium" style={{ color: NAVY }}>← Back to list</button>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>← Previous</button>
          <span className="text-xs" style={{ color: MUTED }}>{position + 1} of {total}</span>
          <button onClick={onNext} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Next →</button>
        </div>
      </div>

      <article className="bg-white rounded-2xl overflow-hidden" style={CARD}>
        {a.heroImage
          ? <img src={a.heroImage} alt="" className="w-full aspect-[16/9] object-cover" />
          : <div className="w-full aspect-[16/9] flex items-center justify-center text-sm" style={{ backgroundColor: "#F1F5F9", color: MUTED }}>No hero image</div>}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusTag status={a.status} />
            {a.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{a.category}</span>}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{a.title}</h1>
          <p className="text-xs" style={{ color: MUTED }}>
            {a.businessId ? a.businessName : "No business attached — shows on the Offers page only"}
            {a.author === "admin" ? " · written here" : ""}
            {a.submittedAt ? ` · submitted ${formatUK(a.submittedAt.slice(0, 10))}` : ""}
          </p>
          {a.standfirst && <p className="text-[17px] leading-8" style={{ color: "#1F2937" }}>{a.standfirst}</p>}

          {a.body.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 pt-2">
              {s.heading && <h2 className="text-lg font-bold" style={{ color: NAVY }}>{s.heading}</h2>}
              {s.image && <img src={s.image} alt="" className="w-full aspect-[16/9] object-cover rounded-xl" />}
              {String(s.text ?? "").split(/\n\s*\n/).filter(Boolean).map((p, j) => (
                <p key={j} className="text-[15px] leading-7 whitespace-pre-line" style={{ color: "#1F2937" }}>{p}</p>
              ))}
            </div>
          ))}

          {(a.website || a.location) && (
            <p className="text-xs pt-2" style={{ color: MUTED }}>
              {[a.location, a.website].filter(Boolean).join(" · ")}
            </p>
          )}
          {a.rejectionReason && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#991B1B" }}>
              <span className="font-bold">Reason given:</span> {a.rejectionReason}
            </p>
          )}
        </div>
      </article>

      {a.status === "Pending Approval" ? (
        <div className="sticky bottom-4 bg-white rounded-2xl px-6 py-4" style={{ ...CARD, boxShadow: "0 8px 30px rgba(16,24,40,0.12)" }}>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>Decision</p>
          <ReviewActions onApprove={onApprove} onReject={onReject} />
        </div>
      ) : (
        <div className="sticky bottom-4 bg-white rounded-2xl px-6 py-4 flex flex-col gap-3" style={{ ...CARD, boxShadow: "0 8px 30px rgba(16,24,40,0.12)" }}>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>Moderation</p>
          {mode === "remove" ? (
            <>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoFocus
                placeholder="Explain what is wrong with this article…"
                className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={{ border: `1.5px solid ${BORDER}`, color: NAVY }} />
              <div className="flex gap-2 flex-wrap">
                <button onClick={confirmTakeDown} disabled={busy || !reason.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: "#D97706" }}>
                  {busy ? "Working…" : "Take off the site"}
                </button>
                <button onClick={() => { setMode(null); setReason(""); }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 flex-wrap items-center">
              <button onClick={onEdit}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: BLUE }}>
                Edit article
              </button>

              {/* Hiding is the reversible one: off the site and off the
                  homepage, nothing lost, no reason owed to anybody. */}
              {a.status === "Live" ? (
                <button onClick={() => onSetStatus("Hidden")}
                  className="px-5 py-2 rounded-xl text-xs font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>
                  Hide from the site
                </button>
              ) : (
                <button onClick={() => onSetStatus("Live")}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#15803D" }}>
                  Put back on the site
                </button>
              )}

              {a.status === "Live" && (
                <button onClick={() => setMode("remove")}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#D97706" }}>
                  Take off the site
                </button>
              )}

              <button onClick={onDelete}
                className="px-5 py-2 rounded-xl text-xs font-semibold ml-auto" style={{ border: "1.5px solid rgba(153,27,27,0.3)", color: "#991B1B" }}>
                Delete for good
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeatureArticleApprovalsPage() {
  const [filter, setFilter] = useState("Pending Approval");
  const [author, setAuthor] = useState("All");
  const [nonce, setNonce] = useState(0);
  const [toast, setToast] = useState("");
  const [openId, setOpenId] = useState(null);
  // null = the list; { article } = the editor, with a null article for a new one.
  const [editing, setEditing] = useState(null);
  const { data, loading } = useFetch(() => getBusinessFeatureArticles({ status: filter, author }), [filter, author, nonce]);
  const { data: businesses } = useFetch(getSpotlightBusinesses, []);
  const { data: usage } = useFetch(() => getSlotUsage("featured_article"), [nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const list = data ?? [];
  const openIndex = list.findIndex((a) => a.id === openId);
  const open = openIndex >= 0 ? list[openIndex] : null;

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }
  function advance() {
    const next = list[openIndex + 1] ?? list[openIndex - 1] ?? null;
    setOpenId(next ? next.id : null);
  }

  async function handleApprove(a) {
    await approveFeatureArticle(a.id);
    flash(`"${a.title}" is now live.`);
    if (filter !== "All") advance();
    refresh();
  }
  async function handleReject(a, reason) {
    await rejectFeatureArticle(a.id, reason);
    flash(`"${a.title}" rejected. ${a.businessName} has been told why.`);
    if (filter !== "All") advance();
    refresh();
  }
  async function handleTakeDown(a, reason) {
    await takeDownFeatureArticle(a.id, reason);
    flash(`"${a.title}" taken off the site. ${a.businessName} has been told why.`);
    if (filter !== "All") advance();
    refresh();
  }

  async function handleSetStatus(a, status) {
    await setFeatureArticleStatus(a.id, status);
    flash(status === "Live"
      ? `"${a.title}" is back on the site.`
      : `"${a.title}" is hidden — it is off the site and off the homepage.`);
    if (filter !== "All") advance();
    refresh();
  }

  async function handleDelete(a) {
    if (!window.confirm(`Delete "${a.title}" for good? This cannot be undone.`)) return;
    await deleteFeatureArticle(a.id);
    flash(`"${a.title}" deleted.`);
    advance();
    refresh();
  }

  // Opening one in the editor. The list row carries only what the review
  // screen shows, so the full article is fetched before the form is built.
  async function handleEdit(a) {
    const full = await getFeatureArticleById(a.id);
    if (!full) return flash("That article could not be opened.");
    setEditing({
      article: {
        ...full,
        // A business writes a title and standfirst but no card wording, so
        // fall back rather than leaving the editor's required boxes empty
        // with no hint of what belongs in them.
        cardHeading: full.cardHeading || full.title,
        cardBody: full.cardBody || full.standfirst,
        eyebrow: full.eyebrow || a.businessName || full.category,
      },
    });
  }

  // Writing a Featured Article, or editing one that exists.
  if (editing) {
    const isNew = !editing.article;
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <Toast message={toast} />
        <button onClick={() => setEditing(null)} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: NAVY }}>
          ← Back to the list
        </button>
        <StoryForm
          initial={editing.article}
          businesses={businesses ?? []}
          capacity={usage?.capacity ?? 4}
          onCancel={() => setEditing(null)}
          onSave={(saved) => {
            setEditing(null);
            flash(`"${saved?.title ?? "Featured Article"}" ${isNew ? "saved" : "updated"}.`);
            refresh();
          }}
        />
      </div>
    );
  }

  if (open) {
    return (
      <>
        <Toast message={toast} />
        <FeatureReview
          article={open}
          position={openIndex}
          total={list.length}
          onBack={() => setOpenId(null)}
          onPrev={() => setOpenId(list[openIndex - 1]?.id ?? open.id)}
          onNext={() => setOpenId(list[openIndex + 1]?.id ?? open.id)}
          onApprove={() => handleApprove(open)}
          onReject={(r) => handleReject(open, r)}
          onTakeDown={(r) => handleTakeDown(open, r)}
          onEdit={() => handleEdit(open)}
          onSetStatus={(s) => handleSetStatus(open, s)}
          onDelete={() => handleDelete(open)}
        />
      </>
    );
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Featured Articles</h1>
          <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
            Every longer editorial piece on the site — the ones businesses write against a Featured Article slot, and the
            ones written here. Open one to read it in full, edit it, hide it or put it on the homepage. Rejecting or taking
            one down sends your reason back to the business. An article attached to a business shows on that business's page
            as well as on Offers; one with no business attached shows on Offers only.
          </p>
        </div>
        <button onClick={() => setEditing({ article: null })}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0" style={{ backgroundColor: BLUE }}>
          + New featured article
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={filter === f
              ? { backgroundColor: BLUE, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap mb-5 items-center">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Written by</span>
        {AUTHORS.map((a) => (
          <button key={a.key} onClick={() => setAuthor(a.key)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={author === a.key
              ? { backgroundColor: NAVY, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {a.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : !list.length ? (
        <EmptyState title="Nothing here" message={`No Featured Articles with status "${filter}"${author === "All" ? "" : `, ${AUTHORS.find((a) => a.key === author).label.toLowerCase()}`}.`} />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((a) => (
            <button key={a.id} type="button" onClick={() => setOpenId(a.id)}
              className="rounded-2xl p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-md" style={CARD}>
              {a.heroImage || a.cardImage
                ? <img src={a.heroImage || a.cardImage} alt="" className="w-24 h-20 rounded-xl object-cover shrink-0" />
                : <div className="w-24 h-20 rounded-xl shrink-0" style={{ backgroundColor: "#F1F5F9" }} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{a.title}</p>
                  <StatusTag status={a.status} />
                  {a.author === "admin" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(15,23,42,0.07)", color: NAVY }}>Written here</span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {a.businessId ? a.businessName : "No business attached — Offers page only"}
                  {a.submittedAt ? ` · ${formatUK(a.submittedAt.slice(0, 10))}` : ""}
                </p>
                {a.standfirst && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: MUTED }}>{a.standfirst}</p>}
              </div>
              <span className="px-4 py-2 rounded-xl text-xs font-semibold shrink-0" style={a.status === "Pending Approval"
                ? { backgroundColor: BLUE, color: "#fff" }
                : { border: `1.5px solid ${BORDER}`, color: NAVY }}>
                {a.status === "Pending Approval" ? "Review" : "View"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
