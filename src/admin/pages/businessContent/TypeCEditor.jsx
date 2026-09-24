// Type C — Hotel & Accommodation.
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, PlanImageNote, GalleryGrid, SocialFields, LocationFields, RepeatableList,
  Toggle, CARD, BORDER, MUTED, Locked,
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
          <div className="flex flex-wrap gap-8">
            <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]"
              onChange={(v) => set("heroImage", v)} />
            <SingleImageUpload label="Logo" src={form.logo} round onChange={(v) => set("logo", v)} />
          </div>
          <PlanImageNote />
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

        <EditorSection title="Availability & Check-in" hint="Free text — hotels don't open and close daily.">
          <Locked field="checkInTime">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Check-in Times" hint="Shown as written">
              <Inp value={form.checkInTime ?? ""} maxLength={60} onChange={(e) => set("checkInTime", e.target.value)}
                placeholder="e.g. From 3pm" />
            </Field>
            <Field label="Check-out Times" hint="Shown as written">
              <Inp value={form.checkOutTime ?? ""} maxLength={60} onChange={(e) => set("checkOutTime", e.target.value)}
                placeholder="e.g. By 11am" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            <Toggle checked={!!form.earlyCheckin} label="Offers early check-in"
              onChange={(v) => set("earlyCheckin", v)} />
            <Toggle checked={!!form.lateCheckout} label="Offers late check-out"
              onChange={(v) => set("lateCheckout", v)} />
          </div>
          <p className="text-[11px] mt-2" style={{ color: MUTED }}>
            These two drive the Live &amp; Stay filters on the site and the app.
          </p>
          </Locked>
          <Locked field="availabilityInfo">
          <div className="mt-5">
          <Field label="Anything Else About Arriving">
            <TextArea rows={3} value={form.availabilityInfo ?? ""} onChange={(e) => set("availabilityInfo", e.target.value)}
              placeholder="e.g. 24-hour reception. Late arrivals by arrangement." />
          </Field>
          </div>
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
