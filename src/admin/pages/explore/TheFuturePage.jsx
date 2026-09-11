import { useState, useEffect } from "react";
import { getSiteContent, saveSiteSection } from "../../../api/admin";
import LoadingState from "../../components/LoadingState";
import Toast from "../../components/Toast";
import { BLUE, MUTED, NAVY } from "../../theme";
import { Card, Field, ImageField, Inp, Paragraphs, RepeatList, TextArea } from "./contentKit";

// Content and media editor for Explore → The Future (/explore/the-future) and
// the mobile Future screen, both of which read the same site_content row.
//
// Content only: the hero treatment, the stats band, the alternating feature
// blocks and the numbered masterplan key all keep their layout. Each feature's
// `id` is the page anchor, so it's shown read-only.

const KEY = "the-future";

export default function TheFuturePage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSiteContent().then((rows) => {
      if (cancelled) return;
      const row = rows.find((r) => r.key === KEY);
      const { key, label, kind, ...rest } = row ?? {};
      setContent(row ? rest : {});
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function set(field, value) { setContent((c) => ({ ...c, [field]: value })); }
  function setIn(field, patch) { setContent((c) => ({ ...c, [field]: { ...(c[field] ?? {}), ...patch } })); }

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveSiteSection({ key: KEY, label: "The Future", kind: KEY, ...content });
      flash("The Future page saved.");
    } catch (e) {
      flash(`Could not save: ${e.message}`);
    }
    setSaving(false);
  }

  if (loading) return <LoadingState />;
  if (!content) return <p className="text-sm" style={{ color: MUTED }}>Could not load the page content.</p>;

  const masterplan = content.masterplan ?? {};
  const community = content.community ?? {};
  const closing = content.closing ?? {};

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <Toast message={toast} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>The Future</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>
            The copy and images on the public Explore → The Future page. Layout is fixed — this changes what it says and shows.
          </p>
        </div>
        <a href="/explore/the-future" target="_blank" rel="noopener noreferrer"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70 shrink-0"
          style={{ border: "1.5px solid rgba(16,24,40,0.2)", color: NAVY }}>
          View live page →
        </a>
      </div>

      <Card title="Hero" hint="The full-width banner at the top of the page.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow"><Inp value={content.hero?.eyebrow ?? ""} onChange={(e) => setIn("hero", { eyebrow: e.target.value })} /></Field>
          <Field label="Title"><Inp value={content.hero?.title ?? ""} onChange={(e) => setIn("hero", { title: e.target.value })} /></Field>
        </div>
        <Field label="Subtitle"><Inp value={content.hero?.subtitle ?? ""} onChange={(e) => setIn("hero", { subtitle: e.target.value })} /></Field>
        <Field label="Lead paragraph"><TextArea rows={2} value={content.hero?.lead ?? ""} onChange={(e) => setIn("hero", { lead: e.target.value })} /></Field>
        <ImageField label="Hero image" value={content.hero?.image} onChange={(v) => setIn("hero", { image: v })} />
      </Card>

      <Card title="The Vision" hint="The opening statement under the hero.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow"><Inp value={content.visionEyebrow ?? ""} onChange={(e) => set("visionEyebrow", e.target.value)} /></Field>
          <Field label="Heading"><Inp value={content.visionHeading ?? ""} onChange={(e) => set("visionHeading", e.target.value)} /></Field>
        </div>
        <Paragraphs label="Body" value={content.vision} onChange={(v) => set("vision", v)} />
      </Card>

      <Card title="Stats band" hint="The figures on the dark band.">
        <RepeatList
          items={content.stats}
          onChange={(v) => set("stats", v)}
          blank={() => ({ value: "", label: "" })}
          addLabel="+ Add stat"
          itemLabel="Stat"
          renderItem={(s, update) => (
            <div className="grid sm:grid-cols-[1fr_2fr] gap-3">
              <Field label="Value"><Inp value={s.value ?? ""} onChange={(e) => update({ value: e.target.value })} /></Field>
              <Field label="Label"><Inp value={s.label ?? ""} onChange={(e) => update({ label: e.target.value })} /></Field>
            </div>
          )}
        />
      </Card>

      <Card title="Feature blocks" hint="The alternating image-and-text sections. Their order decides which side each image sits on.">
        <RepeatList
          items={content.features}
          onChange={(v) => set("features", v)}
          blank={() => ({ id: `feature-${Date.now()}`, eyebrow: "", heading: "", image: "", body: [] })}
          addLabel="+ Add feature"
          itemLabel="Feature"
          renderItem={(f, update) => (
            <>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Anchor: #{f.id}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Eyebrow"><Inp value={f.eyebrow ?? ""} onChange={(e) => update({ eyebrow: e.target.value })} /></Field>
                <Field label="Heading"><Inp value={f.heading ?? ""} onChange={(e) => update({ heading: e.target.value })} /></Field>
              </div>
              <Paragraphs label="Body" value={f.body} onChange={(v) => update({ body: v })} rows={4} />
              <ImageField label="Image" value={f.image} onChange={(v) => update({ image: v })} />
            </>
          )}
        />
      </Card>

      <Card title="Masterplan" hint="The map and its numbered key.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eyebrow"><Inp value={masterplan.eyebrow ?? ""} onChange={(e) => setIn("masterplan", { eyebrow: e.target.value })} /></Field>
          <Field label="Heading"><Inp value={masterplan.heading ?? ""} onChange={(e) => setIn("masterplan", { heading: e.target.value })} /></Field>
        </div>
        <Field label="Intro"><TextArea rows={3} value={masterplan.body ?? ""} onChange={(e) => setIn("masterplan", { body: e.target.value })} /></Field>
        <ImageField label="Masterplan image" value={masterplan.image} onChange={(v) => setIn("masterplan", { image: v })} />
        <p className="text-xs font-semibold pt-2" style={{ color: MUTED }}>Numbered locations</p>
        <RepeatList
          items={masterplan.locations}
          onChange={(v) => setIn("masterplan", { locations: v })}
          blank={() => ({ number: (masterplan.locations?.length ?? 0) + 1, title: "", tagline: "", body: "" })}
          addLabel="+ Add location"
          itemLabel="Location"
          renderItem={(loc, update) => (
            <>
              <div className="grid sm:grid-cols-[100px_1fr] gap-3">
                <Field label="Number"><Inp type="number" value={loc.number ?? ""} onChange={(e) => update({ number: Number(e.target.value) })} /></Field>
                <Field label="Title"><Inp value={loc.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></Field>
              </div>
              <Field label="Tagline" hint="Optional — shown in italics under the title">
                <Inp value={loc.tagline ?? ""} onChange={(e) => update({ tagline: e.target.value })} />
              </Field>
              <Field label="Body"><TextArea rows={2} value={loc.body ?? ""} onChange={(e) => update({ body: e.target.value })} /></Field>
            </>
          )}
        />
      </Card>

      <Card title="Shaped by the Community">
        <Field label="Eyebrow"><Inp value={content.communityEyebrow ?? ""} onChange={(e) => set("communityEyebrow", e.target.value)} /></Field>
        <Field label="Heading"><Inp value={community.heading ?? ""} onChange={(e) => setIn("community", { heading: e.target.value })} /></Field>
        <Field label="Body"><TextArea rows={4} value={community.body ?? ""} onChange={(e) => setIn("community", { body: e.target.value })} /></Field>
      </Card>

      <Card title="Closing section" hint="The dark panel at the foot of the page.">
        <Field label="Heading"><Inp value={closing.heading ?? ""} onChange={(e) => setIn("closing", { heading: e.target.value })} /></Field>
        <Paragraphs label="Body" value={closing.body} onChange={(v) => setIn("closing", { body: v })} rows={5} />
        <ImageField label="Background image" value={closing.image} onChange={(v) => setIn("closing", { image: v })} />
      </Card>

      <div>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: BLUE }}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
