import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NEIGHBOURHOOD_GUIDES } from "../../Data/adminMissingScreensMock";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";
const CARD = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
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
function Inp(props) { return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props} />; }
function Section({ title, children }) {
  return (
    <div>
      <p className="text-sm font-bold mb-4 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>{title}</p>
      {children}
    </div>
  );
}
function ToggleField({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-start gap-3">
      <div onClick={() => onChange(!checked)} className="w-10 h-5 rounded-full transition-colors flex items-center px-0.5 shrink-0 mt-0.5 cursor-pointer" style={{ backgroundColor: checked ? BLUE : "#D1D5DB" }}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: NAVY }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{hint}</p>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg" style={{ backgroundColor: "#15803D", color: "#fff" }}>
      ✓ {message}
    </div>
  );
}

const EMPTY = { title: "", area: "", heroImage: null, body: "", showOnHomepage: false, showOnPlatform: true, status: "Draft" };

export default function NeighbourhoodGuideEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? NEIGHBOURHOOD_GUIDES.find((g) => g.id === id) : null;

  const [form, setForm] = useState(() => existing ? { ...existing } : { ...EMPTY });
  const [toast, setToast] = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("heroImage", ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setToast("Guide saved.");
    setTimeout(() => navigate("/admin/neighbourhood-guides"), 900);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl pb-10">
      <Toast message={toast} />
      <button onClick={() => navigate("/admin/neighbourhood-guides")} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Neighbourhood Guides</button>
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{existing ? "Edit Guide" : "New Guide"}</h1>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <Section title="Content">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title">
              <Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Town Centre: Shops, Cafés & Nightlife" />
            </Field>
            <Field label="Area / Tag" hint='e.g. "Town Centre", "Riverside", "Bray"'>
              <Inp value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="Area tag" />
            </Field>
          </div>
        </Section>

        <Section title="Hero Image">
          <div className="flex flex-col gap-2">
            {form.heroImage && <img src={form.heroImage} alt="" className="w-full max-w-md aspect-video object-cover rounded-2xl" style={{ border: `1.5px solid ${BORDER}` }} />}
            <label className="w-fit px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
              {form.heroImage ? "Replace Image" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          </div>
        </Section>

        <Section title="Body Content">
          {/* TODO: replace with TipTap or similar rich text editor on backend integration */}
          <textarea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)}
            placeholder="Write the guide content…" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} />
        </Section>

        <Section title="Visibility">
          <div className="flex flex-col gap-5">
            <ToggleField checked={form.showOnHomepage} onChange={(v) => set("showOnHomepage", v)}
              label="Show on Homepage" hint="When enabled this guide appears as a featured link on the homepage." />
            <ToggleField checked={form.showOnPlatform} onChange={(v) => set("showOnPlatform", v)}
              label="Show on Platform" hint="When disabled the guide is hidden from all platform links but not deleted." />
          </div>
        </Section>

        <Section title="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none w-48" style={INPUT}>
            <option>Published</option><option>Draft</option>
          </select>
        </Section>

        <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BLUE }}>Save</button>
          <button onClick={() => navigate("/admin/neighbourhood-guides")} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
