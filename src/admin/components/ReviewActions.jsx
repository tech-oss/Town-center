import { useState } from "react";
import { BLUE, MUTED, BORDER, FIELD_STYLE } from "../theme";

// Approve outright, or reject with a reason the submitting business sees on
// their own dashboard. Shared by every approval queue (events, individual
// event dates, business articles) so the moderation gesture is identical
// wherever it appears.
export default function ReviewActions({
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  reasonPlaceholder = "Reason shown to the business…",
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  function reset() {
    setRejecting(false);
    setReason("");
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 mt-3 w-full">
        <input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
          placeholder={reasonPlaceholder}
          className="px-3 py-2 rounded-lg text-xs outline-none" style={FIELD_STYLE} />
        <div className="flex gap-2">
          <button onClick={() => { onReject(reason); reset(); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#B91C1C" }}>
            Confirm {rejectLabel}
          </button>
          <button onClick={reset} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ border: `1.5px solid ${BORDER}`, color: MUTED }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-3">
      <button onClick={onApprove} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
        style={{ backgroundColor: BLUE }}>{approveLabel}</button>
      <button onClick={() => setRejecting(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg"
        style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>{rejectLabel}</button>
    </div>
  );
}
