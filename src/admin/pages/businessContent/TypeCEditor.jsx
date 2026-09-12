// Type C — Hotel & Accommodation.
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, GalleryGrid, SocialFields, LocationFields, RepeatableList,
  CARD, BORDER, Locked,
} from "./shared";

export default function TypeCEditor({ form, set, onSave, saving }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Listing Card">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Business Name" hint={`${(form.name ?? "").length}/60`}>
              <Inp value={form.name ?? ""} maxLength={60} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Locked field="tagline">
            <Field label="Tagline" hint={`Shown on listing cards · ${(form.tagline ?? "").length}/80`}>
              <Inp value={form.tagline ?? ""} maxLength={80} onChange={(e) => set("tagline", e.target.value)} />
            </Field>
            </Locked>
            <Locked field="description" span2>
            <Field label="Description" span2 hint={`${(form.description ?? "").length}/600`}>
              <TextArea rows={4} value={form.description ?? ""} maxLength={600} onChange={(e) => set("description", e.target.value)} />
            </Field>
            </Locked>
          </div>
          <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]"
            onChange={(v) => set("heroImage", v)} />
        </EditorSection>

        <EditorSection title="Contact & Location">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Address" span2>
              <Inp value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Inp value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Inp value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Locked field="website" span2>
            <Field label="Website URL" span2>
              <Inp value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
            </Locked>
          </div>
          <Locked field="social">
            <p className="text-xs font-semibold mb-2" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>Social Links</p>
            <div className="mb-6"><SocialFields links={form.social ?? {}} onChange={(v) => set("social", v)} /></div>
          </Locked>
          <Locked field="lat">
            <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
          </Locked>
        </EditorSection>

        <EditorSection title="Availability" hint="Free text — hotels don't open and close daily.">
          <Locked field="availabilityInfo">
          <Field label="Availability / Check-in Information">
            <TextArea rows={3} value={form.availabilityInfo ?? ""} onChange={(e) => set("availabilityInfo", e.target.value)}
              placeholder="e.g. Check-in from 3pm. 24-hour reception." />
          </Field>
          </Locked>
        </EditorSection>

        <EditorSection title="Photo Gallery" hint="Up to 6 images.">
          <Locked field="gallery">
          <GalleryGrid images={form.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} />
          </Locked>
        </EditorSection>

        <EditorSection title="Feature Highlights" hint="Up to 4 selling points shown on the listing card (amenities).">
          <Locked field="amenities">
          <RepeatableList items={(form.amenities ?? []).slice(0, 4)} onChange={(v) => set("amenities", v.slice(0, 4))} placeholder="e.g. Free Wi-Fi throughout" />
          </Locked>
        </EditorSection>

        <SaveBar onSave={onSave} saving={saving} />
      </div>
    </div>
  );
}
