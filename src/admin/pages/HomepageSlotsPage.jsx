import { useEffect, useMemo, useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getSlotTypes, saveSlotType, getPlacements, getSlotContentOptions,
  schedulePlacement, endPlacement, cancelPlacement, approvePlacement, rejectPlacement,
  PLACEMENT_STATUS_LABELS,
} from "../../api/admin";
import { FEATURED_GROUP_LABELS } from "../../api/admin/businesses";
import { toLondonInput, fromLondonInput } from "../../lib/ukDateTime";
import PlacementTimer from "../components/PlacementTimer";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

// Every homepage placement is a booking with a start and end (UK time):
// In the Spotlight, Featured Articles, What's On and Featured Businesses.
// Admin can add, move, swap, end and approve any of them here, and sets what
// businesses pay for each. Businesses book from their dashboard; their
// bookings arrive here for approval once they've chosen what to show.

const NAVY = "#1E293B";
const MUTED = "#6B7280";
const BLUE = "#2563EB";
const BORDER = "rgba(16,24,40,0.12)";
const CARD = { boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)", border: "1px solid rgba(16,24,40,0.08)" };
const INPUT = "rounded-xl px-3 py-2.5 text-sm outline-none w-full";
const INPUT_STYLE = { border: "1.5px solid rgba(16,24,40,0.2)", color: NAVY, backgroundColor: "#fff" };

const KIND_LABELS = {
  news_offer: "Admin post",
  business_article: "Business post",
  feature_article: "Featured story",
  business_event: "Event",
  business: "Business listing",
};

const STATUS_TONES = {
  held: ["rgba(16,24,40,0.06)", MUTED],
  awaiting_content: ["rgba(217,119,6,0.12)", "#92400E"],
  pending_approval: ["rgba(220,38,38,0.1)", "#B91C1C"],
  approved: ["rgba(22,163,74,0.12)", "#15803D"],
  rejected: ["rgba(16,24,40,0.08)", "#991B1B"],
  cancelled: ["rgba(16,24,40,0.06)", MUTED],
};

const DAY_MS = 86_400_000;

function nextFiveMinutes() {
  const d = new Date(Date.now() + 60_000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5);
  return d;
}

function poolLabel(pool) {
  return pool === "all" ? "" : (FEATURED_GROUP_LABELS[pool] ?? pool);
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div role="status" className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg flex items-center gap-3 max-w-sm"
      style={{ backgroundColor: toast.error ? "#991B1B" : NAVY, color: "#fff" }}>
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onDismiss} aria-label="Dismiss" className="opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
    </div>
  );
}

function StatusChip({ status }) {
  const [bg, fg] = STATUS_TONES[status] ?? STATUS_TONES.held;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap" style={{ backgroundColor: bg, color: fg }}>
      {PLACEMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Add / edit a booking ───────────────────────────────────────────────────
function PlacementDialog({ slotType, placement, onClose, onSaved }) {
  const { data: options, loading } = useFetch(() => getSlotContentOptions(slotType.key), [slotType.key]);
  const defaultStart = placement?.startsAt ? new Date(placement.startsAt) : nextFiveMinutes();
  const defaultEnd = placement?.endsAt ? new Date(placement.endsAt) : new Date(defaultStart.getTime() + slotType.durationDays * DAY_MS);

  const [contentKey, setContentKey] = useState(placement?.contentId ? `${placement.contentKind}:${placement.contentId}` : "");
  const [start, setStart] = useState(toLondonInput(defaultStart));
  const [end, setEnd] = useState(toLondonInput(defaultEnd));
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = (options ?? []).filter((o) =>
    !query.trim() || `${o.title} ${o.detail}`.toLowerCase().includes(query.trim().toLowerCase()));

  function setLength(days) {
    const s = fromLondonInput(start);
    if (s) setEnd(toLondonInput(new Date(s.getTime() + days * DAY_MS)));
  }

  async function save() {
    setError("");
    const option = (options ?? []).find((o) => `${o.kind}:${o.id}` === contentKey);
    if (!option && !placement) { setError("Choose what to show."); return; }
    // Only send content when admin picked something new; changing just the
    // dates leaves a business's booking (and its approval state) as it is.
    const originalKey = placement?.contentId ? `${placement.contentKind}:${placement.contentId}` : "";
    const changed = option && `${option.kind}:${option.id}` !== originalKey;
    const startsAt = fromLondonInput(start);
    const endsAt = fromLondonInput(end);
    if (!startsAt || !endsAt) { setError("Enter a start and end date and time."); return; }
    if (endsAt <= startsAt) { setError("The end must be after the start."); return; }
    setSaving(true);
    try {
      await schedulePlacement({
        id: placement?.id ?? null,
        slotType: slotType.key,
        contentKind: changed ? option.kind : null,
        contentId: changed ? option.id : null,
        businessId: changed ? (option.businessId ?? null) : null,
        startsAt, endsAt,
      });
      onSaved(placement ? "Booking updated." : `Added to ${slotType.label}.`);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(16,24,40,0.55)" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="placement-dialog-title"
        className="bg-white rounded-2xl p-6 max-w-xl w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 20px 60px rgba(16,24,40,0.3)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="placement-dialog-title" className="font-bold text-base" style={{ color: NAVY }}>
              {placement ? `Edit ${slotType.label} booking` : `Add to ${slotType.label}`}
            </h3>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              Times are UK time. It shows on the homepage from the start until the end, then drops off automatically and stays on the Offers page.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-xl leading-none opacity-50 hover:opacity-90" style={{ color: NAVY }}>✕</button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>
            What to show{placement?.businessName ? ` · booked by ${placement.businessName}` : ""}
          </span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className={INPUT} style={INPUT_STYLE} />
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto rounded-xl p-1.5" style={{ border: `1px solid ${BORDER}` }}>
            {loading && <p className="text-xs p-2" style={{ color: MUTED }}>Loading…</p>}
            {!loading && filtered.length === 0 && <p className="text-xs p-2" style={{ color: MUTED }}>Nothing live to choose from.</p>}
            {filtered.map((o) => {
              const key = `${o.kind}:${o.id}`;
              const active = key === contentKey;
              return (
                <button key={key} type="button" onClick={() => setContentKey(key)}
                  className="flex items-center gap-3 rounded-lg p-2 text-left"
                  style={{ backgroundColor: active ? "rgba(37,99,235,0.08)" : "transparent", border: `1.5px solid ${active ? BLUE : "transparent"}` }}>
                  {o.image
                    ? <img src={o.image} alt="" className="w-10 h-8 rounded object-cover shrink-0" />
                    : <span className="w-10 h-8 rounded shrink-0" style={{ backgroundColor: "rgba(16,24,40,0.06)" }} />}
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate" style={{ color: NAVY }}>{o.title}</span>
                    <span className="block text-[11px] truncate" style={{ color: MUTED }}>{KIND_LABELS[o.kind]} · {o.detail}</span>
                  </span>
                  {active && <span className="text-xs font-bold" style={{ color: BLUE }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: MUTED }}>Starts (UK)</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={INPUT} style={INPUT_STYLE} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold" style={{ color: MUTED }}>Ends (UK)</span>
            <input type="datetime-local" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className={INPUT} style={INPUT_STYLE} />
          </label>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs" style={{ color: MUTED }}>Length:</span>
          {[...new Set([1, 7, 14, 30, slotType.durationDays])].sort((a, b) => a - b).map((d) => (
            <button key={d} type="button" onClick={() => setLength(d)} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ border: `1px solid ${BORDER}`, color: NAVY }}>{d} day{d === 1 ? "" : "s"}</button>
          ))}
        </div>
        {fromLondonInput(start) && fromLondonInput(end) && (
          <PlacementTimer startsAt={fromLondonInput(start)} endsAt={fromLondonInput(end)} compact />
        )}

        {error && <p role="alert" className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>{error}</p>}

        <div className="flex gap-3 pt-1">
          <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
            {saving ? "Saving…" : placement ? "Save changes" : "Add to homepage"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing ────────────────────────────────────────────────────────────────
function PricingCard({ slotType, onSaved, onError }) {
  const [form, setForm] = useState({
    price: slotType.price, durationDays: slotType.durationDays, capacity: slotType.capacity,
    bookable: slotType.bookable, description: slotType.description,
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setForm({ price: slotType.price, durationDays: slotType.durationDays, capacity: slotType.capacity, bookable: slotType.bookable, description: slotType.description });
  }, [slotType]);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await saveSlotType(slotType.key, form);
      onSaved(`${slotType.label} pricing saved.`);
    } catch (e) {
      onError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
      <div>
        <p className="text-sm font-bold" style={{ color: NAVY }}>What businesses pay</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
          A business pays once and gets the next free slot for this length. Changes apply to new bookings only.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>Price (£)</span>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={INPUT} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>Length (days)</span>
          <input type="number" min="1" max="365" value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} className={INPUT} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: MUTED }}>{slotType.perBusinessType ? "Slots per type" : "Slots at once"}</span>
          <input type="number" min="1" max="50" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className={INPUT} style={INPUT_STYLE} />
        </label>
        <label className="flex items-center gap-2 mt-5 cursor-pointer">
          <input type="checkbox" checked={form.bookable} onChange={(e) => set("bookable", e.target.checked)} className="w-4 h-4" />
          <span className="text-sm font-medium" style={{ color: NAVY }}>Businesses can book</span>
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold" style={{ color: MUTED }}>Description shown to businesses</span>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} className={INPUT} style={INPUT_STYLE} />
      </label>
      {Number(form.capacity) < slotType.capacity && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>
          Fewer slots only affects new bookings. Existing bookings in the removed slots stay until they end.
        </p>
      )}
      <div>
        <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
          {saving ? "Saving…" : "Save pricing"}
        </button>
      </div>
    </div>
  );
}

// ─── One booking ────────────────────────────────────────────────────────────
function PlacementRow({ placement: p, onEdit, onEnd, onCancel, onApprove, onReject }) {
  const upcoming = p.phase === "upcoming";
  const ended = p.phase === "ended";
  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4 flex-wrap sm:flex-nowrap"
      style={{ ...CARD, border: p.live ? "1.5px solid rgba(22,163,74,0.4)" : CARD.border, opacity: ended ? 0.7 : 1 }}>
      {p.contentImage
        ? <img src={p.contentImage} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0 hidden sm:block" />
        : <span className="w-20 h-16 rounded-xl shrink-0 hidden sm:flex items-center justify-center text-[10px] font-semibold text-center px-1" style={{ backgroundColor: "rgba(16,24,40,0.05)", color: MUTED }}>No content yet</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold truncate" style={{ color: NAVY }}>
            {p.contentTitle ?? (p.status === "awaiting_content" ? "Waiting for the business to choose" : "No content chosen")}
          </span>
          {p.live && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: "rgba(220,38,38,0.15)", color: "#B91C1C" }}>● Live on home page</span>}
          <StatusChip status={p.status} />
        </div>
        <p className="text-xs" style={{ color: MUTED }}>
          Slot {p.lane}{poolLabel(p.pool) ? ` · ${poolLabel(p.pool)}` : ""}
          {p.contentKind ? ` · ${KIND_LABELS[p.contentKind]}` : ""}
          {p.businessName ? ` · ${p.businessName}` : ""}
          {" · "}
          {p.source === "purchase" ? `Paid${p.amount != null ? ` £${p.amount.toFixed(2)}` : ""}` : "Added by admin"}
        </p>
        {p.rejectionReason && <p className="text-xs mt-1" style={{ color: "#991B1B" }}>Rejected: {p.rejectionReason}</p>}
        <PlacementTimer startsAt={p.startsAt} endsAt={p.endsAt} compact />
      </div>
      {!ended && (
        <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
          {p.status === "pending_approval" && (
            <div className="flex gap-2">
              <button onClick={() => onApprove(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "#16A34A" }}>Approve</button>
              <button onClick={() => onReject(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: "#991B1B", border: "1.5px solid rgba(185,28,28,0.3)" }}>Reject</button>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => onEdit(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: NAVY }}>
              Edit / swap
            </button>
            {upcoming ? (
              <button onClick={() => onCancel(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Cancel</button>
            ) : (
              <button onClick={() => onEnd(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>End now</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function HomepageSlotsPage() {
  const [version, setVersion] = useState(0);
  const [showEnded, setShowEnded] = useState(false);
  const { data: types, loading: loadingTypes } = useFetch(getSlotTypes, [version]);
  const { data: placements, loading } = useFetch(() => getPlacements({ includeEnded: showEnded }), [version, showEnded]);
  const [active, setActive] = useState("spotlight");
  const [dialog, setDialog] = useState(null); // { placement? }
  const [toast, setToast] = useState(null);

  const reload = () => setVersion((v) => v + 1);
  function notify(msg, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4500);
  }
  async function run(action, message) {
    try {
      await action();
      notify(message);
      reload();
    } catch (e) {
      notify(e.message, true);
    }
  }

  // A booking can start or end while the page is open: re-read at that moment.
  useEffect(() => {
    const now = Date.now();
    const next = Math.min(...(placements ?? []).flatMap((p) => [new Date(p.startsAt).getTime(), new Date(p.endsAt).getTime()]).filter((t) => t > now));
    if (!Number.isFinite(next)) return undefined;
    const id = setTimeout(reload, Math.min(next - now + 500, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [placements]);

  const slotType = (types ?? []).find((t) => t.key === active);
  const all = placements ?? [];
  const pending = all.filter((p) => p.status === "pending_approval");
  const forType = all.filter((p) => p.slotType === active)
    .sort((a, b) => (a.phase === "ended") - (b.phase === "ended") || new Date(a.startsAt) - new Date(b.startsAt));

  const liveCounts = useMemo(() => {
    const counts = {};
    for (const p of all) if (p.live) counts[p.slotType] = (counts[p.slotType] ?? 0) + 1;
    return counts;
  }, [all]);

  // Featured Business slots are counted per business type.
  const pools = slotType?.perBusinessType
    ? [...new Set(forType.map((p) => p.pool))].sort()
    : ["all"];

  function handleReject(p) {
    const reason = window.prompt(`Why isn't "${p.contentTitle ?? "this"}" suitable? The business will see this and can choose something else.`);
    if (reason === null) return;
    run(() => rejectPlacement(p, reason.trim()), "Rejected. The business has been told.");
  }
  function handleEnd(p) {
    if (!window.confirm(`Take "${p.contentTitle ?? "this booking"}" off the homepage now?${p.source === "purchase" ? " This business paid for this slot." : ""}`)) return;
    run(() => endPlacement(p.id), "Taken off the homepage.");
  }
  function handleCancel(p) {
    if (!window.confirm(`Cancel this upcoming booking?${p.source === "purchase" ? " This business paid for it — refund it in Stripe if needed." : ""}`)) return;
    run(() => cancelPlacement(p.id), "Booking cancelled. The slot is free again.");
  }

  if (loadingTypes && !types) return <LoadingState />;
  if (!types?.length) {
    return <EmptyState title="Homepage slots aren't set up yet" message="Run supabase/sql/homepage_slot_bookings_2026_09.sql, then reload." />;
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      {dialog && slotType && (
        <PlacementDialog
          slotType={slotType}
          placement={dialog.placement}
          onClose={() => setDialog(null)}
          onSaved={(msg) => { setDialog(null); notify(msg); reload(); }}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Homepage Slots</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Everything on the homepage runs between a start and end time (UK). When a booking ends it leaves the homepage by itself and stays on the Offers page.
        </p>
      </div>

      {/* ── Needs approval (all slot types) ── */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold" style={{ color: "#B91C1C" }}>Needs approval ({pending.length})</p>
          {pending.map((p) => (
            <div key={p.id}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: MUTED }}>
                {types.find((t) => t.key === p.slotType)?.label}
              </p>
              <PlacementRow placement={p}
                onEdit={(x) => { setActive(x.slotType); setDialog({ placement: x }); }}
                onEnd={handleEnd} onCancel={handleCancel}
                onApprove={(x) => run(() => approvePlacement(x), "Approved. It shows on the homepage during its booked time.")}
                onReject={handleReject} />
            </div>
          ))}
        </div>
      )}

      {/* ── Slot type tabs ── */}
      <div className="flex gap-2 flex-wrap" role="tablist">
        {types.map((t) => {
          const on = t.key === active;
          const waiting = all.filter((p) => p.slotType === t.key && p.status === "pending_approval").length;
          return (
            <button key={t.key} role="tab" aria-selected={on} onClick={() => setActive(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={on ? { backgroundColor: NAVY, color: "#fff" } : { backgroundColor: "#fff", color: NAVY, border: `1px solid ${BORDER}` }}>
              {t.label}
              <span className="text-[11px] font-bold opacity-80">
                {liveCounts[t.key] ?? 0}{t.perBusinessType ? "" : `/${t.capacity}`}
              </span>
              {waiting > 0 && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#DC2626" }} aria-label={`${waiting} need approval`} />}
            </button>
          );
        })}
      </div>

      {slotType && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm" style={{ color: MUTED }}>
              {slotType.perBusinessType
                ? `${slotType.capacity} slots for each business type.`
                : `${slotType.capacity} slots on the homepage at once.`}
              {" "}Business bookings: £{slotType.price.toFixed(2)} for {slotType.durationDays} days{slotType.bookable ? "" : " (not bookable)"}.
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer" style={{ color: MUTED }}>
                <input type="checkbox" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} />
                Show ended (60 days)
              </label>
              <button onClick={() => setDialog({})} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: BLUE }}>
                + Add to {slotType.label}
              </button>
            </div>
          </div>

          {loading && !placements ? <LoadingState /> : forType.length === 0 ? (
            <EmptyState title={`Nothing booked in ${slotType.label}`} message={`The homepage ${slotType.label} section is hidden until something is added.`} />
          ) : (
            pools.map((pool) => {
              const rows = forType.filter((p) => p.pool === pool);
              const live = rows.filter((p) => p.live).length;
              return (
                <div key={pool} className="flex flex-col gap-3">
                  {slotType.perBusinessType && (
                    <p className="text-sm font-bold" style={{ color: NAVY }}>
                      {poolLabel(pool) || "Other"} <span className="font-medium" style={{ color: MUTED }}>· {live}/{slotType.capacity} live</span>
                    </p>
                  )}
                  {rows.map((p) => (
                    <PlacementRow key={p.id} placement={p}
                      onEdit={(x) => setDialog({ placement: x })}
                      onEnd={handleEnd} onCancel={handleCancel}
                      onApprove={(x) => run(() => approvePlacement(x), "Approved. It shows on the homepage during its booked time.")}
                      onReject={handleReject} />
                  ))}
                </div>
              );
            })
          )}

          <PricingCard slotType={slotType} onSaved={(m) => { notify(m); reload(); }} onError={(m) => notify(m, true)} />
        </>
      )}
    </div>
  );
}
