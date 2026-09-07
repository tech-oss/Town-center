import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getReviews, hideReview, restoreReview, deleteReview, approveReply, rejectReply } from "../../api/admin";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";
import ReviewActions from "../components/ReviewActions";
import { NAVY, BLUE, MUTED, BORDER, CARD, FIELD_STYLE } from "../theme";

const FILTERS = ["All", "Visible", "Hidden"];

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
  const [filter, setFilter] = useState("All");
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
        Customer reviews across every business listing. Hiding pulls a review off the public site but keeps it on record; deleting is permanent.
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
                    {r.status === "Hidden" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#991B1B" }}>Hidden</span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>{r.businessName} · {r.date}</p>
                  {r.text && <p className="text-xs mt-2" style={{ color: NAVY }}>{r.text}</p>}
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
                  {r.status === "Hidden" && r.moderationNote && (
                    <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>Hidden: {r.moderationNote}</p>
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
                  {r.status === "Hidden" ? (
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
