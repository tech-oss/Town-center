import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getAllNewsOffers, approveArticle, rejectArticle, takeDownArticle, restoreArticle, deleteBusinessArticle,
  setNewsOfferHidden, deleteNewsOfferPost, getNewsOfferById, setNewsOfferHomepage, getSpotlightBusinesses } from "../../api/admin";
import SearchBar, { matchesQuery } from "../components/SearchBar";
import NewsOfferForm from "../components/NewsOfferForm";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ReviewActions from "../components/ReviewActions";
import Toast from "../components/Toast";
import { formatUK } from "../../lib/ukDate";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

const FILTERS = ["Pending Approval", "Live", "Hidden", "Draft", "Rejected", "Removed", "All"];

// Both sides of the platform in one list. Admin's own posts used to have no
// screen at all once written — they could be created on Home Page Featured
// and then never found again.
const SOURCES = [
  { key: "All", label: "Everyone" },
  { key: "business", label: "Written by the business" },
  { key: "admin", label: "Written here" },
];

function runDates(a) {
  if (!a.startDate) return "";
  return `Runs ${formatUK(a.startDate)}${a.endDate ? ` – ${formatUK(a.endDate)}` : ""}`;
}

// Splits the body into paragraphs the way the public article page does
// (blank lines between paragraphs), so the admin reads exactly what will go
// live rather than one squashed block.
function Paragraphs({ text }) {
  const paras = String(text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return <p className="text-sm italic" style={{ color: "#9CA3AF" }}>No body text was submitted.</p>;
  return paras.map((p, i) => (
    <p key={i} className="text-[15px] leading-7 whitespace-pre-line" style={{ color: "#1F2937" }}>{p}</p>
  ));
}

// The full-page review of one submission: laid out like the public article
// (hero, heading, meta, readable column of text), capped to a reading width
// so long posts can be checked properly before approving or rejecting.
function ArticleReview({ article: a, position, total, onBack, onPrev, onNext, onApprove, onReject, onTakeDown, onRestore, onDelete, onEdit, onToggleHome }) {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>
          ← Back to list
        </button>
        {total > 1 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
            <button onClick={onPrev} disabled={position === 0} className="px-3 py-1.5 rounded-lg font-semibold disabled:opacity-30" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>← Previous</button>
            <span>{position + 1} of {total}</span>
            <button onClick={onNext} disabled={position === total - 1} className="px-3 py-1.5 rounded-lg font-semibold disabled:opacity-30" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Next →</button>
          </div>
        )}
      </div>

      <article className="bg-white rounded-2xl overflow-hidden" style={CARD}>
        {a.heroImage ? (
          <img src={a.heroImage} alt="" className="w-full aspect-[16/9] object-cover" />
        ) : (
          <div className="w-full aspect-[16/6] flex items-center justify-center text-xs" style={{ backgroundColor: "#F1F5F9", color: "#9CA3AF" }}>No hero image submitted</div>
        )}

        <div className="px-6 sm:px-10 py-8 flex flex-col gap-5">
          <div className="flex items-center gap-2 flex-wrap">
            {a.type && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{a.type}</span>
            )}
            <StatusTag status={a.status} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: NAVY }}>{a.title}</h1>

          <dl className="grid sm:grid-cols-3 gap-4 py-4 text-sm" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Business</dt><dd className="font-semibold mt-0.5" style={{ color: NAVY }}>{a.businessName}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Submitted</dt><dd className="mt-0.5" style={{ color: NAVY }}>{formatUK(a.date) || "—"}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Offer runs</dt><dd className="mt-0.5" style={{ color: NAVY }}>{runDates(a).replace(/^Runs /, "") || "Not set"}</dd></div>
          </dl>

          <div className="flex flex-col gap-4">
            <Paragraphs text={a.body} />
          </div>

          {a.thumbnail && a.thumbnail !== a.heroImage && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "#9CA3AF" }}>Card thumbnail</p>
              <img src={a.thumbnail} alt="" className="w-48 aspect-[4/3] rounded-xl object-cover" style={{ border: `1px solid ${BORDER}` }} />
            </div>
          )}

          {a.status === "Rejected" && a.rejectionReason && (
            <p className="text-xs px-3.5 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(185,28,28,0.08)", color: "#991B1B" }}>Rejected: {a.rejectionReason}</p>
          )}
        </div>
      </article>

      {a.status === "Pending Approval" ? (
        <div className="sticky bottom-4 bg-white rounded-2xl px-6 py-4" style={{ ...CARD, boxShadow: "0 8px 30px rgba(16,24,40,0.12)" }}>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>Decision</p>
          <ReviewActions onApprove={onApprove} onReject={onReject} />
        </div>
      ) : (
        /* Approval isn't infallible. Anything already published can still be
           taken off the site — or deleted — and the business is told why. */
        <TakeDownPanel article={a} onTakeDown={onTakeDown} onRestore={onRestore} onDelete={onDelete}
          onEdit={onEdit} onToggleHome={onToggleHome} />
      )}
    </div>
  );
}


// Pulling a published post off the site, restoring it, or deleting it. The
// reason is mandatory: it is what the business is shown and notified with.
function TakeDownPanel({ article, onTakeDown, onRestore, onDelete, onEdit, onToggleHome }) {
  const [mode, setMode] = useState(null); // "remove" | "delete"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // A post admin wrote for nobody in particular owes no explanation; anything
  // belonging to a business does, and deleting always does.
  const owesReason = article.source !== "admin" || !!article.businessId || mode === "delete";

  async function confirm() {
    if (owesReason && !reason.trim()) return;
    setBusy(true);
    try {
      await (mode === "delete" ? onDelete(reason.trim()) : onTakeDown(reason.trim()));
    } finally {
      setBusy(false);
      setMode(null);
      setReason("");
    }
  }

  return (
    <div className="sticky bottom-4 bg-white rounded-2xl px-6 py-4 flex flex-col gap-3" style={{ ...CARD, boxShadow: "0 8px 30px rgba(16,24,40,0.12)" }}>
      <p className="text-xs font-semibold" style={{ color: MUTED }}>Moderation</p>
      {mode ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: MUTED }}>
              {owesReason
                ? `Reason — ${article.businessName || "the business"} is shown this${mode === "delete" ? " before the post is deleted" : ""} *`
                : "Reason (optional — no business is attached)"}
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Explain what is wrong with this post…"
              className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}
            />
          </label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={confirm} disabled={busy || (owesReason && !reason.trim())}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
              style={{ backgroundColor: mode === "delete" ? "#991B1B" : "#D97706" }}>
              {busy ? "Working…" : mode === "delete" ? "Delete permanently" : "Take off the site"}
            </button>
            <button onClick={() => { setMode(null); setReason(""); }}
              className="px-5 py-2 rounded-xl text-xs font-semibold"
              style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex gap-2 flex-wrap items-center">
          {article.source === "admin" && (
            <button onClick={onEdit}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: BLUE }}>
              Edit post
            </button>
          )}

          {/* In the Spotlight on the homepage. Only something live can go up
              there, or the homepage links to a page nobody can open. */}
          {article.status === "Live" && (
            <button onClick={() => onToggleHome(!article.homepage)}
              className="px-5 py-2 rounded-xl text-xs font-semibold"
              style={article.homepage
                ? { border: "1.5px solid rgba(217,119,6,0.35)", color: "#B45309" }
                : { border: `1.5px solid ${BORDER}`, color: NAVY }}>
              {article.homepage ? "Take off the homepage" : "Put on the homepage"}
            </button>
          )}

          {article.status === "Removed" || article.status === "Hidden" ? (
            <button onClick={() => onRestore()}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#16A34A" }}>
              Put back (hidden)
            </button>
          ) : (
            <button onClick={() => setMode("remove")}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#D97706" }}>
              Take off the site
            </button>
          )}
          <button onClick={() => setMode("delete")}
            className="px-5 py-2 rounded-xl text-xs font-semibold" style={{ border: "1.5px solid rgba(153,27,27,0.35)", color: "#991B1B" }}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function ArticleApprovalsPage() {
  const [filter, setFilter] = useState("Pending Approval");
  const [nonce, setNonce] = useState(0);
  const [toast, setToast] = useState("");
  const [openId, setOpenId] = useState(null);
  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [source, setSource] = useState("All");
  const [query, setQuery] = useState("");
  const { data: articles, loading } = useFetch(() => getAllNewsOffers({ status: filter, source }), [filter, source, nonce]);
  const { data: businesses } = useFetch(getSpotlightBusinesses, []);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const list = (articles ?? []).filter((a) => matchesQuery(a, query, ["businessName", "title", "type", "body"]));
  const openIndex = list.findIndex((a) => a.id === openId);
  const open = openIndex >= 0 ? list[openIndex] : null;

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  // After a decision, move on to the next item still in this list, so a
  // queue can be worked through without bouncing back to the list each time.
  function advance() {
    const next = list[openIndex + 1] ?? list[openIndex - 1] ?? null;
    setOpenId(next ? next.id : null);
  }

  async function handleApprove(a) {
    const res = await approveArticle(a.id);
    flash(res.live
      ? `"${a.title}" is now live.`
      : `"${a.title}" approved. ${a.businessName} already has 3 articles live, so it's held until they swap one out.`);
    if (filter !== "All") advance();
    refresh();
  }
  async function handleReject(a, reason) {
    await rejectArticle(a.id, reason);
    flash(`"${a.title}" rejected.`);
    if (filter !== "All") advance();
    refresh();
  }
  // What a post is depends on who wrote it: a business's post is moderated
  // and its author told why, admin's own is simply taken off the site.
  async function handleTakeDown(a, reason) {
    if (a.source === "admin") {
      await setNewsOfferHidden(a.id, true, reason);
      flash(a.businessId
        ? `"${a.title}" is off the site. ${a.businessName} has been told why.`
        : `"${a.title}" is off the site.`);
    } else {
      await takeDownArticle(a.id, reason);
      flash(`"${a.title}" taken off the site. ${a.businessName} has been told why.`);
    }
    if (filter !== "All") advance();
    refresh();
  }
  async function handleRestore(a) {
    if (a.source === "admin") {
      await setNewsOfferHidden(a.id, false);
      flash(`"${a.title}" is back on the site.`);
    } else {
      await restoreArticle(a.id);
      flash(`"${a.title}" put back — hidden until ${a.businessName} makes it live.`);
    }
    refresh();
  }
  async function handleDelete(a, reason) {
    if (a.source === "admin") {
      if (!window.confirm(`Delete "${a.title}" for good? This cannot be undone.`)) return;
      await deleteNewsOfferPost(a.id);
      flash(`"${a.title}" deleted.`);
    } else {
      await deleteBusinessArticle(a.id, reason);
      flash(`"${a.title}" deleted. ${a.businessName} has been told why.`);
    }
    advance();
    refresh();
  }
  async function handleToggleHome(a, on) {
    try {
      const res = await setNewsOfferHomepage(a, on);
      if (res.full) return flash("Every In the Spotlight slot is taken. Take one off first.");
      flash(on ? `"${a.title}" is on the homepage.` : `"${a.title}" is off the homepage.`);
      refresh();
    } catch (e) {
      flash(e.message);
    }
  }
  async function handleEdit(a) {
    if (a.source !== "admin") {
      return flash("Posts a business wrote are edited by the business — you can hide or take this one down.");
    }
    const full = await getNewsOfferById(a.id);
    if (!full) return flash("That post could not be opened.");
    setEditing(full);
  }

  // Writing a post on a business's behalf, or editing one written here.
  if (writing || editing) {
    const close = () => { setWriting(false); setEditing(null); };
    return (
      <div className="max-w-3xl flex flex-col gap-4">
        <Toast message={toast} />
        <button onClick={close} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: NAVY }}>
          ← Back to the list
        </button>
        <NewsOfferForm
          initial={editing}
          businesses={businesses ?? []}
          onCancel={close}
          onSave={(saved) => {
            close();
            flash(`"${saved?.title ?? "Post"}" saved.`);
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
        <ArticleReview
          article={open}
          position={openIndex}
          total={list.length}
          onBack={() => setOpenId(null)}
          onPrev={() => setOpenId(list[openIndex - 1]?.id ?? open.id)}
          onNext={() => setOpenId(list[openIndex + 1]?.id ?? open.id)}
          onApprove={() => handleApprove(open)}
          onReject={(r) => handleReject(open, r)}
          onTakeDown={(r) => handleTakeDown(open, r)}
          onRestore={() => handleRestore(open)}
          onDelete={(r) => handleDelete(open, r)}
          onEdit={() => handleEdit(open)}
          onToggleHome={(on) => handleToggleHome(open, on)}
        />
      </>
    );
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>News &amp; Offers</h1>
          <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
            Every news post and offer on the platform — the ones businesses submit for their listing, and the ones written
            here. Open one to read it in full, hide it, or put it in the homepage In the Spotlight section. Rejecting,
            hiding or deleting a business's post sends your reason back to them.
          </p>
        </div>
        <button onClick={() => setWriting(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0" style={{ backgroundColor: BLUE }}>
          + New news or offer
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
        {SOURCES.map((sc) => (
          <button key={sc.key} onClick={() => setSource(sc.key)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={source === sc.key
              ? { backgroundColor: NAVY, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {sc.label}
          </button>
        ))}
      </div>

      <SearchBar value={query} onChange={setQuery}
        placeholder="Search by business, title or type…" />

      {loading ? <LoadingState /> : !list.length ? (
        <EmptyState title="Nothing here" message={`No posts with status "${filter}".`} />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((a) => (
            <button key={a.id} type="button" onClick={() => setOpenId(a.id)}
              className="rounded-2xl p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-md" style={CARD}>
              {a.heroImage
                ? <img src={a.heroImage} alt="" className="w-24 h-20 rounded-xl object-cover shrink-0" />
                : <div className="w-24 h-20 rounded-xl shrink-0" style={{ backgroundColor: "#F1F5F9" }} />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{a.title}</p>
                  <StatusTag status={a.status} />
                  {a.type && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{a.type}</span>
                  )}
                  {a.source === "admin" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(15,23,42,0.07)", color: NAVY }}>Written here</span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {a.businessId ? a.businessName : "No business attached"}{a.date ? ` · ${formatUK(a.date)}` : ""}{runDates(a) ? ` · ${runDates(a)}` : ""}
                </p>
                {a.body && <p className="text-xs mt-1.5 line-clamp-2" style={{ color: MUTED }}>{a.body}</p>}
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
