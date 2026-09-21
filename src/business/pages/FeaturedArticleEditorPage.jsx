import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import {
  Field, Inp, TextArea, SingleImageUpload, Toast, useToast,
  CARD, FOREST, SAGE, MUTED, BORDER,
} from "../components/FormKit";
import { getFeatureArticle, saveFeatureArticle } from "../api/businessFeatureArticles";

const BLANK = {
  title: "", standfirst: "", category: "", heroImage: "", cardImage: "",
  cardHeading: "", cardBody: "", location: "", website: "",
  body: [{ heading: "", text: "", image: "" }],
};

// One section of the article: a heading, the text, and optionally a picture
// that sits beside it — the same shape the public article page renders.
function Section({ index, section, onChange, onRemove, canRemove, pathPrefix }) {
  const set = (k, v) => onChange({ ...section, [k]: v });
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ border: `1.5px solid ${BORDER}` }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Section {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-semibold" style={{ color: "#991B1B" }}>Remove</button>
        )}
      </div>
      <Field label="Heading">
        <Inp value={section.heading} onChange={(e) => set("heading", e.target.value)} placeholder="e.g. A space built for results" />
      </Field>
      <Field label="Text">
        <TextArea rows={5} value={section.text} onChange={(e) => set("text", e.target.value)}
          placeholder="Leave a blank line between paragraphs." />
      </Field>
      <SingleImageUpload label="Picture for this section (optional)" src={section.image}
        onChange={(url) => set("image", url)} pathPrefix={pathPrefix} aspect="aspect-video" ratioLabel="16:9 (Landscape)" />
    </div>
  );
}

export default function FeaturedArticleEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useBusinessAuth();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useToast();

  useEffect(() => {
    if (!id) return;
    getFeatureArticle(id)
      .then((a) => { if (a) setForm({ ...BLANK, ...a, body: a.body?.length ? a.body : BLANK.body }); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSection = (i, next) => setForm((f) => ({ ...f, body: f.body.map((s, j) => (j === i ? next : s)) }));
  const addSection = () => setForm((f) => ({ ...f, body: [...f.body, { heading: "", text: "", image: "" }] }));
  const removeSection = (i) => setForm((f) => ({ ...f, body: f.body.filter((_, j) => j !== i) }));

  async function save(submit) {
    if (!form.title.trim()) { setError("Give the article a title."); return; }
    setSaving(true);
    setError("");
    try {
      await saveFeatureArticle(user.id, form, { submit });
      navigate("/business/featured-articles");
    } catch (e) {
      // The slot limit comes back from the database trigger.
      setError(e.message);
      setToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  const pathPrefix = `${user.id}/featured`;

  if (loading) {
    return <BusinessLayout><p className="text-sm" style={{ color: MUTED }}>Loading…</p></BusinessLayout>;
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-3xl">
        <button onClick={() => navigate("/business/featured-articles")} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>
          ← Featured Articles
        </button>

        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>{id ? "Edit Featured Article" : "Write a Featured Article"}</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            Saving sends it to admin for approval. Once it is live you can edit it whenever you like — an edit goes
            back through approval before the changes show.
          </p>
        </div>

        {/* The article itself */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <p className="text-sm font-bold" style={{ color: FOREST }}>The article</p>
          <Field label="Title" required>
            <Inp value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Twenty years on the High Street" />
          </Field>
          <Field label="Standfirst" hint="The opening paragraph, set larger than the rest.">
            <TextArea rows={3} value={form.standfirst} onChange={(e) => set("standfirst", e.target.value)} />
          </Field>
          <SingleImageUpload label="Hero image" src={form.heroImage} onChange={(url) => set("heroImage", url)}
            pathPrefix={pathPrefix} aspect="aspect-video" ratioLabel="16:9 (Landscape)" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category" hint="Shown as the small label above the title.">
              <Inp value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Food & Drink" />
            </Field>
            <Field label="Your website link" hint="Optional — shown as a button at the end.">
              <Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="yourbusiness.co.uk" />
            </Field>
          </div>
          <Field label="Location" hint="Optional — shown alongside the website link.">
            <Inp value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="123 High Street, Maidenhead" />
          </Field>
        </div>

        {/* Body sections */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold" style={{ color: FOREST }}>Sections</p>
          {form.body.map((s, i) => (
            <Section key={i} index={i} section={s} pathPrefix={pathPrefix}
              onChange={(next) => setSection(i, next)}
              onRemove={() => removeSection(i)}
              canRemove={form.body.length > 1} />
          ))}
          <button type="button" onClick={addSection}
            className="self-start px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff" }}>
            + Add another section
          </button>
        </div>

        {/* How it looks on a card */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-4" style={CARD}>
          <p className="text-sm font-bold" style={{ color: FOREST }}>How it looks in listings</p>
          <p className="text-xs -mt-2" style={{ color: MUTED }}>
            Leave these blank to re-use the title, standfirst and hero image.
          </p>
          <Field label="Card heading">
            <Inp value={form.cardHeading} onChange={(e) => set("cardHeading", e.target.value)} placeholder={form.title || "Same as the title"} />
          </Field>
          <Field label="Card summary">
            <TextArea rows={2} value={form.cardBody} onChange={(e) => set("cardBody", e.target.value)} placeholder="Same as the standfirst" />
          </Field>
          <SingleImageUpload label="Card image" src={form.cardImage} onChange={(url) => set("cardImage", url)}
            pathPrefix={pathPrefix} aspect="aspect-video" ratioLabel="16:9 (Landscape)" />
        </div>

        {error && (
          <p role="alert" className="text-sm rounded-xl px-4 py-3"
            style={{ backgroundColor: "rgba(220,38,38,0.07)", color: "#991B1B" }}>{error}</p>
        )}

        <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button onClick={() => save(true)} disabled={saving || !form.title.trim()}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: SAGE }}>
            {saving ? "Sending…" : "Send for approval"}
          </button>
          <button onClick={() => save(false)} disabled={saving || !form.title.trim()}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ border: `1.5px solid ${BORDER}`, color: FOREST }}>
            Save as draft
          </button>
        </div>
      </div>
    </BusinessLayout>
  );
}
