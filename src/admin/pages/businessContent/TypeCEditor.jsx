// Type C — Live & Stay (accommodation providers).
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, GalleryGrid, SocialFields, LocationFields, RepeatableList,
  INPUT, CARD, BORDER,
} from "./shared";
import NewsOffersEditor from "./NewsOffersEditor";

const SUB_CATEGORIES = ["Self Catering & Serviced Accommodation", "Hotels"];

export default function TypeCEditor({ form, set, onSave, saving }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Listing Card">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Business Name">
              <Inp value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Category" hint="e.g. Hotel, Self-catering, Serviced">
              <Inp value={form.category} onChange={(e) => set("category", e.target.value)} />
            </Field>
            <Field label="Sub-category" span2 hint="Which button on the Live & Stay listing page this business appears under">
              <select value={form.subCategory} onChange={(e) => set("subCategory", e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm outline-none" style={INPUT}>
                {SUB_CATEGORIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Description" span2>
              <TextArea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
          <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]"
            onChange={(v) => set("heroImage", v)} />
        </EditorSection>

        <EditorSection title="Contact & Location">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Address" span2>
              <Inp value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Inp value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <Inp value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Website URL" span2>
              <Inp value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
            </Field>
          </div>
          <p className="text-xs font-semibold mb-2" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>Social Links</p>
          <div className="mb-6"><SocialFields links={form.social} onChange={(v) => set("social", v)} /></div>
          <LocationFields lat={form.lat} lng={form.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
        </EditorSection>

        <EditorSection title="Availability" hint="Free text — hotels don't open and close daily.">
          <Field label="Availability / Check-in Information">
            <TextArea rows={3} value={form.availabilityInfo} onChange={(e) => set("availabilityInfo", e.target.value)}
              placeholder="e.g. Check-in from 3pm. 24-hour reception." />
          </Field>
        </EditorSection>

        <EditorSection title="Photo Gallery" hint="Up to 6 images.">
          <GalleryGrid images={form.gallery} onChange={(v) => set("gallery", v)} max={6} />
        </EditorSection>

        <EditorSection title="Feature Highlights" hint="Up to 4 selling points shown on the listing card.">
          <RepeatableList items={form.features.slice(0, 4)} onChange={(v) => set("features", v.slice(0, 4))} placeholder="e.g. Free Wi-Fi throughout" />
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
