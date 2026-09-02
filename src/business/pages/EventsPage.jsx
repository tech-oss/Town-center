import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast, ConfirmModal, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { listEvents, setEventStatus, deleteEvent } from "../api/businessEvents";
import { SEE_DO_CATEGORIES } from "../../Data/businessPortalMock";

function categoryLabels(category) {
  return (category ?? []).map((v) => SEE_DO_CATEGORIES.find((o) => o.value === v)?.label ?? v).join(", ");
}

const STATUS_COLOURS = {
  Draft: { bg: "rgba(107,114,128,0.13)", fg: "#374151" },
  "Pending Approval": { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
  Live: { bg: "rgba(82,199,182,0.16)", fg: "#0F766E" },
  Rejected: { bg: "rgba(220,38,38,0.1)", fg: "#991B1B" },
  Hidden: { bg: "rgba(232,163,61,0.16)", fg: "#92400E" },
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
          <button onClick={() => navigate("/business/events/new")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: SAGE }}>
            + Add New Event
          </button>
        </div>

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
                {e.gallery?.[0] && <img src={e.gallery[0]} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: "#1D4ED8" }}>{e.entryType}</span>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="text-sm font-bold" style={{ color: FOREST }}>{e.title}</p>
                  {e.category?.length > 0 && <p className="text-xs" style={{ color: MUTED }}>{categoryLabels(e.category)}</p>}
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{e.eventDate}{e.eventTime ? ` · ${e.eventTime}` : ""}</p>
                  <div className="flex gap-2 flex-wrap mt-auto pt-2">
                    <button onClick={() => navigate(`/business/events/${e.id}/edit`)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>Edit</button>
                    {e.status === "Live" || e.status === "Hidden" ? (
                      <button onClick={() => handleHide(e)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>{e.status === "Hidden" ? "Make Live" : "Deactivate"}</button>
                    ) : e.status === "Draft" ? (
                      <button onClick={() => handleMakeLive(e)} className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ border: "1.5px solid rgba(82,199,182,0.35)", color: "#0F766E" }}>Make Live</button>
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
