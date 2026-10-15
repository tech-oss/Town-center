import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import StateChip from "../components/PropertyStateChip";
import {
  Field, Inp, TextArea, EditorSection, SaveBar, Toggle,
  SingleImageUpload, GalleryGrid, SocialFields, LocationFields, FaqListEditor, Toast, useToast,
  CARD, BORDER, MUTED, FOREST, SAGE,
  PlanContext, Locked, FreePlanNotice,
} from "../components/FormKit";
import ReviewsList from "../components/ReviewsList";
import { CheckInEditor, AmenitiesEditor, RoomsEditor } from "../components/StayEditors";
import { isPremium } from "../../Data/plans";
import {
  PROPERTY_STATES, PROPERTY_FREE_FIELDS, PROPERTY_GALLERY_MAX, PROPERTY_AMENITY_CATEGORIES, ROOM_AMENITIES, ROOMS_MAX,
} from "../../Data/accommodation";
import { getBusinessListing, saveBusinessListing } from "../api/businessListing";
import { listReviews, addReview, updateReview, deleteReview } from "../api/businessReviews";
import { getProperty, submitProperty, readableError } from "../api/accommodation";

// One accommodation property's details. A property that has never been live
// (draft, pending, rejected) is approved as a whole, so its sections save
// straight onto it and nothing goes public until admin approves the
// property. Once it has been live, each section's changes are reviewed like
// any other listing edit — except a save that only flips toggles (early
// check-in, late check-out, amenity and room-amenity ticks), which goes live
// straight away (saveBusinessListing's `property` option).

const TABS = [
  { key: "profile",   label: "Profile" },
  { key: "gallery",   label: "Photos" },
  { key: "location",  label: "Location" },
  { key: "contact",   label: "Contact & Booking" },
  { key: "hours",     label: "Check-in" },
  { key: "amenities", label: "Amenities" },
  { key: "rooms",     label: "Rooms" },
  { key: "faqs",      label: "FAQs" },
  { key: "reviews",   label: "Reviews" },
];

// Tabs with something a Free property may edit (name; address and pin).
const FREE_TABS = new Set(["profile", "location"]);
const NEVER_LIVE = new Set(["draft", "pending", "rejected"]);

// The property, its listing and its reviews. A property of another company
// (or not a property at all) reads as "not found" — the database only lets
// members see their own company's listings anyway.
async function fetchProperty(id, companyId) {
  try {
    const property = await getProperty(id);
    if (!property || property.companyId !== companyId) return { error: "This property wasn't found." };
    const [listing, reviews] = await Promise.all([getBusinessListing(id), listReviews(id)]);
    return { property, listing, reviews };
  } catch (e) {
    return { error: readableError(e).message };
  }
}

export default function PropertyEditorPage() {
  const { id } = useParams();
  const { user } = useBusinessAuth();
  const premium = isPremium(user.plan);
  const [property, setProperty] = useState(null);
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useToast();

  const apply = useCallback((data) => {
    if (data.error) { setError(data.error); return; }
    setProperty(data.property);
    setListing(data.listing);
    setReviews(data.reviews);
  }, []);
  const load = useCallback(() => fetchProperty(id, user.id).then(apply), [id, user.id, apply]);

  useEffect(() => {
    let cancelled = false;
    fetchProperty(id, user.id).then((data) => { if (!cancelled) apply(data); });
    return () => { cancelled = true; };
  }, [id, user.id, apply]);

  const plan = useMemo(() => ({
    plan: user.plan,
    role: user.role,
    planName: "accommodation plan",
    canEdit: (field) => premium || PROPERTY_FREE_FIELDS.has(field),
  }), [user.plan, user.role, premium]);

  if (error) {
    return (
      <BusinessLayout>
        <div className="flex flex-col gap-3 max-w-xl">
          <Link to="/business/properties" className="text-sm font-semibold" style={{ color: SAGE }}>← My Properties</Link>
          <p className="text-sm" style={{ color: "#991B1B" }}>{error}</p>
        </div>
      </BusinessLayout>
    );
  }
  if (!property || !listing) {
    return <BusinessLayout><p className="text-sm" style={{ color: MUTED }}>Loading property…</p></BusinessLayout>;
  }

  const direct = NEVER_LIVE.has(property.state);
  const tabEditable = (key) => premium || FREE_TABS.has(key);
  const status = direct ? null : listing.approvalStatus?.[tab];
  const rejectionReason = direct ? null : listing.rejectionReason?.[tab];
  const propertyRejection = property.state === "rejected" ? listing.rejectionReason?.property : null;

  function set(k, v) { setListing((l) => ({ ...l, [k]: v })); }

  async function handleSave(tabKey) {
    setSaving(true);
    try {
      const { unchanged, live } = await saveBusinessListing(id, listing, tabKey, { direct, property: true });
      if (unchanged) { setToast("Nothing has changed in this section."); return; }
      const fresh = await getBusinessListing(id);
      setListing(fresh);
      setToast(direct ? "Saved." : live ? "Saved — live on the property page now." : "Changes submitted for admin approval.");
    } catch (e) {
      setToast(readableError(e).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitProperty(id);
      setToast("Sent to Maidenhead admin for approval.");
      await load();
    } catch (e) {
      setToast(readableError(e).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewAdd(form) {
    const created = await addReview(id, form);
    setReviews((prev) => [created, ...prev]);
    setToast("Review sent for approval. It goes live once an admin approves it.");
  }
  async function handleReviewUpdate(reviewId, form) {
    await updateReview(reviewId, form);
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, ...form, status: "Pending Approval", moderationNote: null } : r)));
    setToast("Changes sent for approval.");
  }
  async function handleReviewDelete(reviewId) {
    await deleteReview(reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setToast("Review deleted.");
  }

  const save = (key) => tabEditable(key) && (
    <SaveBar onSave={() => handleSave(key)} saving={saving} status={status} rejectionReason={rejectionReason} />
  );

  return (
    <BusinessLayout>
      <PlanContext.Provider value={plan}>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-4xl">
        <Link to="/business/properties" className="text-sm font-semibold w-fit" style={{ color: SAGE }}>← My Properties</Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ color: FOREST }}>{listing.name || property.name}</h1>
              <StateChip state={property.state} />
            </div>
            <p className="text-sm mt-1" style={{ color: MUTED }}>{PROPERTY_STATES[property.state]?.help}</p>
          </div>
          {(property.state === "draft" || property.state === "rejected") && (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: SAGE }}>
              {submitting ? "Submitting…" : property.state === "rejected" ? "Resubmit for approval" : "Submit for approval"}
            </button>
          )}
        </div>

        {propertyRejection && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.25)", color: "#991B1B" }}>
            <strong>Not approved:</strong> {propertyRejection} Correct the details below, save, then resubmit.
          </div>
        )}

        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(37,99,235,0.07)", border: "1.5px solid rgba(37,99,235,0.2)", color: "#2563EB" }}>
          {direct
            ? "Save each section as you go. Nothing is public until you submit the property and Maidenhead admin approves it."
            : "Changes you save are reviewed by Maidenhead admin before going live. Only on/off ticks — early check-in, late check-out, amenities and room amenities — go live as soon as you save them."}
        </div>

        {!premium && (
          <FreePlanNotice>
            On the Free plan a property shows its name, address and map pin, with your company details. Photos, description, booking link, amenities, rooms, check-in, FAQs and reviews unlock with a paid plan.
          </FreePlanNotice>
        )}

        <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: BORDER }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{ color: tab === t.key ? "#2563EB" : MUTED, borderBottom: tab === t.key ? `2px solid ${SAGE}` : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
              {!tabEditable(t.key) && <span title="Paid plans">🔒</span>}
              {!direct && listing.approvalStatus?.[t.key] === "Pending Approval" && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#D97706" }} />}
              {!direct && listing.approvalStatus?.[t.key] === "Changes Rejected" && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#DC2626" }} />}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
          {tab === "profile" && (
            <>
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
                <Locked field="heroImage" message="The header picture is part of the paid plans.">
                  <SingleImageUpload label="Header / hero picture" src={listing.heroImage} aspect="aspect-[16/9]" pathPrefix={id}
                    ratio={16 / 9} ratioLabel="16:9 (Landscape)" onChange={(v) => set("heroImage", v)} frames={["hero", "card"]} />
                </Locked>
                <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>Your company logo from the company profile appears on the page and as the map marker.</p>
              </EditorSection>
              {save("profile")}
            </>
          )}

          {tab === "gallery" && (
            <>
              <EditorSection title="Photos" hint={`Up to ${PROPERTY_GALLERY_MAX} pictures, as well as the header picture.`}>
                <Locked field="gallery">
                  <GalleryGrid images={listing.gallery ?? []} onChange={(v) => set("gallery", v)} max={PROPERTY_GALLERY_MAX} pathPrefix={id} ratio={1} ratioLabel="1:1 (Square)" />
                </Locked>
              </EditorSection>
              {save("gallery")}
            </>
          )}

          {tab === "location" && (
            <>
              <EditorSection title="Location" hint="The property's address and map pin. This is where it appears on the map.">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Address" span2><Inp value={listing.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
                  <Field label="Postal Code"><Inp value={listing.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value)} placeholder="e.g. SL6 1QJ" /></Field>
                </div>
                <div className="mt-4">
                  <LocationFields lat={listing.lat} lng={listing.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
                </div>
              </EditorSection>
              {save("location")}
            </>
          )}

          {tab === "contact" && (
            <>
              <EditorSection title="Contact details" hint="Guests see these on the property page to enquire.">
                <Locked field="contactSource">
                  <div className="flex flex-col gap-2">
                    <Toggle checked={listing.contactSource !== "own"} label="Use my company's contact details"
                      sublabel="The phone, email, website and social links from your company profile."
                      onChange={(v) => set("contactSource", v ? "company" : "own")} />
                  </div>
                </Locked>
                {premium && listing.contactSource === "own" && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-5">
                    <Field label="Phone"><Inp value={listing.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
                    <Field label="Email"><Inp value={listing.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
                    <Field label="Website URL" span2><Inp value={listing.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Social links</p>
                      <SocialFields links={listing.social} onChange={(v) => set("social", v)} />
                    </div>
                    <p className="text-[11px] sm:col-span-2" style={{ color: MUTED }}>Anything left blank falls back to your company's details.</p>
                  </div>
                )}
              </EditorSection>
              <EditorSection title="Booking">
                <Locked field="bookingUrl">
                  <Field label="Booking link" hint="Powers the Book button on the property page. Leave blank and no button is shown.">
                    <Inp value={listing.bookingUrl ?? ""} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" />
                  </Field>
                </Locked>
              </EditorSection>
              {save("contact")}
            </>
          )}

          {tab === "hours" && (
            <>
              <EditorSection title="Check-in and check-out">
                <Locked field="hours"><CheckInEditor listing={listing} set={set} /></Locked>
              </EditorSection>
              {save("hours")}
            </>
          )}

          {tab === "amenities" && (
            <>
              <Locked field="amenities">
                <AmenitiesEditor listing={listing} set={set} categories={PROPERTY_AMENITY_CATEGORIES} />
              </Locked>
              {save("amenities")}
            </>
          )}

          {tab === "rooms" && (
            <>
              <EditorSection title="Rooms and accommodation" hint="Each type of room or unit guests can book.">
                <Locked field="rooms">
                  <RoomsEditor rooms={listing.rooms} onChange={(v) => set("rooms", v)} amenityOptions={ROOM_AMENITIES} max={ROOMS_MAX} />
                </Locked>
              </EditorSection>
              {save("rooms")}
            </>
          )}

          {tab === "faqs" && (
            <>
              <EditorSection title="FAQs" hint="Questions guests often ask about this property.">
                <Locked field="faqs"><FaqListEditor items={listing.faqs ?? []} onChange={(v) => set("faqs", v)} /></Locked>
              </EditorSection>
              {save("faqs")}
            </>
          )}

          {tab === "reviews" && (
            <EditorSection title="Reviews">
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Reviews belong to this property. Add each with a verification link so it can be confirmed as genuine.</p>
              <Locked field="reviews">
                <ReviewsList reviews={reviews} onAdd={handleReviewAdd} onUpdate={handleReviewUpdate} onDelete={handleReviewDelete} premium={premium} />
              </Locked>
            </EditorSection>
          )}
        </div>
      </div>
      </PlanContext.Provider>
    </BusinessLayout>
  );
}
