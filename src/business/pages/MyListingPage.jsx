import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import {
  Field, Inp, TextArea, EditorSection, SaveBar, ApprovalBadge,
  SingleImageUpload, GalleryGrid, HoursEditor, SocialFields, LocationFields,
  RepeatableList, FaqListEditor, Toggle, Toast, useToast,
  CARD, BORDER, MUTED, FOREST, SAGE,
} from "../components/FormKit";
import ReviewsList from "../components/ReviewsList";
import { getBusinessListing, saveBusinessListing } from "../api/businessListing";
import { listReviews, addReview, updateReview, deleteReview, replyToReview } from "../api/businessReviews";
import {
  AMENITY_OPTIONS, SERVICES_LIST, AREAS_COVERED_LIST, DEFAULT_HOURS,
} from "../../Data/businessPortalMock";

function tabsFor(user) {
  const base = [
    { key: "profile", label: "Profile" },
    { key: "hours", label: user.businessType === "hotel" ? "Availability & Check-in" : "Opening Hours" },
    { key: "gallery", label: user.businessType === "hotel" ? "Photos" : "Gallery" },
    { key: "location", label: "Location" },
    { key: "contact", label: "Contact & Social" },
    { key: "articles", label: "News & Articles" },
    { key: "reviews", label: "Reviews" },
    { key: "faqs", label: "FAQs" },
  ];
  if (user.businessType === "services") {
    base.push({ key: "services", label: "Services" }, { key: "areas", label: "Areas Covered" });
  }
  if (user.businessType === "hotel") {
    base.push({ key: "amenities", label: "Amenities" });
    if (user.isMultiSite) base.push({ key: "properties", label: "Properties" });
  }
  return base;
}

export default function MyListingPage() {
  const { user } = useBusinessAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useToast();
  const tabs = tabsFor(user);
  const [tab, setTab] = useState(tabs[0].key);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getBusinessListing(user.id).then((data) => {
      if (!cancelled) { setListing(data); setLoading(false); }
    });
    listReviews(user.id).then((data) => { if (!cancelled) setReviews(data); });
    return () => { cancelled = true; };
  }, [user.id]);

  function set(k, v) { setListing((l) => ({ ...l, [k]: v })); }
  function setStatus(tabKey, status) {
    setListing((l) => ({ ...l, approvalStatus: { ...l.approvalStatus, [tabKey]: status } }));
  }

  async function handleSave(tabKey) {
    setSaving(true);
    const next = { ...listing, approvalStatus: { ...listing.approvalStatus, [tabKey]: "Pending Approval" } };
    try {
      await saveBusinessListing(user.id, next);
      setListing(next);
      setToast("Changes submitted for admin approval.");
    } catch {
      setToast("Something went wrong saving your changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewReply(id, text) {
    await replyToReview(id, text);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: { text, status: "Pending Approval" } } : r)));
    setToast("Reply submitted for admin approval.");
  }
  async function handleReviewAdd(form) {
    const created = await addReview(user.id, form);
    setReviews((prev) => [created, ...prev]);
    setToast("Review added.");
  }
  async function handleReviewUpdate(id, form) {
    await updateReview(id, form);
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...form } : r)));
    setToast("Review updated.");
  }
  async function handleReviewDelete(id) {
    await deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setToast("Review deleted.");
  }

  if (loading) {
    return (
      <BusinessLayout>
        <p className="text-sm" style={{ color: MUTED }}>Loading your listing…</p>
      </BusinessLayout>
    );
  }

  const status = listing.approvalStatus?.[tab];

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>My Listing</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Manage your public business page content.</p>
        </div>

        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ backgroundColor: "rgba(82,199,182,0.08)", border: "1.5px solid rgba(82,199,182,0.25)", color: "#0F766E" }}>
          Changes you save here are submitted to admin for approval before going live on the public site. Approved changes usually appear within 24 hours.
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: BORDER }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{ color: tab === t.key ? "#0F766E" : MUTED, borderBottom: tab === t.key ? `2px solid ${SAGE}` : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
              {listing.approvalStatus?.[t.key] === "Pending Approval" && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#E8A33D" }} />}
              {listing.approvalStatus?.[t.key] === "Changes Rejected" && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#DC2626" }} />}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-8" style={CARD}>
          {tab === "profile" && (
            <>
              <EditorSection title="Business Profile">
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <Field label="Business Name"><Inp value={listing.name} onChange={(e) => set("name", e.target.value)} /></Field>
                  <Field label="Category" hint="Set by admin on registration"><Inp value={listing.category} disabled style={{ opacity: 0.6 }} /></Field>
                  <Field label="Short Tagline" span2 hint="Shown on listing cards"><Inp value={listing.tagline} onChange={(e) => set("tagline", e.target.value)} /></Field>
                  <Field label="Main Description" span2 hint="The full about section on your page"><TextArea rows={5} value={listing.description} onChange={(e) => set("description", e.target.value)} /></Field>
                </div>
                <div className="flex flex-wrap gap-8">
                  <SingleImageUpload label="Business Logo" src={listing.logo} round pathPrefix={user.id} onChange={(v) => set("logo", v)} />
                  <SingleImageUpload label="Hero / Header Image" src={listing.heroImage} aspect="aspect-[16/9]" pathPrefix={user.id} onChange={(v) => set("heroImage", v)} />
                </div>
                <p className="text-[11px] mt-2" style={{ color: "#9CA3AF" }}>This image appears at the top of your public business page.</p>
              </EditorSection>
              <SaveBar onSave={() => handleSave("profile")} saving={saving} status={status} />
            </>
          )}

          {tab === "hours" && (
            <>
              <EditorSection title={user.businessType === "hotel" ? "Availability & Check-in" : "Opening Hours"}>
                {user.businessType === "hotel" ? (
                  <TextArea rows={4} value={listing.availabilityInfo ?? ""} onChange={(e) => set("availabilityInfo", e.target.value)} placeholder="e.g. Check-in from 3pm. 24-hour reception." />
                ) : (
                  <HoursEditor hours={listing.hours ?? DEFAULT_HOURS()} onChange={(v) => set("hours", v)} />
                )}
              </EditorSection>
              <SaveBar onSave={() => handleSave("hours")} saving={saving} status={status} />
            </>
          )}

          {tab === "gallery" && (
            <>
              <EditorSection title={user.businessType === "hotel" ? "Photos" : "Gallery"} hint="These images appear in the gallery on your public page.">
                <GalleryGrid images={listing.gallery ?? []} onChange={(v) => set("gallery", v)} max={6} pathPrefix={user.id} />
              </EditorSection>
              <SaveBar onSave={() => handleSave("gallery")} saving={saving} status={status} />
            </>
          )}

          {tab === "location" && (
            <>
              <EditorSection title="Location">
                <Field label="Address" span2><Inp value={listing.address} onChange={(e) => set("address", e.target.value)} /></Field>
                <div className="mt-4">
                  <LocationFields lat={listing.lat} lng={listing.lng} onChange={({ lat, lng }) => { set("lat", lat); set("lng", lng); }} />
                </div>
              </EditorSection>
              <SaveBar onSave={() => handleSave("location")} saving={saving} status={status} />
            </>
          )}

          {tab === "contact" && (
            <>
              <EditorSection title="Contact & Social">
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <Field label="Phone" hint="Shown as a clickable call link"><Inp value={listing.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                  <Field label="Email"><Inp value={listing.email} onChange={(e) => set("email", e.target.value)} /></Field>
                  <Field label="Website URL"><Inp value={listing.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" /></Field>
                  <Field label="Booking URL" hint="If you have a reservation system, add the URL here — it powers the &ldquo;Book a Reservation&rdquo; button on your page">
                    <Inp value={listing.bookingUrl ?? ""} onChange={(e) => set("bookingUrl", e.target.value)} placeholder="https://…" />
                  </Field>
                </div>
                <p className="text-xs font-semibold mb-2" style={{ color: MUTED }}>Social Links</p>
                <SocialFields links={listing.social} onChange={(v) => set("social", v)} />
              </EditorSection>
              <SaveBar onSave={() => handleSave("contact")} saving={saving} status={status} />
            </>
          )}

          {tab === "articles" && (
            <EditorSection title="News & Articles">
              <p className="text-sm mb-4" style={{ color: MUTED }}>Manage up to 3 articles that appear on your business page and in the Offers section of the public site.</p>
              <Link to="/business/articles" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 w-fit inline-block" style={{ backgroundColor: SAGE }}>
                Manage Articles →
              </Link>
            </EditorSection>
          )}

          {tab === "reviews" && (
            <EditorSection title="Reviews">
              <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Add, edit or remove reviews for your business, and reply to reviews — your reply goes to admin for approval before appearing.</p>
              <ReviewsList reviews={reviews} onReply={handleReviewReply} onAdd={handleReviewAdd} onUpdate={handleReviewUpdate} onDelete={handleReviewDelete} />
            </EditorSection>
          )}

          {tab === "faqs" && (
            <>
              <EditorSection title="FAQs">
                <FaqListEditor items={listing.faqs ?? []} onChange={(v) => set("faqs", v)} />
              </EditorSection>
              <SaveBar onSave={() => handleSave("faqs")} saving={saving} status={status} />
            </>
          )}

          {tab === "services" && (
            <>
              <EditorSection title="Services We Offer">
                <RepeatableList items={listing.servicesList ?? SERVICES_LIST} onChange={(v) => set("servicesList", v)} placeholder="e.g. General Enquiries" />
              </EditorSection>
              <SaveBar onSave={() => handleSave("services")} saving={saving} status={status} />
            </>
          )}

          {tab === "areas" && (
            <>
              <EditorSection title="Areas Covered">
                <RepeatableList items={listing.areasCoveredList ?? AREAS_COVERED_LIST} onChange={(v) => set("areasCoveredList", v)} placeholder="e.g. Maidenhead" />
              </EditorSection>
              <SaveBar onSave={() => handleSave("areas")} saving={saving} status={status} />
            </>
          )}

          {tab === "amenities" && (
            <>
              <EditorSection title="Amenities">
                <div className="grid sm:grid-cols-2 gap-2 mb-4">
                  {AMENITY_OPTIONS.map((a) => {
                    const checked = (listing.amenities ?? []).includes(a);
                    return (
                      <Toggle key={a} checked={checked} label={a}
                        onChange={(v) => set("amenities", v ? [...(listing.amenities ?? []), a] : (listing.amenities ?? []).filter((x) => x !== a))} />
                    );
                  })}
                </div>
                <Field label="Other Amenities"><TextArea rows={2} value={listing.otherAmenities ?? ""} onChange={(e) => set("otherAmenities", e.target.value)} /></Field>
              </EditorSection>
              <SaveBar onSave={() => handleSave("amenities")} saving={saving} status={status} />
            </>
          )}

          {tab === "properties" && (
            <EditorSection title="Registered Properties" action={
              <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>+ Add Property</button>
            }>
              <div className="flex flex-col gap-3">
                {(listing.properties ?? []).map((p) => (
                  <div key={p.id} className="rounded-xl p-4" style={{ border: `1.5px solid ${BORDER}` }}>
                    <p className="text-sm font-semibold" style={{ color: FOREST }}>{p.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{p.address}</p>
                  </div>
                ))}
              </div>
            </EditorSection>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
}
