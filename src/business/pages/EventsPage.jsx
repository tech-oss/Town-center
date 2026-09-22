import { useEffect, useState } from "react";
import AddonSlotsCard from "../components/AddonSlotsCard";
import PurchasedSlots from "../components/PurchasedSlots";
import { ADDON_KINDS, getAddonAllowance } from "../api/addonSlots";
import { formatUK } from "../../lib/ukDate";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { listEvents, setEventStatus, deleteEvent } from "../api/businessEvents";
import { SEE_DO_CATEGORIES } from "../../Data/businessPortalMock";
import { describeRecurrence } from "../api/eventRecurrence";

function categoryLabels(category) {
  return (category ?? []).map((v) => SEE_DO_CATEGORIES.find((o) => o.value === v)?.label ?? v).join(", ");
}

const STATUS_COLOURS = {
  Draft: { bg: "rgba(107,114,128,0.13)", fg: "#374151" },
  "Pending Approval": { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  Live: { bg: "rgba(37,99,235,0.16)", fg: "#2563EB" },
  Rejected: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  Hidden: { bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
};
function StatusBadge({ status }) {
  const c = STATUS_COLOURS[status] ?? STATUS_COLOURS.Draft;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useBusinessAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useToast();
  const [deleting, setDeleting] = useState(null);
  const [slots, setSlots] = useState(null);
  const [showSlots, setShowSlots] = useState(false);

  // How many events this business may have on the site at once. An event slot
  // is bought as an add-on; a recurring event is still one event, so it uses
  // one slot however many dates it runs on.
  const reload = () => getAddonAllowance(user.id, "event").then(setSlots).catch(() => {});
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("slots") === "success") {
      setToast("Thanks — your event slots are ready to use.");
      reload();
    }
    if (params.get("slots")) window.history.replaceState({}, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listEvents(user.id).then((data) => {
      if (!cancelled) { setEvents(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [user.id]);

  async function handleHide(e) {
    const status = e.status === "Hidden" ? "Live" : "Hidden";
    await setEventStatus(e.id, status);
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, status } : x)));
    setToast(e.status === "Hidden" ? `"${e.title}" is live again.` : `"${e.title}" deactivated.`);
  }
  async function handleMakeLive(e) {
    await setEventStatus(e.id, "Live");
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: "Live" } : x)));
    setToast(`"${e.title}" is now live.`);
  }
  async function confirmDelete() {
    await deleteEvent(deleting.id);
    setEvents((prev) => prev.filter((x) => x.id !== deleting.id));
    setToast(`"${deleting.title}" deleted.`);
    setDeleting(null);
  }

  // An event counts against a slot while it is on the site or waiting on
  // admin; a hidden or finished one frees its slot for the next event.
  const onSite = events.filter((e) => e.status === "Live" || e.status === "Pending Approval");
  const allowance = slots?.allowance ?? ADDON_KINDS.event.included;
  const atSlotLimit = onSite.length >= allowance;
  const premium = user.plan ? String(user.plan).toLowerCase() === "premium" : true;

  return (
    <BusinessLayout>
      <Toast message={toast} />
      {deleting && (
        <ConfirmModal title="Delete this event?" body={`"${deleting.title}" will be permanently removed.`} confirmLabel="Delete"
          onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Request Event</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Request a See & Do event for your business — admin approval is required before it goes live.</p>
          </div>
          <button onClick={() => (atSlotLimit ? setShowSlots(true) : navigate("/business/events/new"))}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: SAGE }}>
            + Add New Event
          </button>
        </div>

        {/* What the business's event slots allow, and how to get more. */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
          style={{ backgroundColor: atSlotLimit ? "rgba(217,119,6,0.08)" : "rgba(37,99,235,0.06)" }}>
          <span className="text-sm" style={{ color: atSlotLimit ? "#92400E" : FOREST }}>
            {allowance === 0
              ? "You have no event slots yet. An event slot puts one of your events on the site, and you can re-use it for the next one once that event has finished."
              : <><strong>{onSite.length} of {allowance}</strong> event slot{allowance === 1 ? "" : "s"} in use{slots?.extra ? ` (${slots.extra} purchased)` : ""}.</>}
          </span>
          <button onClick={() => setShowSlots((v) => !v)} className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0"
            style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
            {showSlots ? "Hide packages" : allowance === 0 ? "Get an event slot" : "Get more slots"}
          </button>
        </div>

        {/* What's been bought, and when each slot runs out. */}
        <PurchasedSlots businessId={user.id} kind="event" refreshKey={slots?.extra ?? 0} />

        {showSlots && (
          <AddonSlotsCard businessId={user.id} kind="event" premium={premium}
            isOwner={user.role === "Owner"} requestedBy={`${user.firstName} ${user.lastName}`} onToast={setToast} />
        )}

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading events…</p>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center" style={CARD}>
            <p className="text-sm" style={{ color: MUTED }}>You haven't requested any events yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl overflow-hidden flex flex-col" style={CARD}>
                {(e.heroImage || e.gallery?.[0]) && <img src={e.heroImage || e.gallery[0]} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{e.entryType}</span>
                    <StatusBadge status={e.status} />
                    {e.isRecurring && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.16)", color: "#2563EB" }}>↻ Recurring</span>
                    )}
                  </div>
                  <p className="text-sm font-bold" style={{ color: FOREST }}>{e.title}</p>
                  {e.category?.length > 0 && <p className="text-xs" style={{ color: MUTED }}>{categoryLabels(e.category)}</p>}
                  {e.isRecurring ? (
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>
                      {describeRecurrence({ type: e.recurrenceType, days: e.recurrenceDays, ordinals: e.recurrenceOrdinals })}
                      {e.eventTime ? ` · ${e.eventTime}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{formatUK(e.eventDate)}{e.eventTime ? ` · ${e.eventTime}` : ""}</p>
                  )}
                  <div className="flex gap-2 flex-wrap mt-auto pt-2">
                    <button onClick={() => navigate(`/business/events/${e.id}/edit`)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Edit</button>
                    {e.isRecurring && (
                      <button onClick={() => navigate(`/business/events/${e.id}/dates`)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid rgba(37,99,235,0.3)`, color: "#2563EB" }}>Manage Dates</button>
                    )}
                    {e.status === "Live" || e.status === "Hidden" ? (
                      <button onClick={() => handleHide(e)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>{e.status === "Hidden" ? "Make Live" : "Deactivate"}</button>
                    ) : e.status === "Draft" ? (
                      <button onClick={() => handleMakeLive(e)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(37,99,235,0.3)", color: "#2563EB" }}>Make Live</button>
                    ) : null}
                    <button onClick={() => setDeleting(e)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}
