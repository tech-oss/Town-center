import { useState } from "react";

export default function ApprovalActionBar({ item, onApprove, onReject, onEdit }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (item.source === "xml") {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#1D4ED8" }}>
          ⚡ Auto-published — no action required
        </span>
      </div>
    );
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (required)…"
          rows={2}
          className="w-full text-sm rounded-xl px-3 py-2 resize-none outline-none focus:ring-2"
          style={{ border: "1.5px solid rgba(185,28,28,0.4)", color: "#1B4332", backgroundColor: "#fff" }}
        />
        <div className="flex gap-2">
          <button
            onClick={() => { if (reason.trim()) { onReject?.(item, reason); setRejecting(false); setReason(""); } }}
            disabled={!reason.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "#991B1B" }}
          >
            Confirm Rejection
          </button>
          <button onClick={() => { setRejecting(false); setReason(""); }} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#6B7280", border: "1.5px solid #D1D5DB" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <button onClick={() => onApprove?.(item)} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2D6A4F" }}>
        ✓ Approve
      </button>
      <button onClick={() => setRejecting(true)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80" style={{ color: "#991B1B", border: "1.5px solid rgba(185,28,28,0.4)" }}>
        ✕ Reject
      </button>
      {onEdit && (
        <button onClick={() => onEdit?.(item)} className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#374151", border: "1.5px solid #D1D5DB" }}>
          ✎ Edit
        </button>
      )}
    </div>
  );
}
