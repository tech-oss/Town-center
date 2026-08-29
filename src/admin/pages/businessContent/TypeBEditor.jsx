// Type B — Services businesses.
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, GalleryGrid, HoursEditor, SocialFields, LocationFields,
  RepeatableList, StatTilesEditor,
  CARD, BORDER,
} from "./shared";
import NewsOffersEditor from "./NewsOffersEditor";

export default function TypeBEditor({ form, set, onSave, saving }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Header Card">
          <div className="flex items-start gap-6 mb-4">
            <SingleImageUpload label="Logo" src={form.logo} round onChange={(v) => set("logo", v)} />
            <div className="flex-1 grid sm:grid-cols-2 gap-4">
              <Field label="Business Name">
                <Inp value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Category" hint="e.g. Builders, Electricians">
                <Inp value={form.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Booking / Availability Tag" hint='e.g. "24 hour booking" — shown as a pill tag'>
                <Inp value={form.bookingTag} onChange={(e) => set("bookingTag", e.target.value)} />
              </Field>
            </div>
          </div>
          <Field label="Description" hint="Text shown in the card header">
            <TextArea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </EditorSection>

        <EditorSection title="Contact & Sidebar">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Phone" hint='Powers the "Call Now" button'>
              <Inp value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Address">
              <Inp value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Email">
              <Inp value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Website URL">
              <Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          <p className="text-xs font-semibold mb-2" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>Social Links</p>
          <div className="mb-6"><SocialFields links={form.social} onChange={(v) => set("social", v)} /></div>
          <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
        </EditorSection>

        <EditorSection title="Opening Hours">
          <HoursEditor hours={form.hours} onChange={(v) => set("hours", v)} />
        </EditorSection>

        <EditorSection title="Photo Strip" hint="Up to 6 images, displayed as a horizontal strip on the public page.">
          <GalleryGrid images={form.photos} onChange={(v) => set("photos", v)} max={6} />
        </EditorSection>

        <EditorSection title="Stats / Highlights" hint="Four teal stat tiles shown below the About section on the Overview tab.">
          <StatTilesEditor stats={form.stats} onChange={(v) => set("stats", v)} />
        </EditorSection>

        <EditorSection title="Services List" hint='Populates "Services We Offer" on the Overview tab.'>
          <RepeatableList items={form.services} onChange={(v) => set("services", v)} placeholder="e.g. General Enquiries" />
        </EditorSection>

        <EditorSection title="Why Choose Us" hint='Populates "Why Choose Us?" on the Overview tab.'>
          <RepeatableList items={form.whyChooseUs} onChange={(v) => set("whyChooseUs", v)} placeholder="e.g. Fully insured & accredited" />
        </EditorSection>

        <EditorSection title="Areas Covered" hint="Populates the Areas Covered tab.">
          <RepeatableList items={form.areasCovered} onChange={(v) => set("areasCovered", v)} placeholder="e.g. Maidenhead" />
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
