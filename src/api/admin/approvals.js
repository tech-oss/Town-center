import { supabase } from "../../lib/supabaseClient";

// The approval queue over business listing edits.
//
// A listing is not approved as a whole — business_listings.approval_status is a
// map of section → state ("Pending Approval" | "Up to Date" | "Changes
// Rejected"), because a business can edit its opening hours without putting its
// whole page back into review. So one listing with three edited sections
// produces three queue items, each approved or rejected on its own.
//
// rejection_reason is the matching map of section → why it was turned down.

const SECTION_LABELS = {
  profile: "Profile",
  hours: "Opening Hours",
  gallery: "Gallery",
  location: "Location",
  contact: "Contact Details",
  faqs: "FAQs",
  portfolio: "Portfolio",
  services: "Services",
};

// Which listing columns belong to which editable section, so the queue can show
// what the business actually changed rather than just naming the section.
const SECTION_FIELDS = {
  profile: [["name", "Business Name"], ["tagline", "Tagline"], ["description", "Description"], ["logo", "Logo"], ["hero_image", "Header Image"]],
  hours: [["hours", "Opening Hours"], ["availability_info", "Availability Info"]],
  gallery: [["gallery", "Gallery Images"]],
  location: [["address", "Address"], ["postal_code", "Postcode"], ["lat", "Latitude"], ["lng", "Longitude"]],
  contact: [["phone", "Phone"], ["email", "Email"], ["website", "Website"], ["booking_url", "Booking URL"], ["social", "Social Links"]],
  faqs: [["faqs", "FAQs"]],
  portfolio: [["portfolio", "Portfolio"], ["skills", "Skills"]],
  services: [["services_list", "Services"], ["areas_covered_list", "Areas Covered"], ["why_choose_us", "Why Choose Us"], ["stats", "Stats"]],
};

const PENDING = "Pending Approval";
const APPROVED = "Up to Date";
const REJECTED = "Changes Rejected";

// A queue item's id has to survive a page refresh and a URL, so it's derived
// rather than stored: "<business_id>::<section>".
function makeId(businessId, section) { return `${businessId}::${section}`; }
function parseId(id) {
  const [businessId, section] = id.split("::");
  return { businessId, section };
}

function describe(value) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return `${Object.keys(value).length} field${Object.keys(value).length === 1 ? "" : "s"}`;
  return String(value);
}

function toItem(row, section, state, owner = {}) {
  const fields = SECTION_FIELDS[section] ?? [];
  return {
    id: makeId(row.business_id, section),
    type: "Listing Edit",
    section,
    business: row.name ?? row.business_id,
    businessId: row.business_id,
    submittedBy: [owner.first_name, owner.last_name].filter(Boolean).join(" ") || owner.email || "—",
    submittedAt: row.updated_at,
    status: state === PENDING ? "Pending" : state === REJECTED ? "Rejected" : "Approved",
    source: "business portal",
    summary: `${SECTION_LABELS[section] ?? section} updated by the business.`,
    rejectionReason: row.rejection_reason?.[section] ?? "",
    detail: {
      section: SECTION_LABELS[section] ?? section,
      category: row.business_type ?? "",
      // The business portal overwrites the live row in place, so there is no
      // stored "before" to diff against — show the submitted values instead.
      changes: fields.map(([col, label]) => ({
        field: label,
        before: "—",
        after: describe(row[col]),
        changed: row[col] != null && row[col] !== "",
      })),
      newImages: section === "gallery" ? (row.gallery ?? []) : [],
      currentListing: {
        name: row.name,
        address: row.address,
        phone: row.phone,
        website: row.website,
        description: row.description,
        image: row.hero_image ?? row.gallery?.[0] ?? null,
      },
    },
  };
}

// business_listings and business_users both hang off `businesses` but have no
// FK to each other, so PostgREST cannot embed one in the other — the owners are
// fetched once and joined by business_id here.
async function ownersByBusiness(ids) {
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("business_users")
    .select("business_id, role, first_name, last_name, email")
    .in("business_id", ids);
  if (error) throw error;
  const map = {};
  for (const u of data ?? []) {
    if (!map[u.business_id] || u.role === "Owner") map[u.business_id] = u;
  }
  return map;
}

export async function getApprovals({ status } = {}) {
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const owners = await ownersByBusiness((data ?? []).map((r) => r.business_id));
  const items = [];
  for (const row of data ?? []) {
    for (const [section, state] of Object.entries(row.approval_status ?? {})) {
      items.push(toItem(row, section, state, owners[row.business_id]));
    }
  }
  return status ? items.filter((i) => i.status === status) : items;
}

export async function getApprovalById(id) {
  const { businessId, section } = parseId(id);
  const { data, error } = await supabase
    .from("business_listings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const state = data.approval_status?.[section];
  if (!state) return null;
  const owners = await ownersByBusiness([businessId]);
  return toItem(data, section, state, owners[businessId]);
}

// Approval flips one key of the jsonb map, leaving the other sections' states
// untouched — read-modify-write, since Postgres can't merge a single key
// through PostgREST without a stored function.
async function setSectionState(id, state, reason) {
  const { businessId, section } = parseId(id);
  const { data, error: readError } = await supabase
    .from("business_listings")
    .select("approval_status, rejection_reason")
    .eq("business_id", businessId)
    .maybeSingle();
  if (readError) throw readError;

  const approval = { ...(data?.approval_status ?? {}), [section]: state };
  const reasons = { ...(data?.rejection_reason ?? {}) };
  if (state === REJECTED) reasons[section] = reason || null;
  else delete reasons[section];

  const { error } = await supabase
    .from("business_listings")
    .update({ approval_status: approval, rejection_reason: reasons })
    .eq("business_id", businessId);
  if (error) throw error;
  return { ok: true };
}

export function approveItem(id) {
  return setSectionState(id, APPROVED);
}

export function rejectItem(id, reason) {
  return setSectionState(id, REJECTED, reason);
}

// There is no queue row to delete — an item exists only while its section sits
// in a non-default state, so "dismissing" one marks the section up to date.
export function deleteItem(id) {
  return setSectionState(id, APPROVED);
}

export async function deleteItems(ids) {
  for (const id of ids) await setSectionState(id, APPROVED);
  return { ok: true };
}
