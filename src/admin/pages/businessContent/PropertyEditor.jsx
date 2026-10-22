// One accommodation property in admin's content editor — the same details
// the company edits in the business portal (profile, photos, location,
// contact and booking, check-in, amenities, rooms, FAQs). Admin's save goes
// live straight away, like every admin content edit.
import { useEffect, useState } from "react";
import {
  Field, Inp, TextArea, EditorSection, SaveBar, Toggle, SingleImageUpload, GalleryGrid, SocialFields, LocationFields,
  PlanContext, Locked, CARD, MUTED, NAVY, BLUE,
} from "./shared";
import { CheckInEditor, AmenitiesEditor, RoomsEditor, FaqListEditor } from "./StayEditors";
import { StateChip } from "./AccommodationCompanyEditor";
import { ACCOMMODATION_AMENITY_CATEGORIES, ROOM_AMENITIES, ROOMS_MAX, PROPERTY_GALLERY_MAX } from "../../../Data/accommodationAmenities";
import { getBusinessListingContent, saveBusinessListingContent } from "../../../api/admin/businessListingContent";
import { getPropertyCompany, publishProperty } from "../../../api/admin/accommodationContent";
import { isPremium } from "../../../Data/plans";

export default function PropertyEditor({ propertyId, onBack, onToast }) {
  const [company, setCompany] = useState(null);
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getPropertyCompany(propertyId);
        if (!c) throw new Error("This property wasn't found.");
        const l = await getBusinessListingContent(propertyId, { planFrom: c.companyId });
        if (!cancelled) { setCompany(c); setListing(l); }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [propertyId]);

  if (error) return <p className="text-sm" style={{ color: "#991B1B" }}>{error}</p>;
  if (!company || !listing) return <p className="text-sm py-10 text-center" style={{ color: MUTED }}>Loading property…</p>;

  const set = (k, v) => setListing((l) => ({ ...l, [k]: v }));
  const premium = isPremium(company.plan);
  const ownContact = listing.contactSource === "own";

  async function save() {
    setSaving(true);
    try {
      await saveBusinessListingContent(propertyId, listing);
      onToast(company.state === "live" ? "Saved — live on the property page now." : "Saved. Put the property live when it's ready.");
    } catch (e) {
      onToast(e.message ?? "Something went wrong saving this property.");
    } finally {
      setSaving(false);
    }
  }

  async function putLive() {
    setPublishing(true);
    try {
      await saveBusinessListingContent(propertyId, listing);
      await publishProperty(propertyId, company.state);
      setCompany((c) => ({ ...c, state: "live" }));
      onToast(`${listing.name || "The property"} is live.`);
    } catch (e) {
      onToast(e.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={onBack} className="text-sm font-medium self-start hover:opacity-70" style={{ color: NAVY }}>
        ← {company.companyName || "Company"} and its properties
      </button>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>{listing.name || "Property"}</h2>
            <StateChip state={company.state} />
          </div>
          <p className="text-xs mt-1" style={{ color: MUTED }}>
            Property of {company.companyName}. Saving publishes straight away — admin edits don't need approval.
          </p>
        </div>
        {["draft", "rejected", "pending"].includes(company.state) && (
          <button type="button" onClick={putLive} disabled={publishing}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: BLUE }}>
            {publishing ? "Putting live…" : "Save and put live"}
          </button>
        )}
      </div>

      {!premium && (
        <div className="rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: "rgba(217,119,6,0.08)", border: "1.5px solid rgba(217,119,6,0.3)", color: "#92400E" }}>
          <span className="font-bold">Free plan.</span> The company is on the Free plan, so a property shows only its name, address and map pin. The rest unlocks on a paid plan.
        </div>
      )}

      <PlanContext.Provider value={company.plan}>
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
          <EditorSection title="Property">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Field label="Property name" span2 hint={`${(listing.name ?? "").length}/120`}>
                <Inp value={listing.name ?? ""} maxLength={120} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Locked field="tagline" span2>
                <Field label="Headline / tagline" span2 hint={`Shown on listing cards · ${(listing.tagline ?? "").length}/80`}>
                  <Inp value={listing.tagline ?? ""} maxLength={80} onChange={(e) => set("tagline", e.target.value)} />
                </Field>
              </Locked>
              <Locked field="description" span2>
                <Field label="Full description" span2 hint={`${(listing.description ?? "").length}/1200`}>
                  <TextArea rows={6} value={listing.description ?? ""} maxLength={1200} onChange={(e) => set("description", e.target.value)} />
                </Field>
              </Locked>
            </div>
            <SingleImageUpload label="Header / hero picture" src={listing.heroImage} aspect="aspect-[16/9]" onChange={(v) => set("heroImage", v)} />
            <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>The company logo from its company profile appears on the page and as the map marker.</p>
          </EditorSection>

          <EditorSection title="Photos" hint={`Up to ${PROPERTY_GALLERY_MAX} pictures, as well as the header picture.`}>
            <Locked field="gallery">
              <GalleryGrid images={listing.gallery ?? []} onChange={(v) => set("gallery", v)} max={PROPERTY_GALLERY_MAX} />
            </Locked>
          </EditorSection>

          <EditorSection title="Location" hint="The property's address and map pin. This is where it appears on the map.">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Field label="Address" span2><Inp value={listing.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
              <Field label="Postal Code"><Inp value={listing.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value)} placeholder="e.g. SL6 1QJ" /></Field>
            </div>
            <LocationFields lat={listing.lat} lng={listing.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
          </EditorSection>

          <EditorSection title="Contact details" hint="Guests see these on the property page to enquire.">
            <Locked field="website">
              <Toggle checked={!ownContact} label="Use the company's contact details"
                onChange={(v) => set("contactSource", v ? "company" : "own")} />
              {ownContact && (
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  <Field label="Phone"><Inp value={listing.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
                  <Field label="Email"><Inp value={listing.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
                  <Field label="Website URL" span2><Inp value={listing.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Social links</p>
                    <SocialFields links={listing.social ?? {}} onChange={(v) => set("social", v)} />
                  </div>
                  <p className="text-[11px] sm:col-span-2" style={{ color: MUTED }}>Anything left blank falls back to the company's details.</p>
                </div>
              )}
            </Locked>
          </EditorSection>

          <EditorSection title="Booking">
            <Locked field="website">
              <Field label="Booking link" hint="Powers the Book button on the property page. Leave blank and no button is shown.">
                <Inp value={listing.bookingUrl ?? ""} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" />
              </Field>
            </Locked>
          </EditorSection>

          <EditorSection title="Check-in and check-out">
            <Locked field="checkInTime"><CheckInEditor listing={listing} set={set} /></Locked>
          </EditorSection>

          <Locked field="amenities">
            <AmenitiesEditor listing={listing} set={set} categories={ACCOMMODATION_AMENITY_CATEGORIES} />
          </Locked>

          <EditorSection title="Rooms and accommodation" hint="Each type of room or unit guests can book.">
            <Locked field="amenities">
              <RoomsEditor rooms={listing.rooms} onChange={(v) => set("rooms", v)} amenityOptions={ROOM_AMENITIES} max={ROOMS_MAX} />
            </Locked>
          </EditorSection>

          <EditorSection title="FAQs" hint="Questions guests often ask about this property.">
            <Locked field="description"><FaqListEditor items={listing.faqs ?? []} onChange={(v) => set("faqs", v)} /></Locked>
          </EditorSection>

          <SaveBar onSave={save} saving={saving} />
        </div>
      </PlanContext.Provider>
    </div>
  );
}
