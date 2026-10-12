import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Field, Inp, Toast, useToast, CARD, BORDER, MUTED, FOREST, SAGE } from "../components/FormKit";
import {
  listProperties, getSlotUsage, getCompanyProfile, listTiers,
  createProperty, submitProperty, setPropertyHidden, reactivateProperty, replaceProperty, deleteProperty,
  readableError,
} from "../api/accommodation";
import { PROPERTY_STATES, STATE_ORDER, tierLabel } from "../../Data/accommodation";
import StateChip from "../components/PropertyStateChip";

// My Properties — every property the accommodation company manages, its
// status, and what can be done with it next. Every action goes through a
// database function that checks permissions and the plan's slot limit, so
// this page never decides on its own whether something is allowed.

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(15,23,42,0.55)" }}
      role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4" style={CARD} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold" style={{ color: FOREST }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ModalButtons({ onCancel, onConfirm, confirmLabel, danger, disabled, busy }) {
  return (
    <div className="flex gap-3 justify-end">
      <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
      <button type="button" onClick={onConfirm} disabled={disabled || busy}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: danger ? "#DC2626" : SAGE }}>
        {busy ? "Working…" : confirmLabel}
      </button>
    </div>
  );
}

function SlotMeter({ usage, user, tiers }) {
  if (!usage) return null;
  const pct = Math.min(100, Math.round((usage.used / Math.max(1, usage.limit)) * 100));
  const full = usage.used >= usage.limit;
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold" style={{ color: FOREST }}>{usage.used} of {usage.limit} property {usage.limit === 1 ? "slot" : "slots"} used</p>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            {tierLabel(user, tiers)} · Live, pending and rejected properties use a slot. Drafts, hidden and inactive ones don't.
          </p>
        </div>
        {user.role !== "Content Manager" && (
          <Link to="/business/upgrade" className="text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: SAGE }}>
            {user.plan === "premium" ? "Change plan" : "Upgrade for more properties"}
          </Link>
        )}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF2F1" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: full ? "#D97706" : SAGE }} />
      </div>
    </div>
  );
}

function CompanyCard({ profile }) {
  const live = profile?.live ?? {};
  const shown = profile?.pending ?? live;
  const status = profile?.status;
  return (
    <div className="bg-white rounded-2xl p-5 flex items-center gap-4 flex-wrap" style={CARD}>
      <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center overflow-hidden" style={{ border: `1px solid ${BORDER}`, backgroundColor: "#F8FAFC" }}>
        {shown.logo ? <img src={shown.logo} alt="" className="w-full h-full object-contain" /> : <span className="text-xl" aria-hidden>🏢</span>}
      </div>
      <div className="flex-1 min-w-[200px]">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Managed by</p>
        <p className="text-sm font-bold" style={{ color: FOREST }}>{shown.name || "Your company details aren't set up yet"}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
          {!profile?.exists && "Add the company name, logo and contact details shown on every property page."}
          {status === "Pending Approval" && "Your company details are waiting for Maidenhead admin approval."}
          {status === "Changes Rejected" && <span style={{ color: "#B91C1C" }}>Changes not approved: {profile.rejectionReason}</span>}
          {status === "Up to Date" && "Shown on every one of your property pages."}
        </p>
      </div>
      <Link to="/business/company" className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ color: FOREST, border: `1.5px solid ${BORDER}` }}>
        {profile?.exists ? "Edit company profile" : "Set up company profile"}
      </Link>
    </div>
  );
}

function PropertyCard({ p, onAction, busy }) {
  const btn = "text-xs font-semibold px-3 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40";
  const outline = { color: FOREST, border: `1.5px solid ${BORDER}` };
  const primary = { color: "#fff", backgroundColor: SAGE };
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col" style={CARD}>
      <div className="aspect-[16/9] relative" style={{ backgroundColor: "#EEF2F6" }}>
        {p.heroImage
          ? <img src={p.heroImage.split("#")[0]} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          : <span className="absolute inset-0 flex items-center justify-center text-3xl" aria-hidden>🏠</span>}
        <span className="absolute top-2 left-2"><StateChip state={p.state} /></span>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-sm font-bold" style={{ color: FOREST }}>{p.name}</p>
        <p className="text-xs" style={{ color: MUTED }}>{p.address || "No address yet"}</p>
        {p.state === "rejected" && p.rejectionReason && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#991B1B" }}>
            <strong>Reason:</strong> {p.rejectionReason}
          </p>
        )}
        <p className="text-[11px]" style={{ color: MUTED }}>{PROPERTY_STATES[p.state]?.help}</p>
        <div className="flex gap-2 flex-wrap mt-auto pt-2">
          <Link to={`/business/properties/${p.id}`} className={btn} style={p.state === "draft" || p.state === "rejected" ? outline : primary}>
            {p.state === "rejected" ? "Correct details" : "Edit"}
          </Link>
          {(p.state === "draft" || p.state === "rejected") && (
            <button type="button" disabled={busy} onClick={() => onAction("submit", p)} className={btn} style={primary}>Submit for approval</button>
          )}
          {p.state === "live" && <button type="button" disabled={busy} onClick={() => onAction("hide", p)} className={btn} style={outline}>Hide</button>}
          {p.state === "hidden" && <button type="button" disabled={busy} onClick={() => onAction("unhide", p)} className={btn} style={primary}>Show again</button>}
          {p.state === "inactive" && <button type="button" disabled={busy} onClick={() => onAction("reactivate", p)} className={btn} style={primary}>Reactivate</button>}
          {p.state !== "draft" && <button type="button" disabled={busy} onClick={() => onAction("replace", p)} className={btn} style={outline}>Replace</button>}
          <button type="button" disabled={busy} onClick={() => onAction("delete", p)} className={btn} style={{ color: "#B91C1C", border: "1.5px solid rgba(220,38,38,0.3)" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// Everything the page shows, fetched together. Errors come back as data so
// the page can still show what it has.
async function fetchPage(companyId) {
  try {
    const [list, slots, prof, tierList] = await Promise.all([
      listProperties(companyId), getSlotUsage(companyId), getCompanyProfile(companyId), listTiers(),
    ]);
    return { list, slots, prof, tierList };
  } catch (e) {
    return { error: readableError(e).message };
  }
}

export default function MyPropertiesPage() {
  const { user } = useBusinessAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState(null);
  const [usage, setUsage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useToast();
  const [limitHit, setLimitHit] = useState("");
  const [modal, setModal] = useState(null); // { type: "add" | "replace" | "delete", property? }
  const [text, setText] = useState("");

  const apply = useCallback(({ list, slots, prof, tierList, error }) => {
    if (error) { setLoadError(error); setProperties((p) => p ?? []); return; }
    setProperties(list);
    setUsage(slots);
    setProfile(prof);
    setTiers(tierList);
    setLoadError("");
  }, []);
  const load = useCallback(() => fetchPage(user.id).then(apply), [user.id, apply]);

  useEffect(() => {
    let cancelled = false;
    fetchPage(user.id).then((data) => { if (!cancelled) apply(data); });
    return () => { cancelled = true; };
  }, [user.id, apply]);

  async function run(fn, success) {
    setBusy(true);
    setLimitHit("");
    try {
      const result = await fn();
      if (success) setToast(success);
      await load();
      return result;
    } catch (e) {
      const err = readableError(e);
      if (err.limit) setLimitHit(err.message);
      else setToast(err.message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  function onAction(type, p) {
    if (type === "submit") return run(() => submitProperty(p.id), `${p.name} sent to Maidenhead admin for approval.`);
    if (type === "hide") return run(() => setPropertyHidden(p.id, true), `${p.name} is hidden and its slot is free.`);
    if (type === "unhide") return run(() => setPropertyHidden(p.id, false), `${p.name} is live again.`);
    if (type === "reactivate") return run(() => reactivateProperty(p.id), `${p.name} is live again.`);
    setText("");
    setModal({ type, property: p });
  }

  async function confirmModal() {
    const { type, property } = modal;
    if (type === "add") {
      const id = await run(() => createProperty(user.id, text.trim()));
      if (id) navigate(`/business/properties/${id}`);
    } else if (type === "replace") {
      const id = await run(() => replaceProperty(property.id, text.trim()), `${property.name} has been taken down. Add the new property's details, then submit it.`);
      if (id) navigate(`/business/properties/${id}`);
    } else if (type === "delete") {
      await run(() => deleteProperty(property.id), `${property.name} was deleted.`);
    }
    setModal(null);
  }

  const sorted = [...(properties ?? [])].sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>My Properties</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>Each property has its own public page, map pin, photos, reviews and statistics. Every new property is approved by Maidenhead admin before it appears.</p>
          </div>
          <button type="button" onClick={() => { setText(""); setModal({ type: "add" }); }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>
            + Add a property
          </button>
        </div>

        {loadError && (
          <p className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#991B1B" }}>Couldn't load your properties: {loadError}</p>
        )}

        {limitHit && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap text-sm" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>
            <span className="flex-1 min-w-[220px]">{limitHit}</span>
            {user.role !== "Content Manager"
              ? <Link to="/business/upgrade" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: SAGE }}>See plans</Link>
              : <span className="text-xs font-semibold">Ask the business owner to upgrade the plan.</span>}
          </div>
        )}

        <CompanyCard profile={profile} />
        <SlotMeter usage={usage} user={user} tiers={tiers} />

        {properties === null ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading your properties…</p>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center flex flex-col items-center gap-3" style={CARD}>
            <span className="text-3xl" aria-hidden>🏡</span>
            <p className="text-base font-bold" style={{ color: FOREST }}>Add your first property</p>
            <p className="text-sm max-w-md" style={{ color: MUTED }}>Give it a name, add its address and details, then submit it. It appears on Maidenhead.com and The Maidenhead App once approved.</p>
            <button type="button" onClick={() => { setText(""); setModal({ type: "add" }); }}
              className="mt-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: SAGE }}>+ Add a property</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((p) => <PropertyCard key={p.id} p={p} onAction={onAction} busy={busy} />)}
          </div>
        )}
      </div>

      {modal?.type === "add" && (
        <Modal title="Add a property" onClose={() => setModal(null)}>
          <Field label="Property name" hint={`${text.length}/120`}>
            <Inp value={text} maxLength={120} autoFocus onChange={(e) => setText(e.target.value)} placeholder="e.g. Riverside Apartment" />
          </Field>
          <p className="text-xs" style={{ color: MUTED }}>It's saved as a draft. Nothing is public until you submit it and Maidenhead admin approves it.</p>
          <ModalButtons onCancel={() => setModal(null)} onConfirm={confirmModal} confirmLabel="Create draft" disabled={!text.trim()} busy={busy} />
        </Modal>
      )}

      {modal?.type === "replace" && (
        <Modal title={`Replace ${modal.property.name}`} onClose={() => setModal(null)}>
          <p className="text-sm" style={{ color: "#334155" }}>
            <strong>{modal.property.name}</strong> will be taken off the site straight away. A new draft property takes its place and keeps the same slot.
            The slot shows nothing until the new property is approved.
          </p>
          <Field label="New property name">
            <Inp value={text} maxLength={120} autoFocus onChange={(e) => setText(e.target.value)} placeholder="e.g. Riverside Apartment 2" />
          </Field>
          <ModalButtons onCancel={() => setModal(null)} onConfirm={confirmModal} confirmLabel="Replace property" danger disabled={!text.trim()} busy={busy} />
        </Modal>
      )}

      {modal?.type === "delete" && (
        <Modal title={`Delete ${modal.property.name}?`} onClose={() => setModal(null)}>
          <p className="text-sm" style={{ color: "#334155" }}>
            This permanently removes the property, its page, photos, reviews, FAQs and statistics, and frees its plan slot. It can't be undone.
            To take it off the site for a while instead, use <strong>Hide</strong>.
          </p>
          <Field label={`Type the property name to confirm`}>
            <Inp value={text} autoFocus onChange={(e) => setText(e.target.value)} placeholder={modal.property.name} />
          </Field>
          <ModalButtons onCancel={() => setModal(null)} onConfirm={confirmModal} confirmLabel="Delete property" danger
            disabled={text.trim().toLowerCase() !== modal.property.name.trim().toLowerCase()} busy={busy} />
        </Modal>
      )}
    </BusinessLayout>
  );
}
