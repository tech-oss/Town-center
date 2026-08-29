// Type D — Explore attractions / editorial pages (no News & Offers).
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, GalleryGrid, LocationFields,
  INPUT, CARD,
} from "./shared";

const STATUSES = ["Published", "Draft", "Hidden"];

export default function TypeDEditor({ form, set, onSave, saving }) {
  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
      <EditorSection title="Page Content">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <Field label="Title">
            <Inp value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Subtitle / Tagline">
            <Inp value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <Field label="Body Description" span2 hint="The main editorial content of the Explore page">
            <TextArea rows={6} value={form.body} onChange={(e) => set("body", e.target.value)} />
          </Field>
        </div>
        <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]"
          onChange={(v) => set("heroImage", v)} />
      </EditorSection>

      <EditorSection title="Location">
        <Field label="Address" hint="Optional">
          <Inp value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div className="mt-4">
          <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
        </div>
      </EditorSection>

      <EditorSection title="Gallery" hint="Up to 6 images.">
        <GalleryGrid images={form.gallery} onChange={(v) => set("gallery", v)} max={6} />
      </EditorSection>

      <EditorSection title="Page Status" hint="Determines whether the page is visible on the public Explore section.">
        <select value={form.pageStatus} onChange={(e) => set("pageStatus", e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm outline-none w-48" style={INPUT}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </EditorSection>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  );
}
