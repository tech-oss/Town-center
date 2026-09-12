import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";

// business_listings: My Listing page content (profile, hours, gallery,
// location, contact, FAQs, services/areas/amenities depending on business
// type). Maps snake_case DB columns to the camelCase shape MyListingPage.jsx
// already works with, so the page component's state shape doesn't change.

function fromRow(row) {
  if (!row) return {};
  return {
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    tagline: row.tagline,
    description: row.description,
    logo: row.logo,
    heroImage: row.hero_image,
    hours: row.hours,
    availabilityInfo: row.availability_info,
    gallery: row.gallery,
    address: row.address,
    postalCode: row.postal_code,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    email: row.email,
    website: row.website,
    bookingUrl: row.booking_url,
    social: row.social,
    faqs: row.faqs,
    servicesList: row.services_list,
    areasCoveredList: row.areas_covered_list,
    amenities: row.amenities,
    otherAmenities: row.other_amenities,
    starRating: row.star_rating,
    properties: row.properties,
    approvalStatus: row.approval_status,
    rejectionReason: row.rejection_reason,
    whyChooseUs: row.why_choose_us,
    stats: row.stats,
    availabilityTag: row.availability_tag,
    businessTypeDetail: row.business_type_detail,
    workingWithMe: row.working_with_me,
    skills: row.skills,
    portfolio: row.portfolio,
    pendingSnapshot: row.pending_snapshot ?? {},
    editedBy: row.edited_by ?? {},
  };
}

// Which camelCase fields belong to which approval-status tab — mirrors
// admin-panel's SECTION_FIELDS in src/api/admin/approvals.js, since both
// sides need to agree on what "the hours section" actually consists of.
// Used to snapshot only the fields a save is about to touch, not the whole
// row, so two tabs saved back-to-back don't clobber each other's snapshot.
const SECTION_FIELDS = {
  profile: ["name", "tagline", "description", "logo", "heroImage"],
  hours: ["hours", "availabilityInfo"],
  gallery: ["gallery"],
  location: ["address", "postalCode", "lat", "lng"],
  contact: ["phone", "email", "website", "bookingUrl", "social"],
  faqs: ["faqs"],
  portfolio: ["portfolio", "skills"],
  services: ["servicesList", "areasCoveredList", "whyChooseUs", "stats"],
};

// Reader-friendly names for the section a save belongs to, used in the
// dashboard's activity feed.
const SECTION_LABELS = {
  profile: "Profile",
  hours: "Opening hours",
  gallery: "Gallery",
  location: "Location",
  contact: "Contact details",
  faqs: "FAQs",
  portfolio: "Portfolio",
  services: "Services",
};

function toRow(listing) {
  return {
    name: listing.name,
    category: listing.category,
    subcategory: listing.subcategory,
    tagline: listing.tagline,
    description: listing.description,
    logo: listing.logo,
    hero_image: listing.heroImage,
    hours: listing.hours,
    availability_info: listing.availabilityInfo,
    gallery: listing.gallery,
    address: listing.address,
    postal_code: listing.postalCode,
    lat: listing.lat,
    lng: listing.lng,
    phone: listing.phone,
    email: listing.email,
    website: listing.website,
    booking_url: listing.bookingUrl,
    social: listing.social,
    faqs: listing.faqs,
    services_list: listing.servicesList,
    areas_covered_list: listing.areasCoveredList,
    amenities: listing.amenities,
    other_amenities: listing.otherAmenities,
    star_rating: listing.starRating,
    properties: listing.properties,
    approval_status: listing.approvalStatus,
    rejection_reason: listing.rejectionReason,
    why_choose_us: listing.whyChooseUs,
    stats: listing.stats,
    availability_tag: listing.availabilityTag,
    business_type_detail: listing.businessTypeDetail,
    working_with_me: listing.workingWithMe,
    skills: listing.skills,
    portfolio: listing.portfolio,
    updated_at: new Date().toISOString(),
  };
}

export async function getBusinessListing(businessId) {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data);
}

// tabKey identifies which section this save belongs to (see SECTION_FIELDS).
// Before writing the new values, the section's CURRENT database values are
// captured into pending_snapshot[tabKey] — reading fresh from the database
// rather than trusting client state, since the page's own state may already
// reflect in-progress edits to fields this exact save doesn't touch. That
// snapshot is what lets the approval queue show a real before/after instead
// of "—", and what a rejection reverts the live columns back to.
export async function saveBusinessListing(businessId, listing, tabKey) {
  const current = await getBusinessListing(businessId);
  const fields = SECTION_FIELDS[tabKey] ?? [];
  const snapshot = {};
  for (const f of fields) snapshot[f] = current[f] ?? null;

  const { error } = await supabase
    .from("business_listings")
    .update({
      ...toRow(listing),
      pending_snapshot: { ...(current.pendingSnapshot ?? {}), [tabKey]: snapshot },
      edited_by: { ...(current.editedBy ?? {}), [tabKey]: "business" },
    })
    .eq("business_id", businessId);
  if (error) throw error;
  await logActivity(businessId, {
    action: "listing.submitted",
    entityType: "listing", entityId: businessId,
    title: SECTION_LABELS[tabKey] ?? tabKey,
  });
}
