// Type A — See & Do / Eat & Drink / Shop (shared public page layout).
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, GalleryGrid, HoursEditor, SocialFields, LocationFields,
  CARD, BORDER,
} from "./shared";
import NewsOffersEditor from "./NewsOffersEditor";

export default function TypeAEditor({ form, set, onSave, saving }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Hero Block">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Title" hint="Large title text overlaid on the hero image">
              <Inp value={form.hero.title} onChange={(e) => set("hero", { ...form.hero, title: e.target.value })} />
            </Field>
            <Field label="Subtitle" hint="Smaller tagline/subtitle above the hero image">
              <Inp value={form.hero.subtitle} onChange={(e) => set("hero", { ...form.hero, subtitle: e.target.value })} />
            </Field>
          </div>
          <SingleImageUpload label="Hero Image" src={form.hero.image} aspect="aspect-[16/9]"
            onChange={(v) => set("hero", { ...form.hero, image: v })} />
        </EditorSection>

        <EditorSection title="Opening Hours & Find Us">
          <div className="mb-6"><HoursEditor hours={form.hours} onChange={(v) => set("hours", v)} /></div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Address" span2>
              <Inp value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Phone" hint="Renders as a clickable tel: link on the public page">
              <Inp value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email" hint="Renders as a clickable mailto: link">
              <Inp value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Website URL">
              <Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Booking URL" hint="Powers the &ldquo;Book a Reservation&rdquo; button">
              <Inp value={form.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          <p className="text-xs font-semibold mb-2" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>Social Links</p>
          <SocialFields links={form.social} onChange={(v) => set("social", v)} />
        </EditorSection>

        <EditorSection title="Image Gallery" hint="Gallery images (up to 6) — these appear in the photo gallery section on the business page.">
          <GalleryGrid images={form.gallery} onChange={(v) => set("gallery", v)} max={6} />
        </EditorSection>

        <EditorSection title="Location Pin">
          <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
        </EditorSection>

        <SaveBar onSave={onSave} saving={saving} />
      </div>

      <div className="bg-white rounded-2xl p-6" style={CARD}>
        <p className="text-sm font-bold mb-4" style={{ color: "#1E293B" }}>News & Offers</p>
        <NewsOffersEditor offers={form.offers} onChange={(v) => set("offers", v)} />
      </div>
    </div>
  );
}
