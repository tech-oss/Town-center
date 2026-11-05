// Type B — Services businesses. A freelancer (Services → Freelancer) gets
// the sections their public profile shows — Working With Me, Skills and
// Portfolio — in place of a tradesperson's stats, services list, reasons
// and areas, the same split the business portal makes.
import { FaqListEditor } from "./StayEditors";
import {
  Field, Inp, TextArea, EditorSection, SaveBar,
  SingleImageUpload, PlanImageNote, GalleryGrid, HoursEditor, SocialFields, LocationFields,
  RepeatableList, StatTilesEditor, PortfolioEditor,
  CARD, BORDER, Locked,
} from "./shared";

export default function TypeBEditor({ form, set, onSave, saving }) {
  const isFreelancer = form.businessTypeDetail?.freelancerKind === "freelancer";
  const wwm = form.workingWithMe ?? {};
  const setWwm = (k, v) => set("workingWithMe", { ...wwm, [k]: v });
  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
        <EditorSection title="Header Card">
          <div className="flex items-start gap-6 mb-4">
            <Locked field="logo">
              <SingleImageUpload label="Logo" src={form.logo} logo onChange={(v) => set("logo", v)} />
            </Locked>
            <div className="flex-1 grid sm:grid-cols-2 gap-4">
              <Field label="Business Name" hint={`${(form.name ?? "").length}/60`}>
                <Inp value={form.name ?? ""} maxLength={60} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Locked field="tagline">
              <Field label="Tagline" hint={`Shown on listing cards · ${(form.tagline ?? "").length}/80`}>
                <Inp value={form.tagline ?? ""} maxLength={80} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
              </Locked>
              <Locked field="availabilityTag">
              <Field label="Booking / Availability Tag" hint='e.g. "24 hour booking" — shown as a pill tag'>
                <Inp value={form.availabilityTag ?? ""} onChange={(e) => set("availabilityTag", e.target.value)} />
              </Field>
              </Locked>
            </div>
          </div>
          <Locked field="description">
          <Field label="Description" hint={`Text shown in the card header · ${(form.description ?? "").length}/600`}>
            <TextArea rows={4} value={form.description ?? ""} maxLength={600} onChange={(e) => set("description", e.target.value)} />
          </Field>
          </Locked>
          <div className="mt-4">
            <SingleImageUpload label="Hero Image" src={form.heroImage} aspect="aspect-[16/9]" onChange={(v) => set("heroImage", v)} />
            <PlanImageNote />
          </div>
        </EditorSection>

        <EditorSection title="Contact & Sidebar">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Phone" hint='Powers the "Call Now" button'>
              <Inp value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Address">
              <Inp value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Email">
              <Inp value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Locked field="website">
            <Field label="Website URL">
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

        <EditorSection title="Opening Hours">
          <Locked field="hours">
          <HoursEditor hours={form.hours} onChange={(v) => set("hours", v)} />
          </Locked>
        </EditorSection>

        {!isFreelancer && (<>
        <EditorSection title="Photo Strip" hint="Up to 6 images, displayed as a horizontal strip on the public page.">
          <Locked field="gallery">
          <GalleryGrid images={form.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} />
          </Locked>
        </EditorSection>

        <EditorSection title="Stats / Highlights" hint="Four teal stat tiles shown below the About section on the Overview tab.">
          <Locked field="stats">
          <StatTilesEditor stats={form.stats ?? []} onChange={(v) => set("stats", v)} />
          </Locked>
        </EditorSection>

        <EditorSection title="Services List" hint='Populates "Services We Offer" on the Overview tab.'>
          <Locked field="servicesList">
          <RepeatableList items={form.servicesList ?? []} onChange={(v) => set("servicesList", v)} placeholder="e.g. General Enquiries" />
          </Locked>
        </EditorSection>

        <EditorSection title="Why Choose Us" hint='Populates "Why Choose Us?" on the Overview tab.'>
          <Locked field="whyChooseUs">
          <RepeatableList items={form.whyChooseUs ?? []} onChange={(v) => set("whyChooseUs", v)} placeholder="e.g. Fully insured & accredited" />
          </Locked>
        </EditorSection>

        <EditorSection title="Areas Covered" hint="Populates the Areas Covered tab.">
          <Locked field="areasCoveredList">
          <RepeatableList items={form.areasCoveredList ?? []} onChange={(v) => set("areasCoveredList", v)} placeholder="e.g. Maidenhead" />
          </Locked>
        </EditorSection>

        </>)}

        {isFreelancer && (<>
        <EditorSection title="Working With Me" hint="The Working With Me box on the freelancer's profile.">
          <Locked field="workingWithMe">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Availability" hint="e.g. Accepting new projects"><Inp value={wwm.availability ?? ""} onChange={(e) => setWwm("availability", e.target.value)} /></Field>
            <Field label="Works" hint="e.g. Remote & on-site"><Inp value={wwm.works ?? ""} onChange={(e) => setWwm("works", e.target.value)} /></Field>
            <Field label="Response Time" hint="e.g. Usually within 24 hours"><Inp value={wwm.responseTime ?? ""} onChange={(e) => setWwm("responseTime", e.target.value)} /></Field>
            <Field label="Experience" hint="e.g. 10+"><Inp value={wwm.experience ?? ""} onChange={(e) => setWwm("experience", e.target.value)} /></Field>
          </div>
          </Locked>
        </EditorSection>

        <EditorSection title="Skills">
          <Locked field="skills">
          <RepeatableList items={form.skills ?? []} onChange={(v) => set("skills", v)} placeholder="e.g. Logo Design" />
          </Locked>
        </EditorSection>

        <EditorSection title="Portfolio" hint="Up to 6 items">
          <Locked field="portfolio">
          <PortfolioEditor items={form.portfolio ?? []} onChange={(v) => set("portfolio", v)} max={6} />
          </Locked>
        </EditorSection>
        </>)}

        <EditorSection title="FAQs" hint="Questions and answers on the profile's FAQ tab.">
          <Locked field="faqs">
          <FaqListEditor items={form.faqs ?? []} onChange={(v) => set("faqs", v)} />
          </Locked>
        </EditorSection>

        <SaveBar onSave={onSave} saving={saving} />
      </div>
    </div>
  );
}
