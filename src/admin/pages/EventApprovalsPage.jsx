import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getBusinessEvents, approveEvent, rejectEvent, deleteBusinessEvent,
  hideEvent, unhideEvent, setEventHomepageFeature,
  getPendingOccurrences, approveOccurrence, rejectOccurrence,
} from "../../api/admin";
import EventEditor from "./EventEditor";
import { describeRecurrence } from "../../lib/eventRecurrence";
import StatusTag from "../components/StatusTag";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import ReviewActions from "../components/ReviewActions";
import Toast from "../components/Toast";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

// "Removed" is what admin's Hide writes; "Hidden" is the business's own
// Deactivate, which admin can see but does not overrule.
const EVENT_FILTERS = ["Pending Approval", "Live", "Removed", "Hidden", "Rejected", "All"];

function formatDate(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// ─── Tab 1: whole events / recurring series ─────────────────────────────────
function EventsTab({ setToast, onEdit, nonce, refresh }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  // Which event is having its reason typed, and what has been typed.
  const [hiding, setHiding] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: events, loading } = useFetch(() => getBusinessEvents({ status: filter }), [filter, nonce]);

  // Searching by business, which is how admin looks for an event in practice —
  // the title is rarely what is remembered. Matches the event's own words too,
  // so one box covers both. A town event with no business behind it answers to
  // "town".
  const q = query.trim().toLowerCase();
  const shown = !q ? (events ?? []) : (events ?? []).filter((e) => {
    const business = e.businessName ?? "Town event";
    return `${business} ${e.title} ${e.location ?? ""} ${e.subtitle ?? ""}`.toLowerCase().includes(q);
  });

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
  async function handleDelete(e) {
    if (!confirm(`Delete "${e.title}"? This also removes its public event page.`)) return;
    await deleteBusinessEvent(e.id);
    setToast(`"${e.title}" deleted.`);
    refresh();
  }
  async function confirmHide(e) {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await hideEvent(e.id, reason.trim());
      setToast(e.businessName
        ? `"${e.title}" is off the site. ${e.businessName} has been told why.`
        : `"${e.title}" is off the site.`);
      setHiding(null);
      setReason("");
      refresh();
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function handleUnhide(e) {
    try {
      await unhideEvent(e.id);
      setToast(`"${e.title}" is back on the site.`);
      refresh();
    } catch (err) {
      // The slot limit can refuse this: hiding freed a slot the business has
      // since filled. The message says so, so pass it straight through.
      setToast(err.message);
    }
  }
  // Same pathway as Featured Articles and News & Offers: a What's On booking
  // is a homepage_placements row (see api/admin/homepageSlots.js), so putting
  // one on or taking it off is the same featureNow/unfeature call either
  // section uses.
  async function handleToggleHome(e, on) {
    try {
      const res = await setEventHomepageFeature(e.id, on);
      if (res.full) return setToast("Every What's On slot is taken. Take one off first.");
      setToast(on ? `"${e.title}" is on the homepage.` : `"${e.title}" is off the homepage.`);
      refresh();
    } catch (err) {
      setToast(err.message);
    }
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

      <div className="mb-5 relative max-w-md">
        <input
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          placeholder="Search by business, event or place…"
          className="w-full rounded-xl pl-3.5 pr-20 py-2.5 text-sm outline-none"
          style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}
        />
        {query && (
          <button onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{ color: MUTED }}>
            Clear
          </button>
        )}
      </div>

      {loading ? <LoadingState /> : !shown.length ? (
        <EmptyState title="Nothing here" message={q
          ? `No events matching "${query}"${filter === "All" ? "" : ` with status "${filter}"`}.`
          : `No events with status "${filter}".`} />
      ) : (
        <div className="flex flex-col gap-3">
          {q && (
            <p className="text-xs" style={{ color: MUTED }}>
              {shown.length} of {events.length} event{events.length === 1 ? "" : "s"} match “{query}”.
            </p>
          )}
          {shown.map((e) => (
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
                  <p className="text-xs mt-1" style={{ color: MUTED }}>{e.businessName ?? "Town event"}</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                    {e.isRecurring
                      ? describeRecurrence({ type: e.recurrenceType, days: e.recurrenceDays, ordinals: e.recurrenceOrdinals })
                      : formatDate(e.eventDate)}
                    {e.eventTime ? ` · ${e.eventTime}` : ""}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                  {e.subtitle && <p className="text-xs mt-2" style={{ color: MUTED }}>{e.subtitle}</p>}
                  {e.description && <p className="text-xs mt-1 line-clamp-3" style={{ color: MUTED }}>{e.description}</p>}
                  {(e.status === "Rejected" || e.status === "Removed") && e.rejectionReason && (
                    <p className="text-[11px] mt-2" style={{ color: "#991B1B" }}>
                      {e.status === "Removed" ? "Hidden" : "Rejected"}: {e.rejectionReason}
                    </p>
                  )}
                </div>
                {(e.heroImage || e.gallery?.[0]) && <img src={e.heroImage || e.gallery[0]} alt="" className="w-24 h-24 rounded-xl object-cover" />}
              </div>
              {e.status === "Pending Approval" && (
                <ReviewActions onApprove={() => handleApprove(e)} onReject={(r) => handleReject(e, r)} />
              )}
              <div className="flex gap-2 mt-3 pt-3 items-center flex-wrap" style={{ borderTop: `1px solid ${BORDER}` }}>
                {e.homepage && (
                  <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide self-center" style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#B91C1C" }}>
                    ● Live on home page
                  </span>
                )}
                {/* Only something actually on the site can go up there, or the
                    homepage links to a page nobody can open — same rule as
                    Featured Articles and News & Offers. */}
                {e.status === "Live" && (
                  <button onClick={() => handleToggleHome(e, !e.homepage)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                    style={e.homepage
                      ? { border: "1.5px solid rgba(217,119,6,0.35)", color: "#B45309" }
                      : { border: `1.5px solid ${BORDER}`, color: NAVY }}>
                    {e.homepage ? "Take off the homepage" : "Put on the homepage"}
                  </button>
                )}
                <button onClick={() => onEdit(e)} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Edit</button>
                {e.status === "Live" && (
                  <button onClick={() => { setHiding(e.id); setReason(""); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ border: "1.5px solid rgba(217,119,6,0.35)", color: "#B45309" }}>Hide</button>
                )}
                {e.status === "Removed" && (
                  <button onClick={() => handleUnhide(e)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "#15803D" }}>Put back on the site</button>
                )}
                {/* The business turned this one off itself — its choice to undo. */}
                {e.status === "Hidden" && (
                  <span className="px-2.5 py-1.5 text-[11px] self-center" style={{ color: MUTED }}>
                    Deactivated by the business
                  </span>
                )}
                <button onClick={() => handleDelete(e)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
              </div>

              {/* Hiding takes a reason, because the business reads it. */}
              {hiding === e.id && (
                <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <label className="text-xs font-semibold" style={{ color: MUTED }}>
                    Why is this coming off the site?
                    {e.businessName ? ` ${e.businessName} is shown this.` : ""}
                  </label>
                  <textarea value={reason} onChange={(ev) => setReason(ev.target.value)} rows={3} autoFocus
                    placeholder="Explain what is wrong with this event…"
                    className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ border: `1.5px solid ${BORDER}`, color: NAVY }} />
                  <div className="flex gap-2">
                    <button onClick={() => confirmHide(e)} disabled={busy || !reason.trim()}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                      style={{ backgroundColor: "#D97706" }}>
                      {busy ? "Hiding…" : "Hide from the site"}
                    </button>
                    <button onClick={() => { setHiding(null); setReason(""); }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>Cancel</button>
                  </div>
                </div>
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
  const [editing, setEditing] = useState(null);   // null = list, {} = new, event = edit
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  if (editing !== null) {
    return (
      <>
        <Toast message={toast} />
        <EventEditor
          initial={editing?.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setEditing(null);
            refresh();
            flash(isNew ? `"${saved.title}" created and live.` : `"${saved.title}" updated.`);
          }}
        />
      </>
    );
  }

  return (
    <div className="max-w-5xl">
      <Toast message={toast} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Events</h1>
          <p className="text-sm mt-1 mb-6" style={{ color: MUTED }}>
            Create event pages for See &amp; Do, and review events submitted by businesses. Recurring series are approved once; individual dates come back here whenever a business edits or cancels one.
          </p>
        </div>
        <button onClick={() => setEditing({})} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0" style={{ backgroundColor: BLUE }}>
          + Create Event
        </button>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: "rgba(16,24,40,0.05)" }}>
        {[["events", "Events & Series"], ["occurrences", "Individual Dates"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={tab === key ? { backgroundColor: "#fff", color: NAVY, boxShadow: "0 1px 2px rgba(16,24,40,0.08)" } : { color: MUTED }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "events"
        ? <EventsTab setToast={flash} onEdit={setEditing} nonce={nonce} refresh={refresh} />
        : <OccurrencesTab setToast={flash} />}
    </div>
  );
}
