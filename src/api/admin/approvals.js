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
//
// pending_snapshot (map of section → {camelCaseField: old value}) is written
// by business-dashboard's saveBusinessListing right before it overwrites the
// live columns — see supabase/sql/business_content_moderation_2026_09.sql.
// That's the real "before" this file diffs against; approving clears it,
// rejecting reverts the live columns to it.
//
// edited_by (map of section → 'business' | 'admin') tells apart a business's
// own submission from admin's own direct edit through Manage Business
// Content — admin approving their own edit would be meaningless, so those
// sections are written already "Up to Date" and shown here as auto-published,
// not as something waiting on a decision.

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

// [db column, camelCase field (matches pending_snapshot's keys), display
// label, kind]. kind drives how the value renders: "image" for a single
// photo, "gallery" for an array of photos, "text" (default) for everything
// else via describe().
const SECTION_FIELDS = {
  profile: [
    ["name", "name", "Business Name"],
    ["tagline", "tagline", "Tagline"],
    ["description", "description", "Description"],
    ["logo", "logo", "Logo", "image"],
    ["hero_image", "heroImage", "Header Image", "image"],
  ],
  hours: [["hours", "hours", "Opening Hours"], ["availability_info", "availabilityInfo", "Availability Info"]],
  gallery: [["gallery", "gallery", "Gallery Images", "gallery"]],
  location: [["address", "address", "Address"], ["postal_code", "postalCode", "Postcode"], ["lat", "lat", "Latitude"], ["lng", "lng", "Longitude"]],
  contact: [["phone", "phone", "Phone"], ["email", "email", "Email"], ["website", "website", "Website"], ["booking_url", "bookingUrl", "Booking URL"], ["social", "social", "Social Links"]],
  faqs: [["faqs", "faqs", "FAQs"]],
  portfolio: [["portfolio", "portfolio", "Portfolio"], ["skills", "skills", "Skills"]],
  services: [["services_list", "servicesList", "Services"], ["areas_covered_list", "areasCoveredList", "Areas Covered"], ["why_choose_us", "whyChooseUs", "Why Choose Us"], ["stats", "stats", "Stats"]],
};

// Sections the business publishes without review — they never produce a
// queue item, even if an older row still carries a pending state for one.
// Mirrors AUTO_PUBLISH_SECTIONS in business-dashboard's businessListing.js.
const AUTO_PUBLISHED_SECTIONS = new Set(["hours"]);

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

// Deep-ish equality good enough for the plain values/arrays/objects a listing
// column ever holds (strings, numbers, arrays of strings, small plain
// objects like `social`) — used to decide whether a field actually changed.
function sameValue(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return (a ?? "") === (b ?? "");
  return JSON.stringify(a) === JSON.stringify(b);
}

function toItem(row, section, state, owner = {}) {
  const fields = SECTION_FIELDS[section] ?? [];
  const snapshot = row.pending_snapshot?.[section] ?? null;
  const editor = row.edited_by?.[section]; // 'business' | 'admin' | undefined
  const isAdminEdit = editor === "admin";

  const changes = fields.map(([col, camelKey, label, kind]) => {
    const after = row[col];
    // A snapshot only exists once a business has actually saved that section
    // at least once since this migration shipped — for admin's own edits (no
    // snapshot needed, admin IS the live value) and for rows saved before
    // this existed, "before" is unknown rather than falsely "—", so it reads
    // honestly instead of implying nothing was there.
    const before = snapshot ? snapshot[camelKey] ?? null : undefined;
    const changed = snapshot ? !sameValue(before, after) : (after != null && after !== "");
    return {
      field: label,
      kind: kind ?? "text",
      before: kind === "image" || kind === "gallery" ? before : describe(before),
      after: kind === "image" || kind === "gallery" ? after : describe(after),
      hasBefore: snapshot != null,
      changed,
    };
  });

  const ownerName = [owner.first_name, owner.last_name].filter(Boolean).join(" ") || owner.email || "—";

  return {
    id: makeId(row.business_id, section),
    type: "Listing Edit",
    section,
    business: row.name ?? row.business_id,
    businessId: row.business_id,
    submittedBy: isAdminEdit ? "Site Admin" : ownerName,
    submittedAt: row.updated_at,
    status: state === PENDING ? "Pending" : state === REJECTED ? "Rejected" : "Approved",
    // Reuses the same "source" the UI already had a real, working
    // no-action-needed treatment for (XML property imports) — admin's own
    // edits get that same treatment instead of showing Approve/Reject
    // buttons for a decision admin already made by saving it.
    source: isAdminEdit ? "admin" : "business portal",
    summary: isAdminEdit
      ? `${SECTION_LABELS[section] ?? section} published directly by admin.`
      : `${SECTION_LABELS[section] ?? section} updated by the business.`,
    rejectionReason: row.rejection_reason?.[section] ?? "",
    detail: {
      section: SECTION_LABELS[section] ?? section,
      category: row.business_type ?? "",
      changes,
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
    .select("*, businesses(name)")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const owners = await ownersByBusiness((data ?? []).map((r) => r.business_id));
  const items = [];
  for (const row of data ?? []) {
    // businesses.name is the source of truth for the business's current
    // name — business_listings.name can itself be mid-edit/pending, which
    // would otherwise make the queue's own "business" column show a name
    // that hasn't been approved yet.
    const named = { ...row, name: row.businesses?.name ?? row.name };
    for (const [section, state] of Object.entries(row.approval_status ?? {})) {
      if (AUTO_PUBLISHED_SECTIONS.has(section)) continue;
      items.push(toItem(named, section, state, owners[row.business_id]));
    }
  }
  return status ? items.filter((i) => i.status === status) : items;
}

export async function getApprovalById(id) {
  const { businessId, section } = parseId(id);
  const { data, error } = await supabase
    .from("business_listings")
    .select("*, businesses(name)")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const state = data.approval_status?.[section];
  if (!state || AUTO_PUBLISHED_SECTIONS.has(section)) return null;
  const owners = await ownersByBusiness([businessId]);
  const named = { ...data, name: data.businesses?.name ?? data.name };
  return toItem(named, section, state, owners[businessId]);
}

// Approval clears the section's snapshot (no longer needed — the live
// columns already hold the approved values) and marks it Up to Date.
async function approveSection(businessId, section) {
  const { data, error: readError } = await supabase
    .from("business_listings")
    .select("approval_status, rejection_reason, pending_snapshot")
    .eq("business_id", businessId)
    .maybeSingle();
  if (readError) throw readError;

  const approval = { ...(data?.approval_status ?? {}), [section]: APPROVED };
  const reasons = { ...(data?.rejection_reason ?? {}) };
  delete reasons[section];
  const snapshots = { ...(data?.pending_snapshot ?? {}) };
  delete snapshots[section];

  const { error } = await supabase
    .from("business_listings")
    .update({ approval_status: approval, rejection_reason: reasons, pending_snapshot: snapshots })
    .eq("business_id", businessId);
  if (error) throw error;
  return { ok: true };
}

// Rejection reverts the live columns back to the section's snapshot — a
// declined change no longer sits live indefinitely with just a status flag
// saying it shouldn't be. If no snapshot exists (nothing was ever captured
// for this section, e.g. an old row saved before this existed), there is
// nothing safe to revert to, so only the status/reason are recorded, same
// as the previous behaviour.
async function rejectSection(businessId, section, reason) {
  const { data, error: readError } = await supabase
    .from("business_listings")
    .select("approval_status, rejection_reason, pending_snapshot")
    .eq("business_id", businessId)
    .maybeSingle();
  if (readError) throw readError;

  const approval = { ...(data?.approval_status ?? {}), [section]: REJECTED };
  const reasons = { ...(data?.rejection_reason ?? {}), [section]: reason || null };
  const snapshots = { ...(data?.pending_snapshot ?? {}) };
  const snapshot = snapshots[section];
  delete snapshots[section];

  const revertPatch = {};
  if (snapshot) {
    for (const [col, camelKey] of SECTION_FIELDS[section] ?? []) {
      if (camelKey in snapshot) revertPatch[col] = snapshot[camelKey];
    }
  }

  const { error } = await supabase
    .from("business_listings")
    .update({ ...revertPatch, approval_status: approval, rejection_reason: reasons, pending_snapshot: snapshots })
    .eq("business_id", businessId);
  if (error) throw error;
  return { ok: true };
}

export function approveItem(id) {
  const { businessId, section } = parseId(id);
  return approveSection(businessId, section);
}

export function rejectItem(id, reason) {
  const { businessId, section } = parseId(id);
  return rejectSection(businessId, section, reason);
}

// There is no queue row to delete — an item exists only while its section sits
// in a non-default state, so "dismissing" one marks the section up to date.
export function deleteItem(id) {
  return approveItem(id);
}

export async function deleteItems(ids) {
  for (const id of ids) await approveItem(id);
  return { ok: true };
}
