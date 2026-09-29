import { useState, useEffect } from "react";
import { uploadImage } from "../../lib/uploadImage";
import { uploadVideo } from "../../lib/uploadVideo";
import { SITE_SECTIONS, withDefaults } from "../../Data/siteSections";
import { GETTING_HERE_DEFAULTS } from "../../Data/adminMissingScreensMock";
import { getSiteContent, saveSiteSection } from "../../api/admin";
import GettingHereEditor from "./siteContent/GettingHereEditor";
import FocalPointPicker from "../components/FocalPointPicker";
import { BLUE, BORDER, CARD, MUTED, NAVY } from "../theme";

// Edits the words and pictures at the top of each public page.
//
// The form is built from Data/siteSections.js, which lists exactly what each
// page renders. That list is the point: the screen used to offer fields for
// pages that no longer exist (Properties) and fields no page ever read, so
// saving appeared to work and changed nothing on the site. Every field here
// is read by the page named beside it.

const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}

function Toast({ message, error }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
      style={{ backgroundColor: error ? "#991B1B" : "#15803D", color: "#fff" }}>
      {error ? "✕" : "✓"} {message}
    </div>
  );
}

function ImageField({ label, hint, value, onChange }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <div className="flex items-center gap-4 flex-wrap">
        {value
          ? <img src={value} alt="" className="w-32 h-20 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
          : <div className="w-32 h-20 rounded-xl flex items-center justify-center text-[10px] text-center px-2"
              style={{ border: `1.5px dashed ${BORDER}`, color: "#9CA3AF" }}>No picture — header shows plain</div>}
        <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            uploadImage(file, "site-content")
              .then((url) => onChange(url))
              .catch((err) => alert(err.message))
              .finally(() => setBusy(false));
          }} />
        </label>
        {value && (
          <button onClick={() => onChange("")} className="text-xs font-semibold" style={{ color: "#991B1B" }}>
            Remove
          </button>
        )}
      </div>
      <FocalPointPicker value={value} onChange={onChange} />
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </div>
  );
}

function VideoField({ label, hint, value, onChange }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      <div className="flex items-center gap-4 flex-wrap">
        {value
          ? <video src={value} muted loop playsInline autoPlay className="w-40 h-24 rounded-xl object-cover bg-black" style={{ border: `1.5px solid ${BORDER}` }} />
          : <div className="w-40 h-24 rounded-xl flex items-center justify-center text-[10px] text-center px-2"
              style={{ border: `1.5px dashed ${BORDER}`, color: "#9CA3AF" }}>Using the built-in video</div>}
        <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: "1.5px solid rgba(37,99,235,0.25)" }}>
          {busy ? "Uploading…" : value ? "Replace" : "Upload video"}
          <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={busy} onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            uploadVideo(file)
              .then((url) => onChange(url))
              .catch((err) => alert(err.message))
              .finally(() => setBusy(false));
          }} />
        </label>
        {value && (
          <button onClick={() => onChange("")} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Remove</button>
        )}
      </div>
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </div>
  );
}

const SMALL_BTN = "text-[11px] font-semibold px-2 py-1 rounded-lg disabled:opacity-30";

// A list of paragraphs: one box each, reorderable.
function ParagraphsField({ label, hint, value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const setAt = (i, v) => onChange(list.map((p, j) => (j === i ? v : p)));
  const move = (i, d) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {list.map((p, i) => (
        <div key={i} className="flex gap-2 items-start">
          <textarea rows={3} className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none resize-y" style={INPUT}
            value={p} onChange={(e) => setAt(i, e.target.value)} />
          <div className="flex flex-col gap-1">
            <button type="button" className={SMALL_BTN} style={{ color: MUTED }} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">▲</button>
            <button type="button" className={SMALL_BTN} style={{ color: MUTED }} disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down">▼</button>
            <button type="button" className={SMALL_BTN} style={{ color: "#991B1B" }} onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove paragraph">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, ""])} className="self-start text-xs font-semibold" style={{ color: BLUE }}>+ Add paragraph</button>
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </div>
  );
}

// Repeating blocks (story sections, feature cards…), each with its own fields.
function BlocksField({ field, value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  const setAt = (i, k, v) => onChange(list.map((b, j) => (j === i ? { ...b, [k]: v } : b)));
  const move = (i, d) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
  const blank = () => Object.fromEntries(field.fields.map((f) => [f.name, f.type === "paragraphs" ? [""] : ""]));
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{field.label}</span>
      {list.map((b, i) => (
        <div key={i} className="rounded-xl p-4 flex flex-col gap-4" style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs font-bold" style={{ color: NAVY }}>{field.itemLabel} {i + 1}</span>
            <button type="button" className={SMALL_BTN} style={{ color: MUTED }} disabled={i === 0} onClick={() => move(i, -1)}>▲ Up</button>
            <button type="button" className={SMALL_BTN} style={{ color: MUTED }} disabled={i === list.length - 1} onClick={() => move(i, 1)}>▼ Down</button>
            <button type="button" className={SMALL_BTN} style={{ color: "#991B1B" }} onClick={() => onChange(list.filter((_, j) => j !== i))}>Remove</button>
          </div>
          {field.fields.map((f) => (
            <FieldControl key={f.name} field={f} value={b?.[f.name]} onChange={(v) => setAt(i, f.name, v)} />
          ))}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, blank()])} className="self-start text-xs font-semibold" style={{ color: BLUE }}>+ Add {field.itemLabel.toLowerCase()}</button>
      {field.hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{field.hint}</span>}
    </div>
  );
}

// One field of any type. `placeholder` is what the page shows today for a
// text box left empty.
function FieldControl({ field: f, value, onChange, placeholder = "" }) {
  if (f.type === "heading") {
    return <p className="text-[11px] font-bold uppercase tracking-wider pt-3 -mb-1" style={{ color: BLUE, borderTop: `1px solid ${BORDER}` }}>{f.label}</p>;
  }
  if (f.type === "image") return <ImageField label={f.label} hint={f.hint} value={value ?? ""} onChange={onChange} />;
  if (f.type === "video") return <VideoField label={f.label} hint={f.hint} value={value ?? ""} onChange={onChange} />;
  if (f.type === "paragraphs") return <ParagraphsField label={f.label} hint={f.hint} value={value} onChange={onChange} />;
  if (f.type === "blocks") return <BlocksField field={f} value={value} onChange={onChange} />;
  return (
    <Field label={f.label} hint={f.hint}>
      {f.type === "textarea" ? (
        <textarea rows={4} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-y" style={INPUT}
          placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}
          placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

const LIST_TYPES = new Set(["paragraphs", "blocks"]);

function SectionEditor({ spec, values, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-5" style={CARD}>
      <div className="pb-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <p className="text-sm font-bold" style={{ color: NAVY }}>{spec.label}</p>
        <p className="text-xs mt-1" style={{ color: MUTED }}>{spec.blurb}</p>
        <a href={spec.page} target="_blank" rel="noopener noreferrer"
          className="text-xs font-semibold mt-1.5 inline-block" style={{ color: BLUE }}>
          View {spec.page} ↗
        </a>
      </div>

      {spec.fields.map((f) => {
        // Text boxes start empty with today's wording as the grey hint; lists
        // start filled with today's paragraphs/blocks so they can be edited
        // in place rather than retyped. Pictures never have a built-in one.
        const saved = values[f.name];
        const value = LIST_TYPES.has(f.type) && !(Array.isArray(saved) && saved.length) ? spec.defaults[f.name]
          : (f.type === "image" || f.type === "video") ? (saved || spec.defaults[f.name] || "")
          : saved;
        const placeholder = typeof spec.defaults[f.name] === "string" && f.type !== "video" ? spec.defaults[f.name] : "";
        return <FieldControl key={f.name} field={f} value={value} placeholder={placeholder} onChange={(v) => onChange(f.name, v)} />;
      })}

      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
        Leave a box empty to go back to the wording built into the page.
      </p>
    </div>
  );
}

// Getting Here is a whole page document rather than a header, so it keeps its
// own editor and its own tab at the end of the list.
const GETTING_HERE_KEY = "getting-here";

export default function SiteContentPage() {
  const [saved, setSaved] = useState({});
  const [edited, setEdited] = useState({});
  const [gettingHere, setGettingHere] = useState(null);
  const [activeKey, setActiveKey] = useState(SITE_SECTIONS[0].key);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSiteContent().then((rows) => {
      if (cancelled) return;
      const byKey = {};
      for (const r of rows) {
        const { key, label, kind, ...content } = r;
        byKey[key] = content;
      }
      setSaved(byKey);
      setGettingHere({ ...GETTING_HERE_DEFAULTS, ...(byKey[GETTING_HERE_KEY] ?? {}) });
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      setToast({ msg: `Could not load site content: ${e.message}`, error: true });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const spec = SITE_SECTIONS.find((s) => s.key === activeKey);
  const isGettingHere = activeKey === GETTING_HERE_KEY;

  // What the boxes show: what admin has saved, plus anything typed since.
  const values = { ...(saved[activeKey] ?? {}), ...(edited[activeKey] ?? {}) };
  const dirty = Object.keys(edited[activeKey] ?? {}).length > 0;

  function set(field, value) {
    setEdited((prev) => ({ ...prev, [activeKey]: { ...(prev[activeKey] ?? {}), [field]: value } }));
  }
  function setGettingHereField(field, value) {
    setGettingHere((prev) => ({ ...prev, [field]: value }));
    setEdited((prev) => ({ ...prev, [GETTING_HERE_KEY]: { ...(prev[GETTING_HERE_KEY] ?? {}), [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (isGettingHere) {
        const { key, label, kind, ...content } = gettingHere;
        await saveSiteSection({ key: GETTING_HERE_KEY, label: "Getting Here", kind: "getting-here", ...content });
        setSaved((prev) => ({ ...prev, [GETTING_HERE_KEY]: content }));
      } else {
        // Blank boxes are stored as blank, which the site reads as "use the
        // page's own wording" (Data/siteSections.js).
        await saveSiteSection({ key: spec.key, label: spec.label, kind: "page", ...values });
        setSaved((prev) => ({ ...prev, [spec.key]: values }));
      }
      setEdited((prev) => ({ ...prev, [activeKey]: {} }));
      setToast({ msg: `${isGettingHere ? "Getting Here" : spec.label} saved — it is live on the site now.` });
    } catch (e) {
      setToast({ msg: `Could not save: ${e.message}`, error: true });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  }

  if (loading) return <p className="text-sm" style={{ color: MUTED }}>Loading site content…</p>;

  const tabs = [...SITE_SECTIONS, { key: GETTING_HERE_KEY, label: "Getting Here" }];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast?.msg} error={toast?.error} />
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Site Content</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          The words, pictures and videos on each public page. Changes show on the website and the
          app straight away.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-56 shrink-0 bg-white rounded-2xl overflow-hidden" style={CARD}>
          {tabs.map((t) => {
            const on = activeKey === t.key;
            const unsaved = Object.keys(edited[t.key] ?? {}).length > 0;
            return (
              <button key={t.key} onClick={() => setActiveKey(t.key)}
                className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors"
                style={{
                  color: on ? BLUE : NAVY,
                  backgroundColor: on ? "rgba(37,99,235,0.08)" : "transparent",
                  fontWeight: on ? 600 : 400,
                  borderBottom: `1px solid ${BORDER}`,
                }}>
                <span className="flex-1">{t.label}</span>
                {unsaved && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#D97706" }} title="Unsaved changes" />}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {isGettingHere ? (
            <GettingHereEditor section={gettingHere} onChange={setGettingHereField} />
          ) : (
            <SectionEditor spec={spec} values={values} onChange={set} />
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: BLUE }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {dirty && <span className="text-xs" style={{ color: "#92400E" }}>You have unsaved changes.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
