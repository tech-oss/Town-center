import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getStandardContent, saveStandardContent, addOffer, deleteOffer } from "../../api/business/content";
import {
  Field, Inp, TextArea, ImageStrip, HoursEditor, SocialEditor,
  SectionTitle, EditorSection, SaveBar, NAVY, BLUE, MUTED, BORDER, CARD, INPUT,
} from "../components/FormKit";

const EMPTY_OFFER = { type: "Offer", title: "", body: "", image: null, expiry: "" };
const SHOWS_OFFERS = new Set(["eat-drink", "see-do", "shop", "services"]);

function OffersEditor({ accountId, offers, onRefresh }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  function setF(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    if (form.id) await deleteOffer(accountId, form.id);
    await addOffer(accountId, form);
    setSaving(false);
    setForm(null);
    onRefresh();
  }
  async function handleDelete(id) {
    setDeletingId(id);
    await deleteOffer(accountId, id);
    setDeletingId(null);
    onRefresh();
  }

  if (form !== null) {
    return (
      <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(37,99,235,0.03)", border: `1px solid rgba(37,99,235,0.15)` }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: NAVY }}>{form.id ? "Edit" : "Add"} News / Offer</p>
          <button onClick={() => setForm(null)} className="text-xs" style={{ color: MUTED }}>✕ Cancel</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Type">
            <select value={form.type} onChange={(e) => setF("type", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}>
              <option>Offer</option><option>News</option>
            </select>
          </Field>
          <Field label="Expiry Date" hint="Leave blank for no expiry">
            <Inp type="date" value={form.expiry ?? ""} onChange={(e) => setF("expiry", e.target.value)} />
          </Field>
          <Field label="Title" required span2>
            <Inp value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="e.g. Happy Hour, New Menu Launch…" />
          </Field>
          <Field label="Description" span2>
            <TextArea rows={3} value={form.body} onChange={(e) => setF("body", e.target.value)} placeholder="Details of the offer or news item…" />
          </Field>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || !form.title?.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ backgroundColor: BLUE }}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: MUTED, border: `1.5px solid #D1D5DB` }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button onClick={() => setForm({ ...EMPTY_OFFER })}
        className="self-start px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
        + Add News / Offer
      </button>
      {offers.length === 0 && <p className="text-xs" style={{ color: MUTED }}>No news or offers yet.</p>}
      {offers.map((o) => (
        <div key={o.id} className="rounded-xl p-4 flex items-start gap-3" style={{ border: `1px solid ${BORDER}`, backgroundColor: "#fafafa" }}>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={o.type === "Offer" ? { backgroundColor: "rgba(37,99,235,0.1)", color: BLUE } : { backgroundColor: "rgba(16,163,74,0.1)", color: "#15803D" }}>
              {o.type}
            </span>
            <p className="text-sm font-semibold mt-1" style={{ color: NAVY }}>{o.title}</p>
            {o.body && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: MUTED }}>{o.body}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setForm({ ...o })} className="text-xs font-semibold" style={{ color: BLUE }}>Edit</button>
            <button onClick={() => handleDelete(o.id)} disabled={deletingId === o.id} className="text-xs font-semibold disabled:opacity-40" style={{ color: "#DC2626" }}>
              {deletingId === o.id ? "…" : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StandardContentEditor({ account }) {
  const [tick, setTick] = useState(0);
  const fetch = useCallback(() => getStandardContent(account.id), [account.id, tick]);
  const { data: saved, loading } = useFetch(fetch, [account.id, tick]);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  if (saved && form === null) setForm(JSON.parse(JSON.stringify(saved)));

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); setDirty(true); }

  async function handleSave() {
    setSaving(true);
    await saveStandardContent(account.id, form);
    setSaving(false);
    setDirty(false);
    setSavedAt(Date.now());
  }

  if (loading || !form) return <p className="text-sm" style={{ color: MUTED }}>Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Page Content">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Short Description (tagline)" span2>
              <Inp value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} placeholder="One-line description shown in listings…" />
            </Field>
            <Field label="About (full description)" span2>
              <TextArea rows={5} value={form.about} onChange={(e) => set("about", e.target.value)} placeholder="Detailed description of your business…" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Header Images">
          <ImageStrip images={form.headerImages ?? []} onChange={(v) => set("headerImages", v)} max={5} />
        </EditorSection>

        <EditorSection title="Find Us">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Address" span2>
              <Inp value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Street, Maidenhead, postcode" />
            </Field>
            <Field label="Phone">
              <Inp value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="01628 555 000" />
            </Field>
            <Field label="Website">
              <Inp value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Opening Hours">
          <HoursEditor hours={form.hours} onChange={(v) => set("hours", v)} />
        </EditorSection>

        <EditorSection title="Social Links">
          <SocialEditor links={form.socialLinks} onChange={(v) => set("socialLinks", v)} />
        </EditorSection>

        <SaveBar onSave={handleSave} saving={saving} dirty={dirty} savedAt={savedAt} />
      </div>

      {SHOWS_OFFERS.has(account.section) && (
        <div className="bg-white rounded-2xl p-6" style={CARD}>
          <SectionTitle title="News & Offers" />
          <OffersEditor accountId={account.id} offers={form.offers ?? []} onRefresh={() => setTick((t) => t + 1)} />
        </div>
      )}
    </div>
  );
}
