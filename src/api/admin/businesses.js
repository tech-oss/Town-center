import { supabase } from "../../lib/supabaseClient";
import { addLog } from "./users";

// ─── Category taxonomy (mirrors client site) ──────────────────────────────────
export const SECTION_OPTIONS = [
  { value: "eat-drink", label: "Eat & Drink" },
  { value: "see-do",    label: "See & Do" },
  { value: "shop",      label: "Shop" },
  { value: "services",  label: "Services" },
  { value: "live",      label: "Live" },
];

export const SUBCATEGORIES = {
  "eat-drink": [
    { value: "bars",           label: "Bars" },
    { value: "restaurants",    label: "Restaurants" },
    { value: "cafes",          label: "Cafés" },
    { value: "grab-go",        label: "Grab & Go" },
    { value: "private-dining", label: "Private Dining" },
  ],
  "see-do": [
    { value: "art-culture",    label: "Art & Culture" },
    { value: "community",      label: "Community" },
    { value: "family",         label: "Family" },
    { value: "fashion-beauty", label: "Fashion & Beauty" },
    { value: "film",           label: "Film" },
    { value: "gaming",         label: "Gaming" },
    { value: "learning",       label: "Learning" },
    { value: "sport-wellness", label: "Sport & Wellness" },
  ],
  "shop": [
    { value: "accessories-jewellery", label: "Accessories & Jewellery",  group: "Shops" },
    { value: "clothing",              label: "Clothing",                  group: "Shops" },
    { value: "electronics-phones",    label: "Electronics & Phones",      group: "Shops" },
    { value: "groceries",             label: "Groceries",                 group: "Shops" },
    { value: "health-beauty",         label: "Health & Beauty",           group: "Shops" },
    { value: "home-furniture",        label: "Home & Furniture",          group: "Shops" },
    { value: "shoes-footwear",        label: "Shoes & Footwear",          group: "Shops" },
    { value: "sports-fitness",        label: "Sports & Fitness",          group: "Shops" },
    { value: "banks",                 label: "Banks & Foreign Exchange",  group: "Services" },
    { value: "childcare",             label: "Childcare",                 group: "Services" },
    { value: "dry-cleaning",          label: "Dry Cleaning & Shoe Repair",group: "Services" },
    { value: "hairdressing",          label: "Hairdressing & Beauty",     group: "Services" },
    { value: "healthcare",            label: "Healthcare",                group: "Services" },
    { value: "opticians",             label: "Opticians & Pharmacies",    group: "Services" },
    { value: "spa",                   label: "Spa",                       group: "Services" },
    { value: "travel-agents",         label: "Travel Agents",             group: "Services" },
  ],
  "live": [
    { value: "for-sale",         label: "For Sale" },
    { value: "for-rent",         label: "For Rent" },
    { value: "build-to-rent",    label: "Build to Rent" },
    { value: "new-development",  label: "New Development" },
  ],
  "services": [
    { value: "builders",             label: "Builders",                    group: "Tradespeople" },
    { value: "electricians",         label: "Electricians",                group: "Tradespeople" },
    { value: "plumbers",             label: "Plumbers & Heating",          group: "Tradespeople" },
    { value: "decorators-painters",  label: "Decorators & Painters",       group: "Tradespeople" },
    { value: "locksmiths",           label: "Locksmiths",                  group: "Tradespeople" },
    { value: "cleaners",             label: "Cleaners",                    group: "Tradespeople" },
    { value: "accountants",          label: "Accountants",                 group: "Professionals" },
    { value: "solicitors",           label: "Solicitors",                  group: "Professionals" },
    { value: "financial-advisers",   label: "Financial Advisers",          group: "Professionals" },
    { value: "estate-agents",        label: "Estate Agents",               group: "Professionals" },
    { value: "recruitment",          label: "Recruitment",                 group: "Professionals" },
    { value: "insurance-brokers",    label: "Insurance Brokers",           group: "Professionals" },
    { value: "graphic-designers",    label: "Graphic Designers",           group: "Freelancers" },
    { value: "web-developers",       label: "Web Developers",              group: "Freelancers" },
    { value: "photographers",        label: "Photographers",               group: "Freelancers" },
    { value: "copywriters",          label: "Copywriters & Content Writers", group: "Freelancers" },
    { value: "marketing-consultants",label: "Marketing Consultants",       group: "Freelancers" },
    { value: "personal-trainers",    label: "Personal Trainers",           group: "Freelancers" },
    { value: "tutors",               label: "Tutors",                      group: "Freelancers" },
    { value: "virtual-assistants",   label: "Virtual Assistants",          group: "Freelancers" },
  ],
};

// Services groups, in display order — mirrors the public /services page's
// three columns (Tradesperson, Professionals, Freelancers).
export const SERVICES_GROUPS = ["Tradespeople", "Professionals", "Freelancers"];

export const CUISINE_OPTIONS = [
  { value: "british",  label: "British" },
  { value: "italian",  label: "Italian" },
  { value: "chinese",  label: "Chinese" },
  { value: "indian",   label: "Indian" },
  { value: "french",   label: "French" },
  { value: "thai",     label: "Thai" },
  { value: "japanese", label: "Japanese" },
  { value: "bakery",   label: "Bakery" },
  { value: "american", label: "American" },
  { value: "mexican",  label: "Mexican" },
  { value: "spanish",  label: "Spanish" },
  { value: "greek",    label: "Greek" },
  { value: "turkish",  label: "Turkish" },
  { value: "lebanese", label: "Lebanese" },
];

export const BUSINESS_PLANS = ["Basic", "Standard", "Premium", "Agent"];

// Legacy export kept for compatibility
export const BUSINESS_CATEGORIES = [
  "Eat & Drink", "See & Do", "Shop", "Live",
];

// ─── Supabase-backed queries ──────────────────────────────────────────────────
// A "business registration" is spread across three tables: `businesses` holds
// the identity + admin approval state, `business_listings` the public-facing
// details the owner filled in, and `business_users` the owner's own account
// (whose status gates whether they can sign in at all).

// business_listings and business_subscriptions are one-per-business, so
// PostgREST embeds them as objects; business_users is one-to-many and comes
// back as an array. `one()` tolerates either shape.
function titleCase(v) {
  if (!v) return "";
  return String(v).charAt(0).toUpperCase() + String(v).slice(1).toLowerCase();
}

function one(embedded) {
  if (!embedded) return {};
  return Array.isArray(embedded) ? (embedded[0] ?? {}) : embedded;
}

function fromRow(row) {
  const listing = one(row.business_listings);
  const users = Array.isArray(row.business_users) ? row.business_users : [row.business_users].filter(Boolean);
  const owner = users.find((u) => u.role === "Owner") ?? users[0] ?? {};
  const detail = listing.business_type_detail ?? {};
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    submitted: (row.submitted_at ?? "").slice(0, 10),
    adminNote: row.admin_note,
    rejectionNote: row.status === "Rejected" ? row.admin_note : "",
    suspendNote: row.status === "Suspended" ? row.admin_note : "",
    newToMaidenhead: row.new_to_maidenhead,

    // Older listings recorded a display category ("Live & Stay"); newer ones a
    // business_type slug ("shop"). Prefer the slug the admin selects still use.
    section: listing.business_type ?? listing.category ?? "",
    // subcategory is a single text column, not an array — the admin UI works in
    // multiples, so a lone value is lifted into a one-item list.
    subcategories: Array.isArray(listing.subcategory)
      ? listing.subcategory
      : (listing.subcategory ? [listing.subcategory] : []),
    cuisines: detail.cuisineTypes ?? [],
    // Sub-choices collected at signup that the admin screen never surfaced:
    // which kind of freelancer/tradesperson/professional, which kind of
    // accommodation, and the venue/shop/see-do category picks.
    freelancerKind: detail.freelancerKind ?? "",
    freelancerCategories: detail.freelancerCategories ?? [],
    hotelKind: detail.hotelKind ?? "",
    venueTypes: detail.venueTypes ?? [],
    shopCategories: detail.shopCategories ?? [],
    seeDoCategories: detail.seeDoCategories ?? [],
    address: listing.address ?? "",
    phone: listing.phone ?? "",
    website: listing.website ?? "",
    lat: listing.lat,
    lng: listing.lng,
    logo: listing.logo ?? null,

    contactName: [owner.first_name, owner.last_name].filter(Boolean).join(" "),
    email: owner.email ?? listing.email ?? "",
    ownerStatus: owner.status ?? null,

    // Plans are stored lowercase ("standard"); the admin plan pickers are
    // title-cased.
    plan: titleCase(one(row.business_subscriptions).plan) || "Basic",
    // "Content Pending" until the owner has written an actual description.
    hasContent: !!(listing.description && listing.description.trim()),
  };
}

const SELECT = `
  *,
  business_listings(*),
  business_users(role, first_name, last_name, email, status),
  business_subscriptions(plan)
`;

export async function getBusinesses({ status } = {}) {
  let q = supabase.from("businesses").select(SELECT).order("submitted_at", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getBusinessById(id) {
  const { data, error } = await supabase.from("businesses").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Admin registering a business on someone's behalf. This creates the business
// and its listing only — the owner's login is invited separately (creating an
// Auth user needs the service-role key, which the browser must never hold).
export async function registerBusiness(data) {
  const id = data.id || `biz_${slugify(data.name)}-${Math.random().toString(36).slice(2, 7)}`;

  const businessRow = {
    id,
    name: data.name,
    new_to_maidenhead: !!data.newToMaidenhead,
    ...(data.id ? {} : { status: data.status || "Pending" }),
  };
  const { error: bizError } = await supabase.from("businesses").upsert(businessRow);
  if (bizError) throw bizError;

  const { error: listingError } = await supabase.from("business_listings").upsert({
    business_id: id,
    name: data.name,
    business_type: data.section || null,
    subcategory: data.subcategories ?? [],
    business_type_detail: { cuisineTypes: data.cuisines ?? [] },
    address: data.address || null,
    phone: data.phone || null,
    website: data.website || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    logo: data.logo ?? null,
  }, { onConflict: "business_id" });
  if (listingError) throw listingError;

  if (data.plan) {
    await supabase.from("business_subscriptions").upsert({ business_id: id, plan: data.plan }, { onConflict: "business_id" });
  }

  return getBusinessById(id);
}

// `hasContent` is derived from the listing's description, so there is nothing
// to flip — kept so the Business Content Editor's existing call still works.
export async function markBusinessHasContent() {
  return { ok: true };
}

// Approving/suspending a registration also moves the owner's own account, so
// the decision actually takes effect at the login screen rather than being
// cosmetic in the admin table.
async function setStatus(id, status, note, ownerStatus, logLabel) {
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("businesses")
    .update({ status, admin_note: note || null })
    .eq("id", id);
  if (error) throw error;

  if (ownerStatus) {
    await supabase.from("business_users").update({ status: ownerStatus }).eq("business_id", id);
  }
  addLog(logLabel, { id, name: biz?.name ?? id }, note ?? "");
  return { ok: true };
}

export function approveBusiness(id) {
  return setStatus(id, "Approved", null, "approved", "Business Approved");
}

export function rejectBusiness(id, note = "") {
  return setStatus(id, "Rejected", note, "rejected", "Business Rejected");
}

export function suspendBusiness(id, note = "") {
  return setStatus(id, "Suspended", note, "suspended", "Business Suspended");
}

export function reinstateBusiness(id) {
  return setStatus(id, "Approved", null, "approved", "Business Reinstated");
}

export async function deleteBusiness(id) {
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw error;
  addLog("Business Deleted", { id, name: biz?.name ?? id }, "Business listing permanently removed by admin");
  return { ok: true };
}

// ─── Dashboard stats ────────────────────────────────────────────────────────
// "Claimed" isn't a stored flag — a business is claimed the moment an owner
// signs up and is approved against it (an admin-registered business starts
// with no business_users row at all, which is exactly "unclaimed"). Computed
// here rather than stored, so it can never drift out of sync with reality.
export async function getBusinessStats() {
  const [bizRes, subsRes, ownersRes] = await Promise.all([
    supabase.from("businesses").select("id"),
    supabase.from("business_subscriptions").select("business_id, plan, monthly_fee"),
    supabase.from("business_users").select("business_id").eq("role", "Owner").eq("status", "approved"),
  ]);
  if (bizRes.error) throw bizRes.error;
  if (subsRes.error) throw subsRes.error;
  if (ownersRes.error) throw ownersRes.error;

  const claimedIds = new Set((ownersRes.data ?? []).map((r) => r.business_id));
  const paidByBusiness = new Map((subsRes.data ?? []).map((s) => [s.business_id, Number(s.monthly_fee ?? 0) > 0]));

  const total = (bizRes.data ?? []).length;
  const claimed = (bizRes.data ?? []).filter((b) => claimedIds.has(b.id)).length;
  const paid = [...paidByBusiness.values()].filter(Boolean).length;

  return {
    total,
    claimed,
    unclaimed: total - claimed,
    paid,
    free: total - paid,
  };
}
