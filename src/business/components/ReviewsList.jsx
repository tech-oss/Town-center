import { useState } from "react";
import { Stars, TextArea, MUTED, BORDER, FOREST, SAGE } from "./FormKit";

// ─── Rating breakdown bar chart ────────────────────────────────────────────────
function RatingBreakdown({ reviews }) {
  const total = reviews.length || 1;
  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);
  return (
    <div className="flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((star, i) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-8 shrink-0" style={{ color: MUTED }}>{star}★</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF2F1" }}>
            <div className="h-full rounded-full" style={{ width: `${(counts[i] / total) * 100}%`, backgroundColor: "#E8A33D" }} />
          </div>
          <span className="w-4 text-right shrink-0" style={{ color: MUTED }}>{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function ReviewsSummary({ reviews }) {
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row gap-6 items-start sm:items-center"
      style={{ border: "1px solid rgba(28,46,56,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" }}>
      <div className="text-center shrink-0">
        <p className="text-3xl font-bold" style={{ color: FOREST }}>{avg}</p>
        <Stars rating={Math.round(reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0)} size={16} />
        <p className="text-xs mt-1" style={{ color: MUTED }}>{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
      </div>
      <div className="flex-1 w-full">
        <RatingBreakdown reviews={reviews} />
      </div>
    </div>
  );
}

export default function ReviewsList({ reviews, onReply }) {
  const [replyingId, setReplyingId] = useState(null);
  const [draft, setDraft] = useState("");

  function startReply(id) { setReplyingId(id); setDraft(""); }
  function submitReply(id) {
    if (!draft.trim()) return;
    onReply(id, draft.trim());
    setReplyingId(null);
    setDraft("");
  }

  if (reviews.length === 0) {
    return <p className="text-sm" style={{ color: MUTED }}>No reviews yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl p-4 flex flex-col gap-2" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: FOREST }}>{r.reviewer}</span>
              <Stars rating={r.rating} />
            </div>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>{r.date}</span>
          </div>
          <p className="text-sm" style={{ color: FOREST }}>{r.text}</p>

          {r.reply && (
            <div className="ml-4 mt-1 rounded-xl p-3" style={{ backgroundColor: "rgba(82,199,182,0.06)", border: "1px solid rgba(82,199,182,0.2)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#0F766E" }}>
                Your reply {r.reply.status && r.reply.status !== "Published" && `· ${r.reply.status}`}
              </p>
              <p className="text-sm" style={{ color: FOREST }}>{r.reply.text}</p>
            </div>
          )}

          {!r.reply && replyingId !== r.id && (
            <button onClick={() => startReply(r.id)} className="self-start text-xs font-semibold mt-1 transition-opacity hover:opacity-70" style={{ color: "#0F766E" }}>Reply</button>
          )}

          {replyingId === r.id && (
            <div className="flex flex-col gap-2 mt-1">
              <TextArea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a reply…" />
              <div className="flex gap-2">
                <button onClick={() => submitReply(r.id)} disabled={!draft.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40" style={{ backgroundColor: SAGE }}>Submit Reply</button>
                <button onClick={() => setReplyingId(null)} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
