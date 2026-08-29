import { useState } from "react";
import { SITE_CONTENT_SECTIONS } from "../../Data/adminMissingScreensMock";

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
function TextArea({ rows = 4, ...props }) { return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} {...props} />; }

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg" style={{ backgroundColor: "#15803D", color: "#fff" }}>
      ✓ {message}
    </div>
  );
}

function HomepageEditor({ section, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
      <div>
        <p className="text-sm font-bold mb-1 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>Hero Video</p>
        <p className="text-[11px] mb-3 mt-3" style={{ color: "#9CA3AF" }}>
          This video plays as the full-width background on the homepage hero. Recommended: MP4, max 50MB.
        </p>
        {/* TODO: upload to Supabase storage bucket */}
        <div className="rounded-xl p-4 flex items-center gap-3 flex-wrap" style={{ border: `1.5px dashed ${BORDER}`, backgroundColor: "#f8fafc" }}>
          <span className="text-xl">🎬</span>
          <span className="text-sm font-medium flex-1 min-w-[160px]" style={{ color: NAVY }}>{section.heroVideoName}</span>
          <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
            Replace Video
            <input type="file" accept="video/mp4" className="hidden" onChange={(e) => e.target.files?.[0] && onChange("heroVideoName", e.target.files[0].name)} />
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Hero Headline">
          <Inp value={section.heroHeadline} onChange={(e) => onChange("heroHeadline", e.target.value)} />
        </Field>
        <Field label="Hero Tagline">
          <Inp value={section.heroTagline} onChange={(e) => onChange("heroTagline", e.target.value)} />
        </Field>
        <Field label="Hero Subtitle" hint="The descriptive paragraph below the headline">
          <TextArea rows={3} value={section.heroSubtitle} onChange={(e) => onChange("heroSubtitle", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function ListingEditor({ section, onChange }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
      <div>
        <p className="text-sm font-bold mb-3 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>Header Image</p>
        {/* TODO: upload to Supabase storage bucket */}
        <div className="flex items-center gap-4 flex-wrap">
          <img src={section.headerImage} alt="" className="w-32 h-20 rounded-xl object-cover" style={{ border: `1.5px solid ${BORDER}` }} />
          <label className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
            style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
            Replace Image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => onChange("headerImage", ev.target.result);
              reader.readAsDataURL(file);
            }} />
          </label>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Page Headline" hint="Large text overlaid on the header image">
          <Inp value={section.headline} onChange={(e) => onChange("headline", e.target.value)} />
        </Field>
        <Field label="Page Subtitle / Tagline">
          <Inp value={section.subtitle} onChange={(e) => onChange("subtitle", e.target.value)} />
        </Field>
        <Field label="Intro Paragraph" hint="Descriptive text shown below the hero on the listing page">
          <TextArea rows={4} value={section.intro} onChange={(e) => onChange("intro", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export default function SiteContentPage() {
  const [sections, setSections] = useState(SITE_CONTENT_SECTIONS);
  const [activeKey, setActiveKey] = useState(sections[0].key);
  const [toast, setToast] = useState(null);

  const active = sections.find((s) => s.key === activeKey);

  function set(field, value) {
    setSections((prev) => prev.map((s) => (s.key === activeKey ? { ...s, [field]: value } : s)));
  }

  function handleSave() {
    setToast(`${active.label} content saved.`);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Toast message={toast} />
      <div>
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Site Content</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Edit the hero images, headlines and taglines shown at the top of every page on the public site.</p>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-56 shrink-0 bg-white rounded-2xl overflow-hidden" style={CARD}>
          {sections.map((s) => (
            <button key={s.key} onClick={() => setActiveKey(s.key)}
              className="w-full text-left px-4 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeKey === s.key ? BLUE : NAVY,
                backgroundColor: activeKey === s.key ? "rgba(37,99,235,0.08)" : "transparent",
                fontWeight: activeKey === s.key ? 600 : 400,
                borderBottom: `1px solid ${BORDER}`,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {active.kind === "homepage" ? (
            <HomepageEditor section={active} onChange={set} />
          ) : (
            <ListingEditor section={active} onChange={set} />
          )}
          <div>
            <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BLUE }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
