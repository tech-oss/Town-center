import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getBusinessEvents, approveEvent, rejectEvent,
  getPendingOccurrences, approveOccurrence, rejectOccurrence,
} from "../../api/admin";
import { describeRecurrence } from "../../lib/eventRecurrence";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { NAVY, BLUE, MUTED, BORDER, CARD, FIELD_STYLE } from "../theme";

const EVENT_FILTERS = ["Pending Approval", "Live", "Rejected", "All"];

function formatDate(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
      style={{ backgroundColor: BLUE, color: "#fff" }}>{message}</div>
  );
}

// Approve outright, or reject with a reason the business sees on their own
// dashboard. Shared by both the series queue and the per-date queue.
function ReviewActions({ onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <div className="flex flex-col gap-2 mt-3 w-full">
        <input value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
          placeholder="Reason shown to the business…"
          className="px-3 py-2 rounded-lg text-xs outline-none" style={FIELD_STYLE} />
        <div className="flex gap-2">
          <button onClick={() => { onReject(reason); setRejecting(false); setReason(""); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#B91C1C" }}>Confirm Reject</button>
          <button onClick={() => { setRejecting(false); setReason(""); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: MUTED }}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2 mt-3">
      <button onClick={onApprove} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: BLUE }}>Approve</button>
      <button onClick={() => setRejecting(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Reject</button>
    </div>
  );
}

// ─── Tab 1: whole events / recurring series ─────────────────────────────────
function EventsTab({ setToast }) {
  const [filter, setFilter] = useState("Pending Approval");
  const [nonce, setNonce] = useState(0);
  const { data: events, loading } = useFetch(() => getBusinessEvents({ status: filter }), [filter, nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  async function handleApprove(e) {
    await approveEvent(e.id);
    setToast(`"${e.title}" is now live.`);
    refresh();
  }
  async function handleReject(e, reason) {
    await rejectEvent(e.id, reason);
    setToast(`"${e.title}" rejected.`);
    refresh();
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-5">
        {EVENT_FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
            style={filter === f
              ? { backgroundColor: BLUE, color: "#fff" }
              : { border: `1.5px solid ${BORDER}`, color: MUTED, backgroundColor: "#fff" }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : !events?.length ? (
        <EmptyState title="Nothing here" message={`No events with status "${filter}".`} />
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((e) => (
            <div key={e.id} className="rounded-2xl p-5" style={CARD}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: NAVY }}>{e.title}</p>
                    <StatusTag status={e.status} />
                    {e.isRecurring && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.16)", color: BLUE }}>↻ Recurring</span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>{e.businessName}</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    {e.isRecurring
                      ? describeRecurrence({ type: e.recurrenceType, days: e.recurrenceDays, ordinals: e.recurrenceOrdinals })
                      : formatDate(e.eventDate)}
                    {e.eventTime ? ` · ${e.eventTime}` : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.subtitle && <p className="text-xs mt-2" style={{ color: MUTED }}>{e.subtitle}</p>}
                  {e.description && <p className="text-xs mt-1 line-clamp-3" style={{ color: MUTED }}>{e.description}</p>}
                  {e.status === "Rejected" && e.rejectionReason && (
                    <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>Rejected: {e.rejectionReason}</p>
                  )}
                </div>
                {e.gallery?.[0] && <img src={e.gallery[0]} alt="" className="w-24 h-24 rounded-xl object-cover" />}
              </div>
              {e.status === "Pending Approval" && (
                <ReviewActions onApprove={() => handleApprove(e)} onReject={(r) => handleReject(e, r)} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Tab 2: individual dates awaiting re-review ─────────────────────────────
function OccurrencesTab({ setToast }) {
  const [nonce, setNonce] = useState(0);
  const { data: occurrences, loading } = useFetch(getPendingOccurrences, [nonce]);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  async function handleApprove(o) {
    await approveOccurrence(o.id);
    setToast(`${formatDate(o.occurrenceDate)} approved.`);
    refresh();
  }
  async function handleReject(o, reason) {
    await rejectOccurrence(o.id, reason);
    setToast(`${formatDate(o.occurrenceDate)} rejected.`);
    refresh();
  }

  if (loading) return <LoadingState />;
  if (!occurrences?.length) {
    return <EmptyState title="All caught up" message="No individual event dates are waiting for review." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {occurrences.map((o) => {
        const ev = o.event;
        return (
          <div key={o.id} className="rounded-2xl p-5" style={CARD}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{formatDate(o.occurrenceDate)}</p>
                  {o.status === "Cancelled"
                    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#991B1B" }}>Cancelled by business</span>
                    : o.isModified
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(100,116,139,0.12)", color: MUTED }}>Edited</span>
                      : null}
                </div>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {ev?.title ?? "—"}{ev?.businessName ? ` · ${ev.businessName}` : ""}
                </p>
                {ev?.isRecurring && (
                  <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                    {describeRecurrence({ type: ev.recurrenceType, days: ev.recurrenceDays, ordinals: ev.recurrenceOrdinals })}
                  </p>
                )}

                {/* Only the fields the business actually overrode, next to the
                    series default they replace — the whole point of the review. */}
                <div className="mt-3 flex flex-col gap-1">
                  {o.overrideTitle && <Override label="Title" from={ev?.title} to={o.overrideTitle} />}
                  {o.occurrenceTime && o.occurrenceTime !== ev?.eventTime && <Override label="Time" from={ev?.eventTime} to={o.occurrenceTime} />}
                  {o.overrideSubtitle && <Override label="Subtitle" from={ev?.subtitle} to={o.overrideSubtitle} />}
                  {o.overrideLocation && <Override label="Location" from={ev?.location} to={o.overrideLocation} />}
                  {o.overrideDescription && <Override label="Description" from={ev?.description} to={o.overrideDescription} />}
                  {o.status === "Cancelled" && !o.isModified && (
                    <p className="text-xs" style={{ color: MUTED }}>The business asked to cancel this single date.</p>
                  )}
                </div>
              </div>
            </div>
            <ReviewActions onApprove={() => handleApprove(o)} onReject={(r) => handleReject(o, r)} />
          </div>
        );
      })}
    </div>
  );
}

function Override({ label, from, to }) {
  return (
    <p className="text-xs" style={{ color: MUTED }}>
      <span className="font-semibold" style={{ color: NAVY }}>{label}:</span>{" "}
      <span style={{ textDecoration: "line-through", color: "#9CA3AF" }}>{from || "—"}</span>{" → "}
      <span style={{ color: NAVY }}>{to}</span>
    </p>
  );
}

export default function EventApprovalsPage() {
  const [tab, setTab] = useState("events");
  const [toast, setToast] = useState("");

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Event Approvals</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
        Review events submitted by businesses. Recurring series are approved once; individual dates come back here whenever a business edits or cancels one.
      </p>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
        {[["events", "Events & Series"], ["occurrences", "Individual Dates"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={tab === key ? { backgroundColor: "#fff", color: NAVY, boxShadow: "0 1px 2px rgba(16,24,40,0.08)" } : { color: MUTED }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "events" ? <EventsTab setToast={flash} /> : <OccurrencesTab setToast={flash} />}
    </div>
  );
}
