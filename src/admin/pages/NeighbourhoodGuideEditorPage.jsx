import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getGuideById, saveGuide } from "../../api/admin";
import LoadingState from "../components/LoadingState";
import Toast from "../components/Toast";
import { BLUE, BORDER, MUTED, NAVY } from "../theme";
import { Card, Field, ImageField, Inp, Paragraphs, RepeatList, TextArea } from "./explore/contentKit";

// Content and media editor for one neighbourhood guide — the public
// /guides/:slug page. Layout is fixed: the hero, the alternating place
// sections, the "Try it for" cards and the optional panels all keep their
// treatment, and each section's `id` stays read-only because it is the page
// anchor. This only changes the words and pictures.
//
// Everything nested lives in the row's `content` jsonb; slug, title, hero and
// card images, and status stay real columns since the listing needs them.

// The categories the guides listing shows and the app filters on. A guide
// saved with anything else would sit in a category of its own.
const GUIDE_CATEGORIES = ["Food & Drink", "Things to Do", "Family", "History & Heritage", "Shopping", "Outdoors & Nature", "Nightlife"];

const BLANK_CONTENT = {
  icon: "", category: "", summary: "",
  intro: [], sections: [],
  moreSpots: null, cheatSheet: null, combinations: null, closing: null,
};

// The optional panels are absent on some guides (Norden Farm has no moreSpots
// or combinations), so each is added and removed as a whole rather than
// always rendering an empty one.
function OptionalPanel({ title, hint, value, onChange, blank, children }) {
  return (
    <Card
      title={title}
      hint={hint}
      action={value
        ? <button type="button" onClick={() => onChange(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: "1.5px solid rgba(185,28,28,0.3)", color: "#991B1B" }}>Remove section</button>
        : <button type="button" onClick={() => onChange(blank())} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>+ Add section</button>}
    >
      {value
        ? children
        : <p className="text-xs" style={{ color: "#9CA3AF" }}>Not shown on this guide.</p>}
    </Card>
  );
}

export default function NeighbourhoodGuideEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id || id === "new") {
      setForm({ title: "", slug: "", heroImage: "", thumbnail: "", status: "Draft", content: { ...BLANK_CONTENT } });
      setLoading(false);
      return;
    }
    getGuideById(id).then((g) => {
      if (cancelled) return;
      setForm(g ? { ...g, content: { ...BLANK_CONTENT, ...(g.content ?? {}) } } : null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setContent(field, value) { setForm((f) => ({ ...f, content: { ...f.content, [field]: value } })); }
  function setIn(field, patch) {
    setForm((f) => ({ ...f, content: { ...f.content, [field]: { ...(f.content[field] ?? {}), ...patch } } }));
  }

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function handleSave() {
    if (!form.title?.trim()) { flash("A title is required."); return; }
    setSaving(true);
    try {
      await saveGuide({ ...form, id: id && id !== "new" ? id : undefined });
      flash("Guide saved.");
      setTimeout(() => navigate("/admin/neighbourhood-guides"), 800);
    } catch (e) {
      flash(`Could not save: ${e.message}`);
    }
    setSaving(false);
  }

  if (loading) return <LoadingState />;
  if (!form) return <p className="text-sm" style={{ color: MUTED }}>Guide not found.</p>;

  const c = form.content;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Toast message={toast} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <button onClick={() => navigate("/admin/neighbourhood-guides")} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: NAVY }}>
          ← Neighbourhood Guides
        </button>
        {form.slug && (
          <a href={`/guides/${form.slug}`} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ border: `1.5px solid ${BORDER}`, color: NAVY }}>
            View live page →
          </a>
        )}
      </div>

      <Card title="Guide" hint="How the guide appears in the listing grid and at the top of its own page.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title"><Inp value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Slug" hint="The web address: /guides/…">
            <Inp value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from the title" />
          </Field>
          <Field label="Category" hint="Shown as the eyebrow above the title, and used by the app's filters">
            <select value={c.category ?? ""} onChange={(e) => setContent("category", e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
              style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}>
              <option value="" disabled>Select a category…</option>
              {GUIDE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              {c.category && !GUIDE_CATEGORIES.includes(c.category) && <option value={c.category}>{c.category} (current)</option>}
            </select>
          </Field>
          <Field label="Icon" hint="A single emoji used by the app">
            <Inp value={c.icon ?? ""} onChange={(e) => setContent("icon", e.target.value)} />
          </Field>
        </div>
        <Field label="Summary" hint="The line on the listing card and under the hero">
          <TextArea rows={3} value={c.summary ?? ""} onChange={(e) => setContent("summary", e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <ImageField label="Hero image" value={form.heroImage} onChange={(v) => set("heroImage", v)} />
          <ImageField label="Card image" value={form.thumbnail} onChange={(v) => set("thumbnail", v)} hint="Used in the guides grid and related-guide cards" />
        </div>
        <Field label="Status" hint="Only Published guides appear on the site">
          <select value={form.status ?? "Draft"} onChange={(e) => set("status", e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none w-full"
            style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }}>
            <option>Published</option><option>Draft</option><option>Hidden</option>
          </select>
        </Field>
      </Card>

      <Card title="Introduction" hint="The paragraphs that open the guide. The first is set larger.">
        <Paragraphs label="Intro" value={c.intro} onChange={(v) => setContent("intro", v)} rows={6} />
      </Card>

      <Card title="Places" hint="The main run of the guide. Each place alternates image left/right — that ordering is the layout, so it follows this list.">
        <RepeatList
          items={c.sections}
          onChange={(v) => setContent("sections", v)}
          blank={() => ({ id: `place-${Date.now()}`, icon: "", eyebrow: "", title: "", location: "", address: "", phone: "", image: "", body: [], tryItFor: "" })}
          addLabel="+ Add place"
          itemLabel="Place"
          renderItem={(s, update) => (
            <>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Anchor: #{s.id}</p>
              <div className="grid sm:grid-cols-[80px_1fr_1fr] gap-3">
                <Field label="Icon"><Inp value={s.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} /></Field>
                <Field label="Eyebrow"><Inp value={s.eyebrow ?? ""} onChange={(e) => update({ eyebrow: e.target.value })} /></Field>
                <Field label="Name"><Inp value={s.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></Field>
              </div>
              <Paragraphs label="Body" value={s.body} onChange={(v) => update({ body: v })} rows={4} />
              <Field label="Try it for" hint="The highlighted line in the sand-coloured card">
                <Inp value={s.tryItFor ?? ""} onChange={(e) => update({ tryItFor: e.target.value })} />
              </Field>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Location" hint="Short label under the name"><Inp value={s.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></Field>
                <Field label="Address" hint="Optional"><Inp value={s.address ?? ""} onChange={(e) => update({ address: e.target.value })} /></Field>
                <Field label="Phone" hint="Optional"><Inp value={s.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} /></Field>
              </div>
              <ImageField label="Image" value={s.image} onChange={(v) => update({ image: v })} />
            </>
          )}
        />
      </Card>

      <OptionalPanel
        title="More spots"
        hint="The short round-up list after the main places."
        value={c.moreSpots}
        onChange={(v) => setContent("moreSpots", v)}
        blank={() => ({ heading: "", intro: "", items: [] })}
      >
        {c.moreSpots && (
          <>
            <Field label="Heading"><Inp value={c.moreSpots.heading ?? ""} onChange={(e) => setIn("moreSpots", { heading: e.target.value })} /></Field>
            <Field label="Intro"><TextArea rows={2} value={c.moreSpots.intro ?? ""} onChange={(e) => setIn("moreSpots", { intro: e.target.value })} /></Field>
            <RepeatList
              items={c.moreSpots.items}
              onChange={(v) => setIn("moreSpots", { items: v })}
              blank={() => ({ title: "", location: "", body: "" })}
              addLabel="+ Add spot"
              itemLabel="Spot"
              renderItem={(it, update) => (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Name"><Inp value={it.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></Field>
                    <Field label="Location"><Inp value={it.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></Field>
                  </div>
                  <Field label="Body"><TextArea rows={2} value={it.body ?? ""} onChange={(e) => update({ body: e.target.value })} /></Field>
                </>
              )}
            />
          </>
        )}
      </OptionalPanel>

      <OptionalPanel
        title="Cheat sheet"
        hint="The quick question-and-answer list."
        value={c.cheatSheet}
        onChange={(v) => setContent("cheatSheet", v)}
        blank={() => ({ heading: "", intro: "", items: [] })}
      >
        {c.cheatSheet && (
          <>
            <Field label="Heading"><Inp value={c.cheatSheet.heading ?? ""} onChange={(e) => setIn("cheatSheet", { heading: e.target.value })} /></Field>
            <Field label="Intro"><TextArea rows={2} value={c.cheatSheet.intro ?? ""} onChange={(e) => setIn("cheatSheet", { intro: e.target.value })} /></Field>
            <RepeatList
              items={c.cheatSheet.items}
              onChange={(v) => setIn("cheatSheet", { items: v })}
              blank={() => ({ icon: "", label: "", answer: "" })}
              addLabel="+ Add line"
              itemLabel="Line"
              renderItem={(it, update) => (
                <div className="grid sm:grid-cols-[80px_1fr_2fr] gap-3">
                  <Field label="Icon"><Inp value={it.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} /></Field>
                  <Field label="Label"><Inp value={it.label ?? ""} onChange={(e) => update({ label: e.target.value })} /></Field>
                  <Field label="Answer"><Inp value={it.answer ?? ""} onChange={(e) => update({ answer: e.target.value })} /></Field>
                </div>
              )}
            />
          </>
        )}
      </OptionalPanel>

      <OptionalPanel
        title="Combinations"
        hint='The "Make a Morning of It" suggestions.'
        value={c.combinations}
        onChange={(v) => setContent("combinations", v)}
        blank={() => ({ heading: "", intro: "", items: [] })}
      >
        {c.combinations && (
          <>
            <Field label="Heading"><Inp value={c.combinations.heading ?? ""} onChange={(e) => setIn("combinations", { heading: e.target.value })} /></Field>
            <Field label="Intro"><TextArea rows={2} value={c.combinations.intro ?? ""} onChange={(e) => setIn("combinations", { intro: e.target.value })} /></Field>
            <RepeatList
              items={c.combinations.items}
              onChange={(v) => setIn("combinations", { items: v })}
              blank={() => ({ icon: "", title: "", body: "" })}
              addLabel="+ Add combination"
              itemLabel="Combination"
              renderItem={(it, update) => (
                <>
                  <div className="grid sm:grid-cols-[80px_1fr] gap-3">
                    <Field label="Icon"><Inp value={it.icon ?? ""} onChange={(e) => update({ icon: e.target.value })} /></Field>
                    <Field label="Title"><Inp value={it.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></Field>
                  </div>
                  <Field label="Body"><TextArea rows={2} value={it.body ?? ""} onChange={(e) => update({ body: e.target.value })} /></Field>
                </>
              )}
            />
          </>
        )}
      </OptionalPanel>

      <OptionalPanel
        title="Closing"
        hint="The panel at the foot of the guide. It reuses the hero image as its background."
        value={c.closing}
        onChange={(v) => setContent("closing", v)}
        blank={() => ({ heading: "", body: [] })}
      >
        {c.closing && (
          <>
            <Field label="Heading"><Inp value={c.closing.heading ?? ""} onChange={(e) => setIn("closing", { heading: e.target.value })} /></Field>
            <Paragraphs label="Body" value={c.closing.body} onChange={(v) => setIn("closing", { body: v })} rows={4} />
          </>
        )}
      </OptionalPanel>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: BLUE }}>
          {saving ? "Saving…" : "Save Guide"}
        </button>
        <button onClick={() => navigate("/admin/neighbourhood-guides")}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ color: MUTED, border: "1.5px solid #D1D5DB" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
