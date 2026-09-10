import { supabase } from "../../lib/supabaseClient";

// Real, direct read/write access to business_listings for admin's own
// "Manage Business Content" editor — replacing what used to be a fully mock
// dataset (Data/adminBusinessContentMock.js) with a setTimeout fake-save.
// Nothing typed into that editor was ever persisted; a business's real
// address/phone/website/lat/lng — entered at registration and already
// sitting in this same table — never showed up here either.
//
// Field shape mirrors business-dashboard's businessListing.js exactly (same
// camelCase names) so both branches agree on what a "listing" looks like.
//
// Admin's save is a deliberate bypass: admin approving their own edit would
// be meaningless, so this writes straight to the live columns and marks
// every section it touches "Up to Date" + edited_by: "admin" in one go,
// rather than going through approval_status: "Pending Approval" the way a
// business's own save does. The approval queue shows these as "Auto
// Published" for visibility, not as a decision waiting to be made.

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

// Every section an admin save could plausibly touch, used when a business's
// full editor form is saved as one action (admin's editor isn't tabbed the
// way the business portal's is — it's one page, one Save).
const ALL_SECTIONS = Object.keys(SECTION_FIELDS);

function fromRow(row) {
  if (!row) return null;
  return {
    name: row.name ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory ?? "",
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    logo: row.logo ?? null,
    heroImage: row.hero_image ?? null,
    hours: row.hours ?? null,
    availabilityInfo: row.availability_info ?? "",
    gallery: row.gallery ?? [],
    address: row.address ?? "",
    postalCode: row.postal_code ?? "",
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    phone: row.phone ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    bookingUrl: row.booking_url ?? "",
    social: row.social ?? {},
    faqs: row.faqs ?? [],
    servicesList: row.services_list ?? [],
    areasCoveredList: row.areas_covered_list ?? [],
    amenities: row.amenities ?? [],
    otherAmenities: row.other_amenities ?? "",
    starRating: row.star_rating ?? null,
    whyChooseUs: row.why_choose_us ?? [],
    stats: row.stats ?? [],
    availabilityTag: row.availability_tag ?? "",
    businessTypeDetail: row.business_type_detail ?? {},
    approvalStatus: row.approval_status ?? {},
    hasContent: !!(row.description && row.description.trim()),
  };
}

function toRow(listing) {
  return {
    name: listing.name,
    tagline: listing.tagline || null,
    description: listing.description || null,
    logo: listing.logo,
    hero_image: listing.heroImage,
    hours: listing.hours,
    availability_info: listing.availabilityInfo || null,
    gallery: listing.gallery,
    address: listing.address || null,
    postal_code: listing.postalCode || null,
    lat: listing.lat,
    lng: listing.lng,
    phone: listing.phone || null,
    email: listing.email || null,
    website: listing.website || null,
    booking_url: listing.bookingUrl || null,
    social: listing.social,
    faqs: listing.faqs,
    services_list: listing.servicesList,
    areas_covered_list: listing.areasCoveredList,
    amenities: listing.amenities,
    other_amenities: listing.otherAmenities || null,
    star_rating: listing.starRating,
    why_choose_us: listing.whyChooseUs,
    stats: listing.stats,
    availability_tag: listing.availabilityTag || null,
    business_type_detail: listing.businessTypeDetail,
  };
}

// businesses is the source of truth admin's own "Register Business" form
// writes to (name, section/type, featured, status) — joined here so the
// content editor's left-hand list and header always agree with Business
// Registrations rather than drifting from a second copy of the same facts.
export async function getBusinessesForContent() {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, business_listings(business_type, description)")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((b) => {
    const listing = Array.isArray(b.business_listings) ? b.business_listings[0] : b.business_listings;
    return {
      id: b.id,
      name: b.name,
      section: listing?.business_type ?? null,
      hasContent: !!(listing?.description && listing.description.trim()),
    };
  });
}

export async function getBusinessListingContent(businessId) {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  return fromRow(data) ?? fromRow({});
}

export async function saveBusinessListingContent(businessId, listing) {
  const editedBy = {};
  const approvalStatus = {};
  for (const section of ALL_SECTIONS) {
    editedBy[section] = "admin";
    approvalStatus[section] = "Up to Date";
  }

  const { error } = await supabase
    .from("business_listings")
    .upsert(
      {
        business_id: businessId,
        ...toRow(listing),
        edited_by: editedBy,
        approval_status: approvalStatus,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" },
    );
  if (error) throw error;
  return { ok: true };
}
