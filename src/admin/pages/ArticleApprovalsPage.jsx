import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getBusinessArticles, approveArticle, rejectArticle } from "../../api/admin";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ReviewActions from "../components/ReviewActions";
import Toast from "../components/Toast";
import { formatUK } from "../../lib/ukDate";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

const FILTERS = ["Pending Approval", "Live", "Rejected", "All"];

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
function ArticleReview({ article: a, position, total, onBack, onPrev, onNext, onApprove, onReject }) {
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

      {a.status === "Pending Approval" && (
        <div className="sticky bottom-4 bg-white rounded-2xl px-6 py-4" style={{ ...CARD, boxShadow: "0 8px 30px rgba(16,24,40,0.12)" }}>
          <p className="text-xs font-semibold" style={{ color: MUTED }}>Decision</p>
          <ReviewActions onApprove={onApprove} onReject={onReject} />
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
  const { data: articles, loading } = useFetch(() => getBusinessArticles({ status: filter }), [filter, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const list = articles ?? [];
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
        />
      </>
    );
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Business News &amp; Offers</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
        Review the news posts and offers businesses submit for their listing. Open one to read it in full before deciding — rejecting sends your reason back to the business.
      </p>

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

      {loading ? <LoadingState /> : !list.length ? (
        <EmptyState title="Nothing here" message={`No business posts with status "${filter}".`} />
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
                </div>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {a.businessName}{a.date ? ` · ${formatUK(a.date)}` : ""}{runDates(a) ? ` · ${runDates(a)}` : ""}
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
