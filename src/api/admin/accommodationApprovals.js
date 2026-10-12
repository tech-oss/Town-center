import { supabase } from "../../lib/supabaseClient";

// Accommodation items in the approval queue, alongside the listing edits in
// approvals.js:
//
//   "New Property"     a property submitted for its first approval. It is
//                      reviewed as a whole — everything the company entered —
//                      and approving puts it live. Decided by
//                      accommodation_review_property().
//   "Company Profile"  a company's MANAGED BY details (name, logo, contact),
//                      shown on every one of its property pages. Decided by
//                      accommodation_review_company_profile().
//
// Both functions record each decision in approval_actions, which is where
// the queue's Approved / Rejected history for these items comes from.
//
// Queue item ids (they survive a refresh and a URL):
//   property::<property id>     waiting for a decision
//   company::<company id>       waiting for a decision
//   decision::<approval_actions id>   a past decision, for the history tabs

const PROPERTY = "property::";
const COMPANY = "company::";
const DECISION = "decision::";

export const isAccommodationItemId = (id) =>
  id.startsWith(PROPERTY) || id.startsWith(COMPANY) || id.startsWith(DECISION);

const TYPE = { property: "New Property", company_profile: "Company Profile" };

async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

const chunksOf = (list, n) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

async function namesOf(ids) {
  const map = {};
  for (const chunk of chunksOf([...new Set(ids.filter(Boolean))], 100)) {
    for (const b of await rows(supabase.from("businesses").select("id, name, parent_id, kind").in("id", chunk))) map[b.id] = b;
  }
  return map;
}

// The person who runs each company — the queue shows who submitted.
async function ownersOf(companyIds) {
  const map = {};
  for (const chunk of chunksOf([...new Set(companyIds.filter(Boolean))], 100)) {
    for (const u of await rows(supabase.from("business_users").select("business_id, role, first_name, last_name, email").in("business_id", chunk))) {
      if (!map[u.business_id] || u.role === "Owner") map[u.business_id] = u;
    }
  }
  return map;
}
const personName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(" ") || u?.email || "—";

async function plansOf(companyIds) {
  const map = {};
  for (const chunk of chunksOf([...new Set(companyIds.filter(Boolean))], 100)) {
    for (const s of await rows(supabase.from("business_subscriptions").select("business_id, plan, site_tier_key").in("business_id", chunk))) map[s.business_id] = s;
  }
  return map;
}
const planLabel = (s) => (s?.plan === "premium" ? `Paid (${(s.site_tier_key ?? "").replace(/^acc-/, "") || "?"} properties)` : "Free (1 basic property)");


// ── New properties ─────────────────────────────────────────────────────────

function propertyDetail(listing, company, profile, plan) {
  return {
    plan: planLabel(plan),
    paid: plan?.plan === "premium",
    company: {
      id: company?.id,
      name: profile?.name || company?.name,
      logo: profile?.logo ?? null,
      phone: profile?.phone ?? null,
      email: profile?.email ?? null,
      website: profile?.website ?? null,
      profileStatus: profile?.approval_status ?? null,
    },
    property: {
      name: listing.name,
      tagline: listing.tagline,
      description: listing.description,
      heroImage: listing.hero_image,
      gallery: Array.isArray(listing.gallery) ? listing.gallery : [],
      address: listing.address,
      postalCode: listing.postal_code,
      lat: listing.lat,
      lng: listing.lng,
      contactSource: listing.contact_source,
      phone: listing.phone,
      email: listing.email,
      website: listing.website,
      social: listing.social ?? {},
      bookingUrl: listing.booking_url,
      checkIn: listing.check_in_time,
      checkOut: listing.check_out_time,
      earlyCheckin: !!listing.early_checkin,
      lateCheckout: !!listing.late_checkout,
      availabilityInfo: listing.availability_info,
      amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
      starRating: listing.star_rating,
      rooms: Array.isArray(listing.rooms) ? listing.rooms : [],
      faqs: Array.isArray(listing.faqs) ? listing.faqs : [],
    },
  };
}

async function loadPropertyItems(propertyIds, { status, decision } = {}) {
  if (!propertyIds.length) return {};
  const listings = [];
  for (const chunk of chunksOf(propertyIds, 100)) listings.push(...await rows(supabase.from("business_listings").select("*").in("business_id", chunk)));
  const props = await namesOf(propertyIds);
  const companyIds = Object.values(props).map((p) => p.parent_id);
  const [companies, owners, plans] = await Promise.all([namesOf(companyIds), ownersOf(companyIds), plansOf(companyIds)]);
  const profiles = {};
  for (const chunk of chunksOf([...new Set(companyIds)], 100)) {
    for (const p of await rows(supabase.from("accommodation_company_profiles").select("business_id, name, logo, phone, email, website, approval_status").in("business_id", chunk))) profiles[p.business_id] = p;
  }

  const out = {};
  for (const l of listings) {
    const prop = props[l.business_id];
    const companyId = prop?.parent_id;
    const company = companies[companyId];
    out[l.business_id] = {
      type: TYPE.property,
      business: `${l.name || prop?.name} · ${profiles[companyId]?.name || company?.name || "Unknown company"}`,
      businessId: l.business_id,
      companyId,
      submittedBy: personName(owners[companyId]),
      submittedAt: decision?.created_at ?? l.updated_at,
      status: status ?? "Pending",
      source: "business portal",
      summary: status && status !== "Pending"
        ? `New accommodation property ${status === "Approved" ? "approved" : "rejected"}.`
        : `New accommodation property from ${profiles[companyId]?.name || company?.name}, waiting for its first approval. Approving puts it live.`,
      rejectionReason: decision?.reason ?? "",
      detail: propertyDetail(l, company, profiles[companyId], plans[companyId]),
    };
  }
  return out;
}


// ── Company profiles ───────────────────────────────────────────────────────

const PROFILE_FIELDS = [
  ["name", "Company name"],
  ["logo", "Logo", "image"],
  ["address", "Address"],
  ["postal_code", "Postcode"],
  ["phone", "Telephone"],
  ["email", "Email"],
  ["website", "Website"],
  ["social", "Social links"],
];

function describe(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "object") {
    const lines = Object.entries(v).filter(([, x]) => x).map(([k, x]) => `${k[0].toUpperCase()}${k.slice(1)}: ${x}`);
    return lines.length ? lines.join("\n") : "—";
  }
  return String(v);
}

function profileChanges(profile) {
  const hasLive = PROFILE_FIELDS.some(([f]) => profile[f] != null && profile[f] !== "" && !(f === "social" && !Object.keys(profile[f] ?? {}).length));
  const after = profile.pending ?? {};
  return PROFILE_FIELDS.map(([f, label, kind]) => {
    const before = profile[f] ?? null;
    const next = after[f] ?? null;
    return {
      field: label,
      kind: kind ?? "text",
      before: kind === "image" ? before : describe(before),
      after: kind === "image" ? next : describe(next),
      hasBefore: hasLive,
      changed: JSON.stringify(before ?? null) !== JSON.stringify(next ?? null) && !(describe(before) === "—" && describe(next) === "—"),
    };
  });
}

async function loadCompanyItems(companyIds, { status, decision } = {}) {
  if (!companyIds.length) return {};
  const profiles = [];
  for (const chunk of chunksOf(companyIds, 100)) profiles.push(...await rows(supabase.from("accommodation_company_profiles").select("*").in("business_id", chunk)));
  const [companies, owners] = await Promise.all([namesOf(companyIds), ownersOf(companyIds)]);
  const out = {};
  for (const p of profiles) {
    out[p.business_id] = {
      type: TYPE.company_profile,
      business: p.pending?.name || p.name || companies[p.business_id]?.name,
      businessId: p.business_id,
      companyId: p.business_id,
      submittedBy: personName(owners[p.business_id]),
      submittedAt: decision?.created_at ?? p.submitted_at ?? p.updated_at,
      status: status ?? "Pending",
      source: "business portal",
      summary: status && status !== "Pending"
        ? `Accommodation company details ${status === "Approved" ? "approved" : "rejected"}.`
        : "An accommodation company's MANAGED BY details, shown on every one of its property pages.",
      rejectionReason: decision?.reason ?? "",
      detail: {
        section: "Company profile",
        category: "Accommodation company",
        // While waiting, the submission against what's live now. Once decided,
        // there's no submission left to compare, so just what's live.
        changes: p.approval_status === "Pending Approval" ? profileChanges(p) : profileChanges({ ...p, pending: Object.fromEntries(PROFILE_FIELDS.map(([f]) => [f, p[f]])) }),
        currentListing: { name: p.name || companies[p.business_id]?.name, address: p.address, phone: p.phone, image: p.logo },
      },
    };
  }
  return out;
}


// ── The queue ──────────────────────────────────────────────────────────────

export async function getAccommodationApprovals() {
  const [pendingProps, pendingProfiles, decisions] = await Promise.all([
    rows(supabase.from("businesses").select("id").eq("kind", "accommodation_property").eq("property_state", "pending")),
    rows(supabase.from("accommodation_company_profiles").select("business_id").eq("approval_status", "Pending Approval")),
    rows(supabase.from("approval_actions").select("*").in("entity_type", ["property", "company_profile"]).order("created_at", { ascending: false }).limit(300)),
  ]);

  const [propItems, profileItems] = await Promise.all([
    loadPropertyItems(pendingProps.map((p) => p.id)),
    loadCompanyItems(pendingProfiles.map((p) => p.business_id)),
  ]);
  const items = [
    ...Object.entries(propItems).map(([pid, item]) => ({ ...item, id: PROPERTY + pid })),
    ...Object.entries(profileItems).map(([cid, item]) => ({ ...item, id: COMPANY + cid })),
  ];

  // Past decisions, for the Approved / Rejected tabs. A deleted property's
  // decisions went with it (approval_actions cascades from the company, but
  // the property itself is gone), so those are left out.
  const propertyDecisions = decisions.filter((d) => d.entity_type === "property");
  const profileDecisions = decisions.filter((d) => d.entity_type === "company_profile");
  const [decidedProps, decidedProfiles] = await Promise.all([
    loadPropertyItems([...new Set(propertyDecisions.map((d) => d.entity_id))]),
    loadCompanyItems([...new Set(profileDecisions.map((d) => d.entity_id))]),
  ]);
  for (const d of decisions) {
    const base = d.entity_type === "property" ? decidedProps[d.entity_id] : decidedProfiles[d.entity_id];
    if (!base) continue;
    const status = d.action === "approve" ? "Approved" : "Rejected";
    items.push({
      ...base,
      id: DECISION + d.id,
      status,
      submittedAt: d.created_at,
      rejectionReason: d.reason ?? "",
      summary: `${base.type === TYPE.property ? "New accommodation property" : "Accommodation company details"} ${status === "Approved" ? "approved" : "rejected"}.`,
    });
  }
  return items;
}

export async function getAccommodationApprovalById(id) {
  if (id.startsWith(PROPERTY)) {
    const pid = id.slice(PROPERTY.length);
    const [state] = await rows(supabase.from("businesses").select("property_state").eq("id", pid));
    const item = (await loadPropertyItems([pid], { status: state?.property_state === "pending" ? "Pending" : state?.property_state === "rejected" ? "Rejected" : "Approved" }))[pid];
    return item ? { ...item, id } : null;
  }
  if (id.startsWith(COMPANY)) {
    const cid = id.slice(COMPANY.length);
    const [p] = await rows(supabase.from("accommodation_company_profiles").select("approval_status, rejection_reason").eq("business_id", cid));
    const status = p?.approval_status === "Pending Approval" ? "Pending" : p?.approval_status === "Changes Rejected" ? "Rejected" : "Approved";
    const item = (await loadCompanyItems([cid], { status, decision: { reason: p?.rejection_reason } }))[cid];
    return item ? { ...item, id } : null;
  }
  if (id.startsWith(DECISION)) {
    const [d] = await rows(supabase.from("approval_actions").select("*").eq("id", id.slice(DECISION.length)));
    if (!d) return null;
    const status = d.action === "approve" ? "Approved" : "Rejected";
    const loaded = d.entity_type === "property"
      ? await loadPropertyItems([d.entity_id], { status, decision: d })
      : await loadCompanyItems([d.entity_id], { status, decision: d });
    const item = loaded[d.entity_id];
    return item ? { ...item, id } : null;
  }
  return null;
}

async function call(name, args) {
  const { error } = await supabase.rpc(name, args);
  if (error) throw error;
  return { ok: true };
}

export function approveAccommodationItem(id) {
  if (id.startsWith(PROPERTY)) return call("accommodation_review_property", { p_property: id.slice(PROPERTY.length), p_approve: true });
  if (id.startsWith(COMPANY)) return call("accommodation_review_company_profile", { p_company: id.slice(COMPANY.length), p_approve: true });
  throw new Error("This decision has already been made.");
}

export function rejectAccommodationItem(id, reason) {
  if (id.startsWith(PROPERTY)) return call("accommodation_review_property", { p_property: id.slice(PROPERTY.length), p_approve: false, p_reason: reason });
  if (id.startsWith(COMPANY)) return call("accommodation_review_company_profile", { p_company: id.slice(COMPANY.length), p_approve: false, p_reason: reason });
  throw new Error("This decision has already been made.");
}

// Clears past decisions from the queue's history. Anything still waiting is
// kept — it has to be approved or rejected first.
export async function deleteAccommodationItems(ids) {
  const decisionIds = ids.filter((id) => id.startsWith(DECISION)).map((id) => id.slice(DECISION.length));
  const skipped = ids.filter((id) => !id.startsWith(DECISION));
  if (decisionIds.length) {
    const { error } = await supabase.from("approval_actions").delete().in("id", decisionIds);
    if (error) throw error;
  }
  return { deleted: decisionIds.map((d) => DECISION + d), skipped };
}
