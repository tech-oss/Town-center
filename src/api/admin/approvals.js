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
  areas: "Areas Covered",
  skills: "Skills",
  workingwithme: "Working With Me",
  amenities: "Amenities",
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
    ["business_type_detail", "businessTypeDetail", "Categories"],
  ],
  hours: [["hours", "hours", "Opening Hours"], ["availability_info", "availabilityInfo", "Availability Info"]],
  gallery: [["gallery", "gallery", "Gallery Images", "gallery"]],
  location: [["address", "address", "Address"], ["postal_code", "postalCode", "Postcode"], ["lat", "lat", "Latitude"], ["lng", "lng", "Longitude"]],
  contact: [["phone", "phone", "Phone"], ["email", "email", "Email"], ["website", "website", "Website"], ["booking_url", "bookingUrl", "Booking URL"], ["social", "social", "Social Links"], ["availability_tag", "availabilityTag", "Availability Tag"]],
  faqs: [["faqs", "faqs", "FAQs"]],
  portfolio: [["portfolio", "portfolio", "Portfolio"], ["skills", "skills", "Skills"]],
  services: [["services_list", "servicesList", "Services"], ["areas_covered_list", "areasCoveredList", "Areas Covered"], ["why_choose_us", "whyChooseUs", "Why Choose Us"], ["stats", "stats", "Stats"]],
  areas: [["areas_covered_list", "areasCoveredList", "Areas Covered"]],
  skills: [["skills", "skills", "Skills"]],
  workingwithme: [["working_with_me", "workingWithMe", "Working With Me"]],
  amenities: [["amenities", "amenities", "Amenities"], ["other_amenities", "otherAmenities", "Other Amenities"], ["star_rating", "starRating", "Star Rating"]],
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

// Writes a value out in full so admin can read exactly what the business
// entered — FAQs as Q/A pairs, social links as "Instagram: url", opening hours
// day by day — rather than a count like "2 fields".
const LABELS = { instagram: "Instagram", facebook: "Facebook", x: "X / Twitter", twitter: "X / Twitter", tiktok: "TikTok", linkedin: "LinkedIn", youtube: "YouTube" };

function describeEntry(item) {
  if (item == null) return "";
  if (typeof item !== "object") return String(item);
  const q = item.question ?? item.q;
  const a = item.answer ?? item.a;
  if (q != null || a != null) return `Q: ${q ?? ""}\nA: ${a ?? ""}`;
  if (item.day) {
    if (item.open === false) return `${item.day}: Closed`;
    return `${item.day}: ${[item.from, item.to].filter(Boolean).join(" – ") || item.time || "Open"}`;
  }
  if (item.label != null && item.value != null) return `${item.label}: ${item.value}`;
  return Object.entries(item)
    .filter(([k, v]) => k !== "id" && v != null && v !== "")
    .map(([k, v]) => `${LABELS[k] ?? k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(" · ");
}

function describe(value) {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) {
    const lines = value.map(describeEntry).filter((l) => l.trim());
    if (!lines.length) return "—";
    const faqLike = value.some((v) => v && typeof v === "object" && ("question" in v || "q" in v));
    return lines.join(faqLike ? "\n\n" : "\n");
  }
  if (typeof value === "object") {
    const lines = Object.entries(value)
      .filter(([, v]) => v != null && v !== "" && !(Array.isArray(v) && !v.length))
      .map(([k, v]) => `${LABELS[k] ?? k}: ${Array.isArray(v) ? v.map(describeEntry).join(", ") : typeof v === "object" ? describeEntry(v) : v}`);
    return lines.length ? lines.join("\n") : "—";
  }
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
      : `${SECTION_LABELS[section] ?? section} updated by the business${
          changes.some((c) => c.changed && c.hasBefore)
            ? `: ${changes.filter((c) => c.changed).map((c) => c.field).join(", ")}.`
            : "."}`,
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

// Only sections someone actually saved belong in the queue. A new business
// used to start with every section marked "Pending Approval" at signup, and
// those showed up as edits the business never made. So a section counts only
// if it was saved by the business or by admin (edited_by), and a pending one
// only if a field really changed from its snapshot.
function isRealSubmission(row, section, state) {
  const editor = row.edited_by?.[section];
  if (!editor) return false;
  if (state !== PENDING) return true;
  const snapshot = row.pending_snapshot?.[section];
  if (!snapshot) return editor === "admin";
  return (SECTION_FIELDS[section] ?? []).some(([col, camelKey]) => !sameValue(snapshot[camelKey] ?? null, row[col]));
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
      if (!isRealSubmission(row, section, state)) continue;
      items.push(toItem(named, section, state, owners[row.business_id]));
    }
  }
  return status ? items.filter((i) => i.status === status) : items;
}

// How many listing edits are waiting — for the sidebar badge, which wants a
// number and nothing else.
//
// The badge used to call getApprovals(), which selects every column of every
// listing. Two businesses store their logo as a base64 data URL in the
// database, so that query moved 2.3 MB — 95% of it those two logos — and the
// sidebar refetched it every 60 seconds on every admin page. It was the bulk
// of the project's database egress.
//
// This reads the three small decision columns for every row, then fetches the
// comparison columns only for rows that actually have something pending,
// which is normally none or a handful.
export async function countPendingApprovals() {
  const { data, error } = await supabase
    .from("business_listings")
    .select("business_id, approval_status, edited_by");
  if (error) throw error;

  // Which sections on which rows could count, before the field comparison.
  const candidates = [];
  for (const row of data ?? []) {
    for (const [section, state] of Object.entries(row.approval_status ?? {})) {
      if (state !== PENDING) continue;
      if (AUTO_PUBLISHED_SECTIONS.has(section)) continue;
      if (!row.edited_by?.[section]) continue;
      candidates.push({ businessId: row.business_id, section, editor: row.edited_by[section] });
    }
  }
  if (!candidates.length) return 0;

  // Only the columns those candidate sections compare, never the whole row.
  const ids = [...new Set(candidates.map((c) => c.businessId))];
  const cols = new Set(["business_id", "pending_snapshot"]);
  for (const c of candidates) for (const [col] of SECTION_FIELDS[c.section] ?? []) cols.add(col);

  const { data: rows, error: rowsError } = await supabase
    .from("business_listings")
    .select([...cols].join(", "))
    .in("business_id", ids);
  if (rowsError) throw rowsError;
  const byId = new Map((rows ?? []).map((r) => [r.business_id, r]));

  // The same rule getApprovals applies, so the badge and the queue agree.
  return candidates.filter(({ businessId, section, editor }) => {
    const row = byId.get(businessId);
    if (!row) return false;
    const snapshot = row.pending_snapshot?.[section];
    if (!snapshot) return editor === "admin";
    return (SECTION_FIELDS[section] ?? []).some(
      ([col, camelKey]) => !sameValue(snapshot[camelKey] ?? null, row[col])
    );
  }).length;
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

// Deleting removes a decided item (approved, rejected or admin's own edit)
// from the queue — it never approves or changes the listing itself. Items
// still waiting for a decision are skipped: approve or reject those first,
// otherwise a business's unreviewed change would just silently stay live.
// Returns { deleted: [ids], skipped: [ids] }.
export async function deleteItems(ids) {
  const bySection = new Map();
  for (const id of ids) {
    const { businessId, section } = parseId(id);
    if (!businessId || !section) continue;
    if (!bySection.has(businessId)) bySection.set(businessId, []);
    bySection.get(businessId).push({ id, section });
  }

  const deleted = [];
  const skipped = [];
  for (const [businessId, entries] of bySection) {
    const { data, error: readError } = await supabase
      .from("business_listings")
      .select("approval_status, rejection_reason, pending_snapshot")
      .eq("business_id", businessId)
      .maybeSingle();
    if (readError) throw readError;
    const approval = { ...(data?.approval_status ?? {}) };
    const reasons = { ...(data?.rejection_reason ?? {}) };
    const snapshots = { ...(data?.pending_snapshot ?? {}) };
    let changed = false;
    for (const { id, section } of entries) {
      if (approval[section] === PENDING) { skipped.push(id); continue; }
      delete approval[section];
      delete reasons[section];
      delete snapshots[section];
      deleted.push(id);
      changed = true;
    }
    if (!changed) continue;
    const { error } = await supabase
      .from("business_listings")
      .update({ approval_status: approval, rejection_reason: reasons, pending_snapshot: snapshots })
      .eq("business_id", businessId);
    if (error) throw error;
  }
  return { deleted, skipped };
}
