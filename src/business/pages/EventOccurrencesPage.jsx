import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BusinessLayout from "../components/BusinessLayout";
import {
  Field, Inp, TextArea, Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD,
} from "../components/FormKit";
import {
  getEvent, listOccurrences, updateOccurrence, cancelOccurrence, restoreOccurrence, resetOccurrence,
} from "../api/businessEvents";
import { describeRecurrence } from "../api/eventRecurrence";

const REVIEW_COLOURS = {
  Approved: { bg: "rgba(37,99,235,0.16)", fg: "#2563EB" },
  "Pending Approval": { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  Rejected: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
};
function ReviewBadge({ status }) {
  const c = REVIEW_COLOURS[status] ?? REVIEW_COLOURS.Approved;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

function formatDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function OccurrenceEditForm({ event, occurrence, onSave, onCancel }) {
  const [form, setForm] = useState({
    occurrenceTime: occurrence.occurrenceTime ?? event.eventTime ?? "",
    overrideTitle: occurrence.overrideTitle ?? "",
    overrideSubtitle: occurrence.overrideSubtitle ?? "",
    overrideDescription: occurrence.overrideDescription ?? "",
    overrideLocation: occurrence.overrideLocation ?? "",
  });
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  return (
    <div className="mt-3 p-4 rounded-xl flex flex-col gap-3" style={{ backgroundColor: "#f8fafc", border: `1.5px solid ${BORDER}` }}>
      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Leave a field blank to keep using the event's default. Saving sends this date back for admin review — it stays hidden publicly until approved.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title override" hint={`Default: ${event.title}`}><Inp value={form.overrideTitle} onChange={(e) => set("overrideTitle", e.target.value)} placeholder={event.title} /></Field>
        <Field label="Time"><Inp value={form.occurrenceTime} onChange={(e) => set("occurrenceTime", e.target.value)} placeholder="e.g. 10am - 4pm" /></Field>
        <Field label="Subtitle override" span2 hint={`Default: ${event.subtitle || "—"}`}><Inp value={form.overrideSubtitle} onChange={(e) => set("overrideSubtitle", e.target.value)} placeholder={event.subtitle} /></Field>
        <Field label="Description override" span2 hint="Default: the event's own description"><TextArea rows={3} value={form.overrideDescription} onChange={(e) => set("overrideDescription", e.target.value)} /></Field>
        <Field label="Location override" span2 hint={`Default: ${event.location || "—"}`}><Inp value={form.overrideLocation} onChange={(e) => set("overrideLocation", e.target.value)} placeholder={event.location} /></Field>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Save & Submit for Review</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function EventOccurrencesPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [occurrences, setOccurrences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [toast, setToast] = useToast();

  async function refresh() {
    const [e, occ] = await Promise.all([getEvent(id), listOccurrences(id)]);
    setEvent(e);
    setOccurrences(occ);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveOverride(occId, form) {
    await updateOccurrence(occId, {
      occurrenceTime: form.occurrenceTime,
      overrideTitle: form.overrideTitle,
      overrideSubtitle: form.overrideSubtitle,
      overrideDescription: form.overrideDescription,
      overrideLocation: form.overrideLocation,
    });
    setEditingId(null);
    setToast("Changes submitted for admin review.");
    refresh();
  }
  async function handleReset(occId) {
    await resetOccurrence(occId);
    setToast("Reverted to defaults — submitted for admin review.");
    refresh();
  }
  async function confirmCancel() {
    await cancelOccurrence(cancelling.id);
    setToast(`${formatDate(cancelling.occurrenceDate)} cancelled — submitted for admin review.`);
    setCancelling(null);
    refresh();
  }
  async function handleRestore(occId) {
    await restoreOccurrence(occId);
    setToast("Restored — submitted for admin review.");
    refresh();
  }

  if (loading || !event) {
    return <BusinessLayout><p className="text-sm" style={{ color: MUTED }}>Loading…</p></BusinessLayout>;
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {cancelling && (
        <ConfirmModal title="Cancel this date?" body={`${formatDate(cancelling.occurrenceDate)} will be marked cancelled, pending admin review.`}
          confirmLabel="Cancel Date" onConfirm={confirmCancel} onCancel={() => setCancelling(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-4xl pb-10">
        <button onClick={() => navigate(`/business/events/${id}/edit`)} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>← Edit Event</button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>{event.title}</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            {describeRecurrence({ type: event.recurrenceType, days: event.recurrenceDays, ordinals: event.recurrenceOrdinals })}
            {" · "}Edit or cancel individual dates below. Every change needs admin approval before it shows publicly.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {occurrences.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center" style={CARD}>
              <p className="text-sm" style={{ color: MUTED }}>No upcoming dates yet.</p>
            </div>
          ) : occurrences.map((occ) => (
            <div key={occ.id} className="bg-white rounded-2xl p-4" style={CARD}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold" style={{ color: FOREST }}>
                    {formatDate(occ.occurrenceDate)}
                    {occ.status === "Cancelled" && <span className="ml-2 text-xs font-semibold" style={{ color: "#DC2626" }}>Cancelled</span>}
                  </p>
                  {occ.overrideTitle && <p className="text-xs mt-0.5" style={{ color: MUTED }}>Title: {occ.overrideTitle}</p>}
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{occ.occurrenceTime || event.eventTime || "No time set"}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {occ.isModified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(100,116,139,0.12)", color: MUTED }}>Edited</span>}
                  <ReviewBadge status={occ.reviewStatus} />
                </div>
              </div>
              {occ.reviewStatus === "Rejected" && occ.rejectionReason && (
                <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>Rejected: {occ.rejectionReason}</p>
              )}
              <div className="flex gap-2 flex-wrap mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                <button onClick={() => setEditingId(editingId === occ.id ? null : occ.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
                  {editingId === occ.id ? "Close" : "Edit This Date"}
                </button>
                {occ.isModified && (
                  <button onClick={() => handleReset(occ.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: MUTED }}>Reset to Default</button>
                )}
                {occ.status === "Cancelled" ? (
                  <button onClick={() => handleRestore(occ.id)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: "#2563EB" }}>Restore</button>
                ) : (
                  <button onClick={() => setCancelling(occ)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Cancel This Date</button>
                )}
              </div>
              {editingId === occ.id && (
                <OccurrenceEditForm event={event} occurrence={occ} onCancel={() => setEditingId(null)} onSave={(form) => handleSaveOverride(occ.id, form)} />
              )}
            </div>
          ))}
        </div>
      </div>
    </BusinessLayout>
  );
}
