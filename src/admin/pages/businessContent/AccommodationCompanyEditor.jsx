// An accommodation company in admin's content editor: its company profile
// (the MANAGED BY details on every one of its property pages) and its
// properties, which admin can add, edit and put live for the company.
import { useCallback, useEffect, useState } from "react";
import {
  Field, Inp, EditorSection, SaveBar, SingleImageUpload, SocialFields, CARD, BORDER, MUTED, NAVY, BLUE,
} from "./shared";
import {
  getCompanyContent, saveCompanyProfile, createProperty, publishProperty,
  setPropertyHidden, reactivateProperty, deleteProperty,
} from "../../../api/admin/accommodationContent";

const PROPERTY_STATES = {
  draft:    { label: "Draft",            color: "#475569", bg: "rgba(71,85,105,0.10)" },
  pending:  { label: "Pending approval", color: "#B45309", bg: "rgba(217,119,6,0.12)" },
  live:     { label: "Live",             color: "#047857", bg: "rgba(16,185,129,0.12)" },
  rejected: { label: "Rejected",         color: "#B91C1C", bg: "rgba(220,38,38,0.10)" },
  hidden:   { label: "Hidden",           color: "#475569", bg: "rgba(71,85,105,0.10)" },
  inactive: { label: "Inactive",         color: "#6D28D9", bg: "rgba(109,40,217,0.10)" },
};

export function StateChip({ state }) {
  const s = PROPERTY_STATES[state] ?? { label: state, color: "#475569", bg: "rgba(71,85,105,0.10)" };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

const smallBtn = (tone = BLUE) => ({ color: tone, border: `1.5px solid ${tone === BLUE ? "rgba(37,99,235,0.3)" : "rgba(220,38,38,0.3)"}` });

export default function AccommodationCompanyEditor({ companyId, onOpenProperty, onToast }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [newName, setNewName] = useState("");

  const load = useCallback(() => getCompanyContent(companyId)
    .then((d) => { setData(d); setValues(d.profile.values); setError(""); })
    .catch((e) => setError(e.message)), [companyId]);

  useEffect(() => {
    let cancelled = false;
    getCompanyContent(companyId)
      .then((d) => { if (!cancelled) { setData(d); setValues(d.profile.values); setError(""); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [companyId]);

  if (error) return <p className="text-sm" style={{ color: "#991B1B" }}>Couldn't load this company: {error}</p>;
  if (!data || !values) return <p className="text-sm py-10 text-center" style={{ color: MUTED }}>Loading content…</p>;

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  async function saveProfile() {
    setSaving(true);
    try {
      await saveCompanyProfile(companyId, values);
      onToast("Company details published to the live site.");
      await load();
    } catch (e) {
      onToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function act(id, fn, message) {
    setBusyId(id);
    try {
      const result = await fn();
      onToast(message);
      await load();
      return result;
    } catch (e) {
      onToast(e.message);
      return null;
    } finally {
      setBusyId(null);
    }
  }

  async function addProperty() {
    const name = newName.trim();
    if (!name) { onToast("Give the property a name first."); return; }
    const id = await act("new", () => createProperty(companyId, name), "Property added as a draft. Add its details, then put it live.");
    if (id) { setNewName(""); onOpenProperty(id); }
  }

  const { usage, properties } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Company profile */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-6" style={CARD}>
        <EditorSection title="Company profile" hint="The MANAGED BY details shown on every one of this company's property pages.">
          {data.profile.pending && (
            <p className="text-xs px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: "rgba(217,119,6,0.08)", color: "#92400E" }}>
              The company has sent a change to these details that's waiting in Approvals. Saving here publishes what's below and replaces that change.
            </p>
          )}
          {!data.profile.saved && (
            <p className="text-xs px-3 py-2 rounded-lg mb-4" style={{ backgroundColor: "rgba(37,99,235,0.07)", color: "#1E3A8A" }}>
              Not published yet. These are the details from registration. Check them and save to publish them.
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <Field label="Company name" required span2>
              <Inp value={values.name ?? ""} maxLength={120} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Address" span2><Inp value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Postal code"><Inp value={values.postal_code ?? ""} onChange={(e) => set("postal_code", e.target.value)} placeholder="e.g. SL6 1QJ" /></Field>
            <Field label="Phone"><Inp value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Email"><Inp value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
            <Field label="Website URL"><Inp value={values.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
          </div>
          <SingleImageUpload label="Company logo" src={values.logo || null} logo onChange={(v) => set("logo", v)} />
          <p className="text-xs font-semibold mt-5 mb-2" style={{ color: MUTED }}>Social links</p>
          <SocialFields links={values.social ?? {}} onChange={(v) => set("social", v)} />
        </EditorSection>
        <SaveBar onSave={saveProfile} saving={saving} />
      </div>

      {/* Properties */}
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-4" style={CARD}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold text-base" style={{ color: NAVY }}>Properties</h2>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              {usage ? `${usage.used} of ${usage.limit} property ${usage.limit === 1 ? "slot" : "slots"} used on the company's plan. ` : ""}
              Properties you put live here don't need approval.
            </p>
          </div>
        </div>

        {properties.length === 0 && <p className="text-sm" style={{ color: MUTED }}>No properties yet.</p>}
        <div className="flex flex-col gap-2">
          {properties.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 flex-wrap" style={{ border: `1.5px solid ${BORDER}` }}>
              {p.heroImage
                ? <img src={String(p.heroImage).split("#")[0]} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0" />
                : <div className="w-14 h-10 rounded-lg shrink-0" style={{ backgroundColor: "#f1f5f9" }} />}
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold" style={{ color: NAVY }}>{p.name}</span>
                  <StateChip state={p.state} />
                </div>
                <p className="text-xs truncate" style={{ color: MUTED }}>{p.address || "No address yet"}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => onOpenProperty(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={smallBtn()}>Edit content</button>
                {["draft", "rejected", "pending"].includes(p.state) && (
                  <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, () => publishProperty(p.id, p.state), `${p.name} is live.`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>Put live</button>
                )}
                {p.state === "live" && (
                  <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, () => setPropertyHidden(p.id, true), `${p.name} is hidden.`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={smallBtn()}>Hide</button>
                )}
                {p.state === "hidden" && (
                  <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, () => setPropertyHidden(p.id, false), `${p.name} is live again.`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={smallBtn()}>Show</button>
                )}
                {p.state === "inactive" && (
                  <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, () => reactivateProperty(p.id), `${p.name} is live again.`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={smallBtn()}>Reactivate</button>
                )}
                <button type="button" disabled={busyId === p.id}
                  onClick={() => window.confirm(`Delete ${p.name}? This can't be undone.`) && act(p.id, () => deleteProperty(p.id), `${p.name} was deleted.`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={smallBtn("#DC2626")}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-end gap-3 flex-wrap pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <Field label="Add a property">
            <Inp value={newName} maxLength={120} onChange={(e) => setNewName(e.target.value)} placeholder="Property name, e.g. Riverside Cottage"
              onKeyDown={(e) => { if (e.key === "Enter") addProperty(); }} />
          </Field>
          <button type="button" onClick={addProperty} disabled={busyId === "new"}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
            {busyId === "new" ? "Adding…" : "+ Add property"}
          </button>
        </div>
      </div>
    </div>
  );
}
