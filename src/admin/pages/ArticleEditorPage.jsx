import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ARTICLES, ARTICLE_CATEGORIES } from "../../Data/adminMissingScreensMock";
import BusinessTypeahead from "../components/BusinessTypeahead";

const NAVY = "#1E293B", BLUE = "#2563EB", MUTED = "#6B7280", BORDER = "rgba(16,24,40,0.12)";
const CARD = { backgroundColor: "#fff", border: "1px solid #eef1f6", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };
const INPUT = { border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" };

function Field({ label, hint, children, span2 }) {
  return (
    <label className={`flex flex-col gap-1.5${span2 ? " sm:col-span-2" : ""}`}>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {children}
      {hint && <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{hint}</span>}
    </label>
  );
}
function Inp(props) { return <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT} {...props} />; }
function TextArea({ rows = 4, ...props }) { return <textarea rows={rows} className="rounded-xl px-3 py-2.5 text-sm outline-none resize-none" style={INPUT} {...props} />; }
function Section({ title, children }) {
  return (
    <div>
      <p className="text-sm font-bold mb-4 pb-2" style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>{title}</p>
      {children}
    </div>
  );
}

const EMPTY = {
  title: "", category: ARTICLE_CATEGORIES[0], heroImage: null, body: "",
  tags: "", businessId: "", metaTitle: "", metaDescription: "",
};

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg" style={{ backgroundColor: "#15803D", color: "#fff" }}>
      ✓ {message}
    </div>
  );
}

export default function ArticleEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const existing = id ? ARTICLES.find((a) => a.id === id) : null;

  const [form, setForm] = useState(() => existing
    ? { ...existing, tags: (existing.tags ?? []).join(", "), businessId: existing.businessId ?? "" }
    : { ...EMPTY });
  const [seoOpen, setSeoOpen] = useState(false);
  const [toast, setToast] = useState(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("heroImage", ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleSave(status) {
    // Mock save — persists locally only.
    setToast(`Article ${status === "Draft" ? "saved as draft" : status === "Hidden" ? "hidden" : "published"}.`);
    setTimeout(() => navigate("/admin/articles"), 900);
  }

  const chips = form.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="flex flex-col gap-6 max-w-3xl pb-10">
      <Toast message={toast} />
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/articles")} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>← Articles & Guides</button>
      </div>
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{existing ? "Edit Article" : "New Article"}</h1>

      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <Section title="Content">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title" span2>
              <Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Article title…" />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}>
                {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Business Attribution" span2 hint="Optional — assign this article to a specific business">
              <BusinessTypeahead value={form.businessId} onChange={(v) => set("businessId", v)} />
            </Field>
          </div>
        </Section>

        <Section title="Hero Image">
          <div className="flex flex-col gap-2">
            {form.heroImage && (
              <img src={form.heroImage} alt="" className="w-full max-w-md aspect-video object-cover rounded-2xl" style={{ border: `1.5px solid ${BORDER}` }} />
            )}
            <label className="w-fit px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE, border: `1.5px solid rgba(37,99,235,0.25)` }}>
              {form.heroImage ? "Replace Image" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          </div>
        </Section>

        <Section title="Body content — will be rendered as formatted text on the public page">
          {/* TODO: replace with TipTap or similar rich text editor on backend integration */}
          <TextArea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Write the full article body…" />
        </Section>

        <Section title="Tags / Keywords">
          <Inp value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="comma, separated, tags" />
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {chips.map((t) => (
                <span key={t} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: BLUE }}>{t}</span>
              ))}
            </div>
          )}
        </Section>

        <div>
          <button onClick={() => setSeoOpen((o) => !o)} className="text-sm font-bold flex items-center gap-2" style={{ color: NAVY }}>
            SEO Fields <span style={{ transform: seoOpen ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>›</span>
          </button>
          {seoOpen && (
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Field label="Meta Title">
                <Inp value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} />
              </Field>
              <Field label="Meta Description">
                <Inp value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => handleSave("Draft")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: "rgba(16,24,40,0.07)", color: NAVY }}>Save as Draft</button>
          <button onClick={() => handleSave("Published")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: BLUE }}>Publish</button>
          <button onClick={() => handleSave("Hidden")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: "rgba(217,119,6,0.1)", color: "#92400E" }}>Hide</button>
          <button onClick={() => navigate("/admin/articles")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
