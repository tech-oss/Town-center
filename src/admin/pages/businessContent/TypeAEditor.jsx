// Type A — See & Do / Eat & Drink / Shop (shared public page layout).
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, GalleryGrid, HoursEditor, SocialFields, LocationFields,
  CARD,
} from "./shared";

export default function TypeAEditor({ form, set, onSave, saving }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Profile">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Business Name" hint={`${(form.name ?? "").length}/60`}>
              <Inp value={form.name ?? ""} maxLength={60} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Tagline" hint={`Shown on listing cards · ${(form.tagline ?? "").length}/80`}>
              <Inp value={form.tagline ?? ""} maxLength={80} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
          </div>
          <Field label="Description" hint={`The full about section on the business page · ${(form.description ?? "").length}/600`}>
            <TextArea rows={5} value={form.description ?? ""} maxLength={600} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-8 mt-4">
            <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]" onChange={(v) => set("heroImage", v)} />
          </div>
        </EditorSection>

        <EditorSection title="Opening Hours & Find Us">
          <div className="mb-6"><HoursEditor hours={form.hours} onChange={(v) => set("hours", v)} /></div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Address" span2>
              <Inp value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Phone" hint="Renders as a clickable tel: link on the public page">
              <Inp value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email" hint="Renders as a clickable mailto: link">
              <Inp value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Website URL">
              <Inp value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Booking URL" hint='Powers the "Book a Reservation" button'>
              <Inp value={form.bookingUrl ?? ""} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          <p className="text-xs font-semibold mb-2 pt-4" style={{ borderTop: "1px solid rgba(16,24,40,0.1)" }}>Social Links</p>
          <SocialFields links={form.social ?? {}} onChange={(v) => set("social", v)} />
        </EditorSection>

        <EditorSection title="Image Gallery" hint="Gallery images (up to 6) — these appear in the photo gallery section on the business page.">
          <GalleryGrid images={form.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} />
        </EditorSection>

        <EditorSection title="Location Pin">
          <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
        </EditorSection>

        <SaveBar onSave={onSave} saving={saving} />
      </div>
    </div>
  );
}
