import { useState, useCallback } from "react";
import useFetch from "../../hooks/useFetch";
import { getBusinesses, SUBCATEGORIES } from "../../api/admin";
import {
  getBusinessContent, saveBusinessContent,
  getStandalonePages, saveStandalonePage, deleteStandalonePage,
  addOffer, deleteOffer,
} from "../../api/admin";
import LoadingState from "../components/LoadingState";
import StatusTag from "../components/StatusTag";

// ─── Theme ────────────────────────────────────────────────────────────────────
const NAVY   = "#1E293B";
const BLUE   = "#2563EB";
const MUTED  = "#64748B";
const BORDER = "rgba(16,24,40,0.12)";
const CARD   = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
const INPUT  = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

const CATEGORY_TABS = [
  { key: "see-do",    label: "See & Do" },
  { key: "eat-drink", label: "Eat & Drink" },
  { key: "shop",      label: "Shop" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function subcatLabels(biz) {
  const all = Object.values(SUBCATEGORIES).flat();
  return (biz.subcategories ?? []).map(v => all.find(o => o.value === v)?.label ?? v);
}

// ─── Shared components ────────────────────────────────────────────────────────
function Field({ label, required, span2, children, hint }) {
  return (
    <label className={`flex flex-col gap-1.5${span2 ? " sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: "#DC2626" }}> *</span>}
      </span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

function Inp({ ...props }) {
  return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props} />;
}

function TextArea({ rows = 3, ...props }) {
  return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} {...props} />;
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer w-fit">
      <div onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5"
        style={{ backgroundColor: checked ? BLUE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
      {label && <span className="text-sm" style={{ color: NAVY }}>{label}</span>}
    </label>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3">
      <h3 className="text-sm font-bold" style={{ color: NAVY }}>{title}</h3>
      {action}
    </div>
  );
}

function SaveBar({ onSave, onCancel, saving, dirty }) {
  return (
    <div className="flex gap-3 pt-4 mt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onSave} disabled={saving || !dirty}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
        style={{ backgroundColor: BLUE }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
      <button onClick={onCancel}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: MUTED, border: `1.5px solid #D1D5DB` }}>
        Cancel
      </button>
    </div>
  );
}

// ─── Opening hours editor ─────────────────────────────────────────────────────
function HoursEditor({ hours, onChange }) {
  function setDay(i, key, val) {
    const next = hours.map((h, idx) => idx === i ? { ...h, [key]: val } : h);
    onChange(next);
  }
  return (
    <div className="flex flex-col gap-2">
      {hours.map((h, i) => (
        <div key={h.day} className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium w-24 shrink-0" style={{ color: NAVY }}>{h.day}</span>
          <Toggle checked={h.open} onChange={v => setDay(i, "open", v)} />
          {h.open ? (
            <>
              <input type="time" value={h.from} onChange={e => setDay(i, "from", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
              <span className="text-xs" style={{ color: MUTED }}>to</span>
              <input type="time" value={h.to} onChange={e => setDay(i, "to", e.target.value)}
                className="rounded-lg px-2 py-1.5 text-xs outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
            </>
          ) : (
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Social links editor ──────────────────────────────────────────────────────
function SocialEditor({ links, onChange }) {
  function set(k, v) { onChange({ ...links, [k]: v }); }
  const fields = [
    { key: "instagram",  label: "Instagram",  prefix: "@" },
    { key: "facebook",   label: "Facebook",   prefix: "fb.com/" },
    { key: "twitter",    label: "X / Twitter",prefix: "@" },
    { key: "tripadvisor",label: "TripAdvisor",prefix: "tripadvisor.com/" },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {fields.map(({ key, label, prefix }) => (
        <Field key={key} label={label}>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1.5px solid ${BORDER}` }}>
            <span className="px-3 py-2.5 text-xs shrink-0" style={{ backgroundColor: "#f8fafc", color: MUTED, borderRight: `1px solid ${BORDER}` }}>{prefix}</span>
            <input value={links?.[key] ?? ""} onChange={e => set(key, e.target.value)}
              placeholder={`${label} handle`}
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-white" style={{ color: NAVY }} />
          </div>
        </Field>
      ))}
    </div>
  );
}

// ─── Image upload strip ───────────────────────────────────────────────────────
function ImageStrip({ images, onChange, label = "Header Images", max = 5 }) {
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange([...images, { src: ev.target.result, name: file.name }]);
    reader.readAsDataURL(file);
  }
  function remove(i) { onChange(images.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{label}</p>
      <div className="flex flex-wrap gap-3 items-start">
        {images.map((img, i) => (
          <div key={i} className="relative group">
            <img src={img.src} alt={img.name} className="w-24 h-16 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
            <button onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "#DC2626" }}>✕</button>
          </div>
        ))}
        {images.length < max && (
          <label className="w-24 h-16 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:bg-blue-50"
            style={{ border: `1.5px dashed ${BORDER}`, backgroundColor: "#f8fafc" }}>
            <span className="text-xl" style={{ color: MUTED }}>+</span>
            <span className="text-[10px]" style={{ color: MUTED }}>Add image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        )}
      </div>
      <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>PNG, JPG · max {max} images</p>
    </div>
  );
}

// ─── Offers / News editor (Eat & Drink) ──────────────────────────────────────
const EMPTY_OFFER = { type: "Offer", title: "", body: "", image: null, expiry: "" };

function OffersEditor({ bizId, offers, onRefresh }) {
  const [form, setForm]     = useState(null); // null = list view, {} = new, {id,...} = edit
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    if (form.id) {
      // Inline update via saveStandalonePage is for pages; for offers we delete+add
      await deleteOffer(bizId, form.id);
    }
    await addOffer(bizId, form);
    setSaving(false);
    setForm(null);
    onRefresh();
  }

  async function handleDelete(id) {
    setDeletingId(id);
    await deleteOffer(bizId, id);
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
            <select value={form.type} onChange={e => setF("type", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}>
              <option>Offer</option>
              <option>News</option>
            </select>
          </Field>
          <Field label="Expiry Date" hint="Leave blank for no expiry">
            <Inp type="date" value={form.expiry ?? ""} onChange={e => setF("expiry", e.target.value)} />
          </Field>
          <Field label="Title" required span2>
            <Inp value={form.title} onChange={e => setF("title", e.target.value)} placeholder="e.g. Happy Hour, New Menu Launch…" />
          </Field>
          <Field label="Description" span2>
            <TextArea rows={3} value={form.body} onChange={e => setF("body", e.target.value)} placeholder="Details of the offer or news item…" />
          </Field>
          <Field label="Image (optional)" span2>
            <div className="flex items-center gap-4 mt-1">
              {form.image && (
                <div className="relative group shrink-0">
                  <img src={form.image} alt="offer" className="w-24 h-16 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
                  <button type="button" onClick={() => setF("image", null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "#DC2626" }}>✕</button>
                </div>
              )}
              <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
                {form.image ? "Change Image" : "Upload Image"}
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setF("image", ev.target.result);
                  reader.readAsDataURL(file);
                }} />
              </label>
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>PNG, JPG · recommended 800×400px</span>
            </div>
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
      {offers.length === 0 && (
        <p className="text-xs" style={{ color: MUTED }}>No news or offers yet.</p>
      )}
      {offers.map(o => (
        <div key={o.id} className="rounded-xl p-4 flex items-start gap-3" style={{ border: `1px solid ${BORDER}`, backgroundColor: "#fafafa" }}>
          {o.image && (
            <img src={o.image} alt={o.title} className="w-20 h-14 rounded-lg object-cover shrink-0" style={{ border: `1px solid ${BORDER}` }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={o.type === "Offer"
                  ? { backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }
                  : { backgroundColor: "rgba(16,163,74,0.1)", color: "#15803D" }}>
                {o.type}
              </span>
            </div>
            <p className="text-sm font-semibold" style={{ color: NAVY }}>{o.title}</p>
            {o.body && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: MUTED }}>{o.body}</p>}
            {o.expiry && <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>Expires {o.expiry}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setForm({ ...o })} className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: BLUE }}>Edit</button>
            <button onClick={() => handleDelete(o.id)} disabled={deletingId === o.id}
              className="text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40" style={{ color: "#DC2626" }}>
              {deletingId === o.id ? "…" : "Delete"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Eat & Drink content editor ───────────────────────────────────────────────
function EatDrinkEditor({ biz, onBack }) {
  const [tick, setTick] = useState(0);
  const fetch = useCallback(() => getBusinessContent(biz.id), [biz.id, tick]);
  const { data: saved, loading } = useFetch(fetch, [biz.id, tick]);

  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  // Initialise form when data loads
  if (saved && form === null) {
    setForm(JSON.parse(JSON.stringify(saved)));
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setDirty(true); }

  async function handleSave() {
    setSaving(true);
    await saveBusinessContent(biz.id, form);
    setSaving(false);
    setDirty(false);
  }

  if (loading || !form) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Back</button>
        <span className="text-sm" style={{ color: MUTED }}>/</span>
        <span className="text-sm font-bold" style={{ color: NAVY }}>{biz.name}</span>
        <StatusTag status={biz.status} />
      </div>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>

        {/* Basic info */}
        <EditorSection title="Page Content">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Short Description (tagline)" span2>
              <Inp value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="One-line description shown in listings…" />
            </Field>
            <Field label="About (full description)" span2>
              <TextArea rows={5} value={form.about} onChange={e => set("about", e.target.value)} placeholder="Detailed description of the business…" />
            </Field>
          </div>
        </EditorSection>

        {/* Header images */}
        <EditorSection title="Header Images">
          <ImageStrip images={form.headerImages ?? []} onChange={v => set("headerImages", v)} max={5} />
        </EditorSection>

        {/* Opening hours */}
        <EditorSection title="Opening Hours">
          <HoursEditor hours={form.hours} onChange={v => set("hours", v)} />
        </EditorSection>

        {/* Social links */}
        <EditorSection title="Social Links">
          <SocialEditor links={form.socialLinks} onChange={v => set("socialLinks", v)} />
        </EditorSection>

        <SaveBar onSave={handleSave} onCancel={onBack} saving={saving} dirty={dirty} />
      </div>

      {/* News & Offers — separate section, doesn't use the same save */}
      <div className="bg-white rounded-2xl p-6" style={CARD}>
        <h3 className="text-sm font-bold mb-4" style={{ color: NAVY }}>News & Offers</h3>
        <OffersEditor bizId={biz.id} offers={form.offers ?? []} onRefresh={() => setTick(t => t + 1)} />
      </div>
    </div>
  );
}

// ─── See & Do content editor (business) ──────────────────────────────────────
function SeeDoBusinessEditor({ biz, onBack }) {
  const [tick, setTick]   = useState(0);
  const fetch = useCallback(() => getBusinessContent(biz.id), [biz.id, tick]);
  const { data: saved, loading } = useFetch(fetch, [biz.id, tick]);

  const [form, setForm]   = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  if (saved && form === null) {
    setForm(JSON.parse(JSON.stringify(saved)));
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setDirty(true); }

  async function handleSave() {
    setSaving(true);
    await saveBusinessContent(biz.id, form);
    setSaving(false);
    setDirty(false);
  }

  if (loading || !form) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Back</button>
        <span className="text-sm" style={{ color: MUTED }}>/</span>
        <span className="text-sm font-bold" style={{ color: NAVY }}>{biz.name}</span>
        <StatusTag status={biz.status} />
      </div>
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Page Content">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Short Description" span2>
              <Inp value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="Brief one-line summary…" />
            </Field>
            <Field label="About / Full Description" span2>
              <TextArea rows={5} value={form.about} onChange={e => set("about", e.target.value)} placeholder="Full details about this venue or activity…" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Header Images">
          <ImageStrip images={form.headerImages ?? []} onChange={v => set("headerImages", v)} max={5} />
        </EditorSection>

        <EditorSection title="Opening Hours / Schedule">
          <HoursEditor hours={form.hours} onChange={v => set("hours", v)} />
        </EditorSection>

        <EditorSection title="Social Links">
          <SocialEditor links={form.socialLinks} onChange={v => set("socialLinks", v)} />
        </EditorSection>

        <SaveBar onSave={handleSave} onCancel={onBack} saving={saving} dirty={dirty} />
      </div>
    </div>
  );
}

// ─── Shop content editor ──────────────────────────────────────────────────────
function ShopEditor({ biz, onBack }) {
  const fetch = useCallback(() => getBusinessContent(biz.id), [biz.id]);
  const { data: saved, loading } = useFetch(fetch, [biz.id]);

  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  if (saved && form === null) {
    setForm(JSON.parse(JSON.stringify(saved)));
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setDirty(true); }

  async function handleSave() {
    setSaving(true);
    await saveBusinessContent(biz.id, form);
    setSaving(false);
    setDirty(false);
  }

  if (loading || !form) return <LoadingState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Back</button>
        <span className="text-sm" style={{ color: MUTED }}>/</span>
        <span className="text-sm font-bold" style={{ color: NAVY }}>{biz.name}</span>
        <StatusTag status={biz.status} />
      </div>
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Page Content">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Short Description" span2>
              <Inp value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="Brief one-line summary…" />
            </Field>
            <Field label="About / Full Description" span2>
              <TextArea rows={5} value={form.about} onChange={e => set("about", e.target.value)} placeholder="Full description of the shop or service…" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Header Images">
          <ImageStrip images={form.headerImages ?? []} onChange={v => set("headerImages", v)} max={5} />
        </EditorSection>

        <EditorSection title="Opening Hours">
          <HoursEditor hours={form.hours} onChange={v => set("hours", v)} />
        </EditorSection>

        <EditorSection title="Social Links">
          <SocialEditor links={form.socialLinks} onChange={v => set("socialLinks", v)} />
        </EditorSection>

        <SaveBar onSave={handleSave} onCancel={onBack} saving={saving} dirty={dirty} />
      </div>
    </div>
  );
}

function EditorSection({ title, children }) {
  return (
    <div>
      <p className="text-sm font-bold mb-4 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>{title}</p>
      {children}
    </div>
  );
}

// ─── Standalone page editor (See & Do only) ───────────────────────────────────
const EMPTY_PAGE = {
  title: "", slug: "", description: "",
  date: "", time: "", endDate: "", endTime: "",
  venue: "", ticketInfo: "", images: [], listOnCalendar: false,
  linkedBizId: null, tags: [],
};

function StandalonePageEditor({ page, onBack, onSaved }) {
  const [form, setForm]     = useState(page ? JSON.parse(JSON.stringify(page)) : { ...EMPTY_PAGE });
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "title" && !f.id) next.slug = v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return next;
    });
  }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    await saveStandalonePage(form);
    setSaving(false);
    onSaved();
  }

  const SEE_DO_TAGS = ["art-culture","community","family","fashion-beauty","film","gaming","learning","sport-wellness"];
  const TAG_LABELS  = { "art-culture": "Art & Culture", community: "Community", family: "Family", "fashion-beauty": "Fashion & Beauty", film: "Film", gaming: "Gaming", learning: "Learning", "sport-wellness": "Sport & Wellness" };

  function toggleTag(t) {
    set("tags", form.tags.includes(t) ? form.tags.filter(x => x !== t) : [...form.tags, t]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Back</button>
        <span className="text-sm" style={{ color: MUTED }}>/</span>
        <span className="text-sm font-bold" style={{ color: NAVY }}>{form.id ? form.title : "New Page / Event"}</span>
      </div>
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>

        <EditorSection title="Page Details">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title" required span2>
              <Inp value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Duck Derby Fun Day" />
            </Field>
            <Field label="URL Slug" hint="Auto-generated from title">
              <Inp value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="duck-derby-fun-day" />
            </Field>
            <Field label="Sub-categories / Tags">
              <div className="flex flex-wrap gap-2 mt-1">
                {SEE_DO_TAGS.map(t => (
                  <button key={t} type="button" onClick={() => toggleTag(t)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={form.tags.includes(t)
                      ? { backgroundColor: BLUE, color: "#fff", border: `1.5px solid ${BLUE}` }
                      : { backgroundColor: "#f8fafc", color: MUTED, border: `1.5px solid ${BORDER}` }}>
                    {TAG_LABELS[t]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Description" span2>
              <TextArea rows={5} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Full description shown on the page…" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Date & Time">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start Date">
              <Inp type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </Field>
            <Field label="Start Time">
              <Inp type="time" value={form.time} onChange={e => set("time", e.target.value)} />
            </Field>
            <Field label="End Date">
              <Inp type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </Field>
            <Field label="End Time">
              <Inp type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} />
            </Field>
          </div>
          <div className="mt-4">
            <Toggle checked={form.listOnCalendar} onChange={v => set("listOnCalendar", v)} label="List on Events Calendar" />
          </div>
        </EditorSection>

        <EditorSection title="Location & Access">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Venue / Location" span2>
              <Inp value={form.venue} onChange={e => set("venue", e.target.value)} placeholder="e.g. Ray Mill Island, Maidenhead SL6 8NB" />
            </Field>
            <Field label="Ticket / Pricing Info" span2>
              <Inp value={form.ticketInfo} onChange={e => set("ticketInfo", e.target.value)} placeholder="e.g. Free entry · Book in advance · £5 per person" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection title="Images">
          <ImageStrip images={form.images ?? []} onChange={v => set("images", v)} max={8} label="Page Images" />
        </EditorSection>

        <SaveBar onSave={handleSave} onCancel={onBack} saving={saving} dirty={true} />
      </div>
    </div>
  );
}

// ─── Business list card ───────────────────────────────────────────────────────
function BizCard({ biz, onManage }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4" style={CARD}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>
        {biz.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: NAVY }}>{biz.name}</span>
          <StatusTag status={biz.status} />
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>
          {subcatLabels(biz).join(" · ") || "No sub-categories"}
        </p>
      </div>
      <button onClick={() => onManage(biz)}
        className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
        Manage Content
      </button>
    </div>
  );
}

// ─── Standalone pages list card ───────────────────────────────────────────────
function PageCard({ page, onEdit, onDelete, deletingId }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4" style={CARD}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(251,191,36,0.12)", fontSize: 18 }}>🎪</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: NAVY }}>{page.title}</span>
          {page.listOnCalendar && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: BLUE }}>On Calendar</span>
          )}
        </div>
        {page.date && <p className="text-xs mt-0.5" style={{ color: MUTED }}>📅 {page.date}{page.time ? ` at ${page.time}` : ""}</p>}
        {page.venue && <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>📍 {page.venue}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onEdit(page)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
          Edit
        </button>
        <button onClick={() => onDelete(page.id)} disabled={deletingId === page.id}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ color: "#991B1B", border: `1.5px solid rgba(185,28,28,0.3)` }}>
          {deletingId === page.id ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ─── See & Do tab ─────────────────────────────────────────────────────────────
function SeeDoTab({ businesses }) {
  const [view, setView]     = useState("list"); // "list" | "biz" | "page" | "newPage"
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [tick, setTick]     = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const { data: pages, loading: pagesLoading } = useFetch(getStandalonePages, [tick]);

  async function handleDeletePage(id) {
    setDeletingId(id);
    await deleteStandalonePage(id);
    setDeletingId(null);
    setTick(t => t + 1);
  }

  if (view === "biz" && selectedBiz) {
    return <SeeDoBusinessEditor biz={selectedBiz} onBack={() => setView("list")} />;
  }
  if (view === "page" && selectedPage) {
    return <StandalonePageEditor page={selectedPage} onBack={() => setView("list")} onSaved={() => { setTick(t => t + 1); setView("list"); }} />;
  }
  if (view === "newPage") {
    return <StandalonePageEditor page={null} onBack={() => setView("list")} onSaved={() => { setTick(t => t + 1); setView("list"); }} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Businesses under See & Do */}
      <div>
        <SectionTitle title="Businesses" />
        {businesses.length === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>No businesses registered under See & Do.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {businesses.map(b => (
              <BizCard key={b.id} biz={b} onManage={biz => { setSelectedBiz(biz); setView("biz"); }} />
            ))}
          </div>
        )}
      </div>

      {/* Standalone pages/events */}
      <div>
        <SectionTitle
          title="Standalone Pages & Events"
          action={
            <button onClick={() => setView("newPage")}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: BLUE, color: "#fff" }}>
              + New Page / Event
            </button>
          }
        />
        {pagesLoading ? <LoadingState /> : pages?.length === 0 ? (
          <p className="text-sm" style={{ color: MUTED }}>No standalone pages yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pages?.map(p => (
              <PageCard key={p.id} page={p} deletingId={deletingId}
                onEdit={page => { setSelectedPage(page); setView("page"); }}
                onDelete={handleDeletePage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Generic business-list tab (Eat & Drink, Shop) ───────────────────────────
function BizListTab({ businesses, EditorComponent }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <EditorComponent biz={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {businesses.length === 0 ? (
        <p className="text-sm" style={{ color: MUTED }}>No businesses registered under this category.</p>
      ) : (
        businesses.map(b => (
          <BizCard key={b.id} biz={b} onManage={setSelected} />
        ))
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ListingsPage() {
  const [activeTab, setActiveTab] = useState("see-do");
  const { data: allBusinesses, loading } = useFetch(getBusinesses, []);

  const bySection = (section) => (allBusinesses ?? []).filter(b => b.section === section && b.status === "Approved");

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Manage Business Content</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Manage the public-facing page content for each business and standalone event pages.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: BORDER }}>
        {CATEGORY_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              color: activeTab === tab.key ? BLUE : MUTED,
              borderBottom: activeTab === tab.key ? `2px solid ${BLUE}` : "2px solid transparent",
              marginBottom: -1,
            }}>
            {tab.label}
            <span className="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: activeTab === tab.key ? "rgba(37,99,235,0.1)" : "rgba(16,24,40,0.07)", color: activeTab === tab.key ? BLUE : MUTED }}>
              {loading ? "…" : bySection(tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : (
        <>
          {activeTab === "see-do"    && <SeeDoTab businesses={bySection("see-do")} />}
          {activeTab === "eat-drink" && <BizListTab businesses={bySection("eat-drink")} EditorComponent={EatDrinkEditor} />}
          {activeTab === "shop"      && <BizListTab businesses={bySection("shop")}      EditorComponent={ShopEditor} />}
        </>
      )}
    </div>
  );
}
