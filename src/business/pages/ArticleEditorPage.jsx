import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Field, Inp, TextArea, Select, SingleImageUpload, EditorSection, Toast, useToast, FOREST, SAGE, MUTED, BORDER, CARD } from "../components/FormKit";
import { BUSINESS_ARTICLES } from "../../Data/businessPortalMock";

const EMPTY = { title: "", type: "News", heroImage: null, body: "", startDate: "", endDate: "", status: "Draft" };

export default function ArticleEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useBusinessAuth();
  const existing = id ? (BUSINESS_ARTICLES[user.id] ?? []).find((a) => a.id === id) : null;

  const [form, setForm] = useState(() => existing ? { ...existing } : { ...EMPTY });
  const [toast, setToast] = useToast();

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleSave(submit) {
    // TODO: persist to Supabase on backend integration
    if (submit) {
      set("status", "Pending Approval");
      setToast("Article submitted — it will go live once approved by admin.");
    } else {
      set("status", "Draft");
      setToast("Article saved as draft.");
    }
    setTimeout(() => navigate("/business/articles"), 900);
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-3xl pb-10">
        <button onClick={() => navigate("/business/articles")} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>← News & Articles</button>
        <h1 className="text-2xl font-bold" style={{ color: FOREST }}>{existing ? "Edit Article" : "New Article"}</h1>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
          <EditorSection title="Content">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Title" span2><Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Article title…" /></Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option>News</option><option>Offer</option>
                </Select>
              </Field>
              <Field label="Start Date" hint="Optional"><Inp type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} /></Field>
              <Field label="End Date" hint="Leave blank for no expiry"><Inp type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} /></Field>
            </div>
          </EditorSection>

          <EditorSection title="Hero Image">
            <SingleImageUpload src={form.heroImage} onChange={(v) => set("heroImage", v)} aspect="aspect-[16/9]" />
          </EditorSection>

          <EditorSection title="Article content — shown on the article page">
            <TextArea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Write the full article body…" />
          </EditorSection>

          <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button onClick={() => handleSave(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ backgroundColor: "rgba(28,46,56,0.06)", color: FOREST }}>Save as Draft</button>
            <button onClick={() => handleSave(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Submit for Approval</button>
            <button onClick={() => navigate("/business/articles")} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70" style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>Cancel</button>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
