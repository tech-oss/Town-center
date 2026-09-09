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

// Mirrored in supabase/sql/business_featured_and_unique_name.sql, which is what
// actually enforces it — this copy exists so the UI can show "7 / 10" and
// disable the control before a doomed round trip, not as the rule itself.
export const FEATURED_LIMIT = 10;

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

// Fields shown here are deliberately scoped to what the business's own 5-step
// signup form (business-dashboard's SignUpPage.jsx: Your Details → Business
// Details → Plan → Terms → Review) actually collects — not the full
// business_listings row. That row also holds content added later through the
// separate Manage Business Content editor (description, hours, gallery,
// FAQs, amenities, …), which belongs on that screen, not the registration
// approval card.
function fromRow(row) {
  const listing = one(row.business_listings);
  const users = Array.isArray(row.business_users) ? row.business_users : [row.business_users].filter(Boolean);
  // A business can have more than one Owner-role row over its lifetime (a
  // rejected/superseded signup attempt, then a real one) — prefer whichever
  // is actually approved, since that's the account that can really sign in.
  const owner = users.find((u) => u.role === "Owner" && u.status === "approved")
    ?? users.find((u) => u.role === "Owner")
    ?? users[0] ?? {};
  const subscription = one(row.business_subscriptions);
  const detail = listing.business_type_detail ?? {};
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    submitted: (row.submitted_at ?? "").slice(0, 10),
    adminNote: row.admin_note,
    rejectionNote: row.status === "Rejected" ? row.admin_note : "",
    suspendNote: row.status === "Suspended" ? row.admin_note : "",
    featured: !!row.featured,

    // ── "Business Details" step ──
    // Older listings recorded a display category ("Live & Stay"); newer ones a
    // business_type slug ("shop"). Prefer the slug the admin selects still use.
    section: listing.business_type ?? listing.category ?? "",
    // The real signup form never writes the legacy `subcategory` column at
    // all — Shop and See & Do category picks live inside business_type_detail
    // alongside every other type-specific field, same as freelancerKind etc.
    subcategories: (listing.business_type === "shop" ? detail.shopCategories : detail.seeDoCategories) ?? [],
    // The type-specific picks the signup form's step 2 branches into —
    // previously captured in the DB but never surfaced anywhere in admin.
    freelancerKind: detail.freelancerKind ?? "",
    freelancerCategories: detail.freelancerCategories ?? [],
    hotelKind: detail.hotelKind ?? "",
    cuisineTypes: detail.cuisineTypes ?? [],
    venueTypes: detail.venueTypes ?? [],
    shopCategories: detail.shopCategories ?? [],
    seeDoCategories: detail.seeDoCategories ?? [],
    website: listing.website ?? "",
    // The business's own public contact details (step 2) — distinct from the
    // owner's personal details below (step 1). Frequently different emails
    // and phone numbers.
    businessEmail: listing.email ?? "",
    businessPhone: listing.phone ?? "",
    address: listing.address ?? "",

    lat: listing.lat,
    lng: listing.lng,
    logo: listing.logo ?? null,

    // ── "Your Details" step (the owner's own account, not the business) ──
    // A business can legitimately have no owner at all: admin registers the
    // listing, and whoever runs the business claims it later from the portal.
    // `hasOwner` false is the "unclaimed" state, not missing data.
    hasOwner: !!owner.email,
    contactName: [owner.first_name, owner.last_name].filter(Boolean).join(" "),
    firstName: owner.first_name ?? "",
    lastName: owner.last_name ?? "",
    userEmail: owner.email ?? "",
    ownerPhone: owner.phone ?? "",
    ownerStatus: owner.status ?? null,
    // Kept for older call sites that read a single contact email/phone.
    email: owner.email ?? listing.email ?? "",
    phone: owner.phone ?? listing.phone ?? "",

    // ── "Plan" step ──
    // Plans are stored lowercase ("standard"); the admin UI title-cases them.
    plan: titleCase(subscription.plan) || "Free",
    // ── "Terms" step ──
    termsAcceptedAt: subscription.terms_accepted_at ?? null,

    // "Content Pending" until the owner has written an actual description —
    // that's Manage Business Content data, read here only for this one badge.
    hasContent: !!(listing.description && listing.description.trim()),
  };
}

const SELECT = `
  *,
  business_listings(*),
  business_users(role, first_name, last_name, email, phone, status),
  business_subscriptions(plan, terms_accepted_at)
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

// PostgREST maps `ilike` onto SQL ILIKE, where % and _ are wildcards — so a
// business genuinely called "50% Off" would otherwise match half the table.
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

// The two table-level rules from business_featured_and_unique_name.sql come
// back as Postgres errors, not validation results. Translate them once, here,
// so every caller gets a sentence worth showing a person.
function readableConstraintError(error, name) {
  const message = String(error?.message ?? "");
  if (error?.code === "23505" || message.includes("businesses_name_unique")) {
    return new Error(`A business called "${name}" is already registered. Business names must be unique.`);
  }
  if (message.includes("Featured limit")) {
    return new Error(`Only ${FEATURED_LIMIT} businesses can be featured at once. Un-feature one first.`);
  }
  return error;
}

// Admin registering a business on someone's behalf.
//
// The owner's login is optional. Admin can list a business with no account
// attached at all — the business then sits unclaimed until whoever runs it
// registers against it from the business portal. Passing ownerEmail creates
// the login here and now instead, already approved.
export async function registerBusiness(data) {
  const name = (data.name ?? "").trim();
  const id = data.id || `biz_${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;

  // The unique index is the real guard — this pre-check only exists so a
  // duplicate reads as a sentence rather than as a constraint violation, and
  // so a doomed registration never reaches the point of creating an Auth user.
  if (!data.id) {
    const { data: clash } = await supabase
      .from("businesses")
      .select("id, name")
      .ilike("name", escapeLike(name))
      .maybeSingle();
    if (clash) throw readableConstraintError({ code: "23505" }, name);
  }

  const businessRow = {
    id,
    name,
    featured: !!data.featured,
    // A business admin registers directly is pre-vetted by admin themselves
    // entering the data — it doesn't need to sit in its own Pending queue the
    // way a self-signup does. The owner login (below) is created already
    // approved for the same reason, so an admin-registered business with an
    // owner is immediately usable: nothing left for anyone to approve.
    ...(data.id ? {} : { status: data.status || "Approved" }),
  };
  const { error: bizError } = await supabase.from("businesses").upsert(businessRow);
  if (bizError) throw readableConstraintError(bizError, name);

  // Everything past this point can fail, and a half-written registration is
  // now worse than it used to be: the business row holds the name, and names
  // are unique, so an orphan would permanently block admin from re-registering
  // that business. There are no client-side transactions against PostgREST, so
  // this stands in for one — any failure below unwinds all three tables.
  try {
    const { error: listingError } = await supabase.from("business_listings").upsert({
      business_id: id,
      name,
      business_type: data.section || null,
      // Every type-specific pick from the signup form's Business Details step —
      // same shape the real self-serve registration writes, not a subset.
      business_type_detail: {
        freelancerKind: data.freelancerKind || null,
        freelancerCategories: data.freelancerKind ? (data.freelancerCategories ?? []) : [],
        hotelKind: data.section === "hotel" ? data.hotelKind : null,
        cuisineTypes: data.cuisineTypes ?? [],
        venueTypes: data.venueTypes ?? [],
        shopCategories: data.shopCategories ?? [],
        seeDoCategories: data.seeDoCategories ?? [],
      },
      address: data.address || null,
      // Business's own public contact details — distinct from the owner's
      // personal ones, which live on their business_users row instead.
      phone: data.businessPhone || null,
      email: data.businessEmail || null,
      website: data.website || null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      logo: data.logo ?? null,
    }, { onConflict: "business_id" });
    if (listingError) throw listingError;

    if (data.planKey) {
      const { error: subError } = await supabase.from("business_subscriptions").upsert({
        business_id: id,
        plan: data.planKey,
        // Admin registering on the business's behalf stands in for their
        // agreeing to the Terms of Use / Privacy Policy at signup.
        terms_accepted_at: new Date().toISOString(),
      }, { onConflict: "business_id" });
      if (subError) throw subError;
    }

    // The owner's login is optional — skipping it leaves the business
    // unclaimed, which is a valid end state, not an incomplete one.
    //
    // When there is one, it's a real Supabase Auth account rather than just a
    // business_users row, so they can actually sign in. That has to go through
    // an Edge Function: calling supabase.auth.signUp() straight from this
    // browser would create the account AND switch the calling admin's own
    // session over to it (this project has email confirmation off). The
    // function inserts the row already approved, so a business admin registers
    // with an owner needs no further approval from anyone.
    if (data.ownerEmail) {
      const password = data.autoPassword ? crypto.randomUUID().slice(0, 12) : data.password;
      const { data: fnResult, error: fnError } = await supabase.functions.invoke("admin-create-business", {
        body: {
          businessId: id,
          email: data.ownerEmail,
          password,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.ownerPhone || null,
          role: "Owner",
        },
      });
      if (fnError || fnResult?.error) {
        throw new Error(fnResult?.error ?? fnError.message ?? "Could not create the owner's login.");
      }
    }
  } catch (e) {
    // Only unwind a registration this call created. Editing an existing
    // business must never delete it because one field failed to save.
    if (!data.id) {
      await supabase.from("business_subscriptions").delete().eq("business_id", id);
      await supabase.from("business_listings").delete().eq("business_id", id);
      await supabase.from("businesses").delete().eq("id", id);
    }
    throw readableConstraintError(e, name);
  }

  return getBusinessById(id);
}

// Featuring is its own action rather than something admin can only choose at
// registration — the cap means it's a rota, not a one-time property, so it has
// to be toggleable from the list. The limit is enforced by a trigger; this
// just makes the refusal readable.
export async function setFeatured(id, featured) {
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();

  const { error } = await supabase.from("businesses").update({ featured }).eq("id", id);
  if (error) throw readableConstraintError(error, biz?.name ?? id);

  addLog(
    featured ? "Business Featured" : "Business Unfeatured",
    { id, name: biz?.name ?? id },
    featured ? `Promoted to the featured list (max ${FEATURED_LIMIT}).` : "Removed from the featured list.",
  );
  return { ok: true };
}

// `hasContent` is derived from the listing's description, so there is nothing
// to flip — kept so the Business Content Editor's existing call still works.
export async function markBusinessHasContent() {
  return { ok: true };
}

// Business approval and the owner's own user approval are deliberately
// independent gates — approving/rejecting/suspending a business here never
// touches business_users.status. The business portal's login (useBusinessAuth
// on business-dashboard) requires BOTH businesses.status = 'Approved' and the
// owner's own business_users.status = 'approved' before it builds a session,
// so a business being Approved with a still-Pending owner correctly still
// can't log in — admin has to approve that person separately from Users.
// (Same rule is enforced again at the database via is_approved_business_member,
// not just here — see supabase/sql/dual_gate_login.sql.)
async function setStatus(id, status, note, logLabel) {
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from("businesses")
    .update({ status, admin_note: note || null })
    .eq("id", id);
  if (error) throw error;

  addLog(logLabel, { id, name: biz?.name ?? id }, note ?? "");
  return { ok: true };
}

export function approveBusiness(id) {
  return setStatus(id, "Approved", null, "Business Approved");
}

export function rejectBusiness(id, note = "") {
  return setStatus(id, "Rejected", note, "Business Rejected");
}

export function suspendBusiness(id, note = "") {
  return setStatus(id, "Suspended", note, "Business Suspended");
}

export function reinstateBusiness(id) {
  return setStatus(id, "Approved", null, "Business Reinstated");
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
