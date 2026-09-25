import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getReviews, hideReview, restoreReview, deleteReview, approveReply, rejectReply, approveReview, rejectReview } from "../../api/admin";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";
import ReviewActions from "../components/ReviewActions";
import { NAVY, BLUE, MUTED, BORDER, CARD, FIELD_STYLE } from "../theme";
import { formatUK } from "../../lib/ukDate";

// "Visible" means approved, not necessarily live: only a business's 6 most
// recent Visible reviews actually reach the site (MAX_LIVE_REVIEWS below),
// so the tab is labelled by what the status actually means.
const FILTERS = ["Pending Approval", "Visible", "Rejected", "Hidden", "All"];
const FILTER_LABELS = { Visible: "Approved" };

function Stars({ rating }) {
  const n = Math.round(Number(rating) || 0);
  return (
    <span className="text-xs" style={{ color: "#D97706" }} title={`${rating} out of 5`}>
      {"★".repeat(n)}{"☆".repeat(Math.max(0, 5 - n))}
    </span>
  );
}

// Hiding asks for a note so the next admin can see why a review was pulled.
function HideForm({ onHide, onCancel }) {
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-col gap-2 mt-3">
      <input value={note} onChange={(e) => setNote(e.target.value)} autoFocus
        placeholder="Why is this being hidden? (internal note)"
        className="px-3 py-2 rounded-lg text-xs outline-none" style={FIELD_STYLE} />
      <div className="flex gap-2">
        <button onClick={() => onHide(note)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#B91C1C" }}>Hide Review</button>
        <button onClick={onCancel} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: MUTED }}>Cancel</button>
      </div>
    </div>
  );
}

export default function ReviewModerationPage() {
  const [filter, setFilter] = useState("Pending Approval");
  const [nonce, setNonce] = useState(0);
  const [toast, setToast] = useState("");
  const [hidingId, setHidingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { data: reviews, loading } = useFetch(() => getReviews({ status: filter }), [filter, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  async function handleHide(r, note) {
    await hideReview(r.id, note);
    setHidingId(null);
    flash("Review hidden from the public listing.");
    refresh();
  }
  async function handleRestore(r) {
    await restoreReview(r.id);
    flash("Review restored.");
    refresh();
  }
  async function handleApproveReview(r) {
    await approveReview(r.id);
    // Not necessarily live yet — only the 6 most recent approved reviews per
    // business reach the site, and this one might not be among them. The
    // list refreshes with the accurate badge right after.
    flash(`Review from ${r.reviewer} approved.`);
    refresh();
  }
  async function handleRejectReview(r, reason) {
    await rejectReview(r.id, reason);
    flash("Review rejected.");
    refresh();
  }

  async function handleApproveReply(r) {
    await approveReply(r.id);
    flash("Reply approved.");
    refresh();
  }
  async function handleRejectReply(r, reason) {
    await rejectReply(r.id, reason);
    flash("Reply rejected.");
    refresh();
  }
  async function handleDelete(r) {
    await deleteReview(r.id);
    setConfirmDelete(null);
    flash("Review permanently deleted.");
    refresh();
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Review Moderation</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
        Reviews businesses add to their listing. Each new or edited review waits here for approval before it can appear on the business's page — and only the 6 most recent approved reviews actually show at once, so an approved review can still be waiting its turn. Hiding pulls a live review off the site but keeps it on record; deleting is permanent.
      </p>

      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={filter === f
              ? { backgroundColor: BLUE, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {FILTER_LABELS[f] ?? f}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : !reviews?.length ? (
        <EmptyState title="No reviews" message={filter === "All" ? "No customer reviews have been left yet." : `No ${filter.toLowerCase()} reviews.`} />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl p-5" style={CARD}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{r.reviewer}</p>
                    <Stars rating={r.rating} />
                    {r.status !== "Visible" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={r.status === "Pending Approval"
                        ? { backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }
                        : { backgroundColor: "rgba(220,38,38,0.1)", color: "#991B1B" }}>{r.status}</span>
                    )}
                    {r.status === "Visible" && (r.onSite
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(22,163,74,0.14)", color: "#15803D" }}>Live</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.12)", color: "#1D4ED8" }}>Approved — not shown</span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>{r.businessName} · {formatUK(r.date)}</p>
                  {r.text && <p className="text-xs mt-2" style={{ color: NAVY }}>{r.text}</p>}
                  {/* The review's source URL (the Google / Trustpilot page the
                      business copied it from) is what proves it's genuine, so
                      it always has a row — shown in full, or flagged as missing. */}
                  <div className="mt-2.5 rounded-lg px-3 py-2 text-[11px] flex items-center gap-2 min-w-0"
                    style={r.verificationLink
                      ? { backgroundColor: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.18)" }
                      : { backgroundColor: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)" }}>
                    <span className="font-bold shrink-0" style={{ color: r.verificationLink ? NAVY : "#92400E" }}>Review URL:</span>
                    {r.verificationLink ? (
                      <a href={/^https?:\/\//i.test(r.verificationLink) ? r.verificationLink : `https://${r.verificationLink}`}
                        target="_blank" rel="noreferrer" className="font-semibold hover:underline truncate" style={{ color: BLUE }}>
                        {r.verificationLink} ↗
                      </a>
                    ) : (
                      <span style={{ color: "#92400E" }}>None provided — this review can't be verified against its source.</span>
                    )}
                  </div>
                  {r.reply && (
                    <div className="mt-2 pl-3" style={{ borderLeft: `2px solid ${BORDER}` }}>
                      <p className="text-xs" style={{ color: MUTED }}>
                        <span className="font-semibold">Business replied:</span> {r.reply}
                        {r.replyStatus && r.replyStatus !== "Approved" && (
                          <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={r.replyStatus === "Rejected"
                              ? { backgroundColor: "rgba(220,38,38,0.1)", color: "#991B1B" }
                              : { backgroundColor: "rgba(217,119,6,0.14)", color: "#92400E" }}>
                            Reply {r.replyStatus}
                          </span>
                        )}
                      </p>
                      {r.replyStatus === "Pending Approval" && (
                        <ReviewActions
                          approveLabel="Approve Reply" rejectLabel="Reject Reply"
                          onApprove={() => handleApproveReply(r)}
                          onReject={(reason) => handleRejectReply(r, reason)} />
                      )}
                    </div>
                  )}
                  {r.status === "Visible" && !r.onSite && (
                    <p className="text-[11px] mt-2" style={{ color: "#1D4ED8" }}>
                      {r.offSiteReason === "plan"
                        ? `Approved, but reviews are a Visibility Plan feature and ${r.businessName} isn't currently on it (or isn't approved/visible). Nothing here will show until that changes.`
                        : `Approved, but ${r.businessName} already has 6 more recent reviews live. This one shows automatically once one of those is removed or hidden.`}
                    </p>
                  )}
                  {(r.status === "Hidden" || r.status === "Rejected") && r.moderationNote && (
                    <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>{r.status}: {r.moderationNote}</p>
                  )}
                  {r.status === "Pending Approval" && (
                    <ReviewActions
                      approveLabel="Approve & publish" rejectLabel="Reject"
                      onApprove={() => handleApproveReview(r)}
                      onReject={(reason) => handleRejectReview(r, reason)} />
                  )}
                </div>
              </div>

              {hidingId === r.id ? (
                <HideForm onHide={(note) => handleHide(r, note)} onCancel={() => setHidingId(null)} />
              ) : confirmDelete === r.id ? (
                <div className="flex gap-2 items-center flex-wrap mt-3">
                  <span className="text-xs" style={{ color: "#991B1B" }}>Permanently delete this review?</span>
                  <button onClick={() => handleDelete(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#B91C1C" }}>Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: MUTED }}>Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  {r.status === "Pending Approval" ? null : r.status === "Rejected" ? (
                    <button onClick={() => handleApproveReview(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: BLUE }}>Approve instead</button>
                  ) : r.status === "Hidden" ? (
                    <button onClick={() => handleRestore(r)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: BLUE }}>Restore</button>
                  ) : (
                    <button onClick={() => setHidingId(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Hide</button>
                  )}
                  <button onClick={() => setConfirmDelete(r.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: MUTED }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
