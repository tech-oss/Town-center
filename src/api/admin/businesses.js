import { supabase } from "../../lib/supabaseClient";
import { logBusinessActivity } from "./businessActivity";
import { getLivePlacementMap, featureNow, unfeature } from "./homepageSlots";
import { planFor } from "../../Data/plans";
import { isPayingSubscription, isAdminGrantedSubscription } from "../../lib/subscriptionStatus";
import { loadClassifiedBusinesses } from "./reporting";
import { assertValidCoords } from "../../lib/geo";
import { addLog } from "./users";
import {
  BUSINESS_TYPES, VENUE_TYPES, CUISINE_TYPES, SEE_DO_CATEGORIES,
  SHOP_CATEGORIES, SERVICES_CATEGORIES, SERVICES_GROUPS,
} from "../../Data/taxonomy";

// ─── Category taxonomy ────────────────────────────────────────────────────────
// Re-exported from the canonical taxonomy (src/Data/taxonomy.js) rather than
// redeclared here. These names are the shapes admin's own screens already
// import; the lists behind them are the same ones the business portal's
// signup form and the public site's filters use.

export { SERVICES_GROUPS };

// Admin's section picker covers the public site's sections, which includes
// "live" (property listings) — not a business type anyone registers as, so it
// has no entry in BUSINESS_TYPES.
export const SECTION_OPTIONS = [
  ...BUSINESS_TYPES.filter((t) => t.value !== "freelancer" && t.value !== "hotel"),
  { value: "services", label: "Services" },
  { value: "live",     label: "Live" },
];

// Keyed by section. Eat & Drink's two pickers
// (venue + cuisine) flatten into one pool here because a listing filter
// doesn't care which of the two a category came from.
export const SUBCATEGORIES = {
  "eat-drink": [...VENUE_TYPES, ...CUISINE_TYPES],
  "see-do":    SEE_DO_CATEGORIES,
  shop:        SHOP_CATEGORIES,
  services:    SERVICES_CATEGORIES,
  live: [
    { value: "for-sale",        label: "For Sale" },
    { value: "for-rent",        label: "For Rent" },
    { value: "build-to-rent",   label: "Build to Rent" },
    { value: "new-development", label: "New Development" },
  ],
};

export const CUISINE_OPTIONS = CUISINE_TYPES;

// Legacy export kept for compatibility
export const BUSINESS_CATEGORIES = ["Eat & Drink", "See & Do", "Shop", "Live"];

export const BUSINESS_PLANS = ["Basic", "Standard", "Premium", "Agent"];

// Mirrored in supabase/sql/business_featured_and_unique_name.sql, which is what
// actually enforces it — this copy exists so the UI can show "7 / 10" and
// disable the control before a doomed round trip, not as the rule itself.
export const FEATURED_LIMIT = 10;

// The featured limit applies per business type. Freelancers share the
// Services listing pages, so they share its slots.
export const FEATURED_GROUP_LABELS = {
  "eat-drink": "Eat & Drink", "see-do": "See & Do", shop: "Shop", services: "Services", hotel: "Hotel & Accommodation",
};
export function featuredGroup(section) {
  return section === "freelancer" ? "services" : (section || "other");
}

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
const ADDON_NAMES = {
  article: ["article slot", "article slots"],
  event: ["event slot", "event slots"],
  featured_article: ["Featured Article slot", "Featured Article slots"],
};

// How a paying plan is billed, for the badge. Empty for Free or admin-granted.
function describeBilling(sub) {
  if (!isPayingSubscription(sub)) return "";
  const yearly = sub.billing_interval === "year";
  const amount = Number(sub.price_amount ?? sub.monthly_fee ?? 0);
  const price = amount ? `£${Number.isInteger(amount) ? amount : amount.toFixed(2)}` : "";
  return [yearly ? "Annual" : "Monthly", price].filter(Boolean).join(" · ");
}

// Unexpired add-on slots, totalled per kind, with the soonest expiry.
function summariseAddOns(rows) {
  const now = Date.now();
  const byKind = {};
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r?.expires_at || new Date(r.expires_at).getTime() <= now) continue;
    const k = (byKind[r.kind] ??= { kind: r.kind, quantity: 0, expiresAt: r.expires_at });
    k.quantity += r.quantity;
    if (r.expires_at < k.expiresAt) k.expiresAt = r.expires_at;
  }
  return Object.values(byKind).map((a) => {
    const [one, many] = ADDON_NAMES[a.kind] ?? [a.kind, a.kind];
    return { ...a, label: `${a.quantity} ${a.quantity === 1 ? one : many}` };
  });
}

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
    plan: subscription.plan === "premium" ? "Visibility Plan" : (titleCase(subscription.plan) || "Free"),
    // A Visibility Plan admin gave the business, with nothing billed through
    // Stripe. This used to read true for EVERY Visibility Plan: the query
    // never loaded stripe_subscription_id, so a paying business looked
    // exactly like a comp one and was labelled "Not paying".
    planNotPaying: isAdminGrantedSubscription(subscription),
    planPaying: isPayingSubscription(subscription),
    // "Monthly · £29.99" / "Annual · £329" — the exact plan they're on.
    planBilling: describeBilling(subscription),
    planStatus: subscription.plan_status ?? null,
    planRenews: subscription.renewal_date ?? null,
    planCancelling: !!subscription.cancel_at_period_end,
    // Ad-hoc purchases that are still valid: extra article / event / featured
    // article slots. Homepage placements are added separately (withFeatured).
    addOns: summariseAddOns(row.business_addon_slots),
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
  business_subscriptions(plan, terms_accepted_at, stripe_subscription_id, cancelled, plan_status,
    billing_interval, price_amount, monthly_fee, renewal_date, cancel_at_period_end, granted_by_admin),
  business_addon_slots(kind, quantity, expires_at)
`;

// `featured` means a live Featured Business booking (see ./homepageSlots).
// `promotions` is every paid homepage booking that hasn't finished — running,
// waiting for approval or still to start — which is the other half of what a
// business can buy ad hoc.
function withFeatured(biz, live, promotions = new Map()) {
  const slot = live.get(biz.id);
  return {
    ...biz,
    featured: !!slot,
    featuredStartsAt: slot?.startsAt ?? null,
    featuredEndsAt: slot?.endsAt ?? null,
    promotions: promotions.get(biz.id) ?? [],
  };
}

const PROMOTION_NAMES = {
  spotlight: "In the Spotlight",
  featured_article: "Featured Article",
  whats_on: "What's On",
  featured_business: "Featured Business",
};

const PROMOTION_STATES = {
  awaiting_content: "choosing content",
  pending_approval: "awaiting approval",
  approved: "approved",
  rejected: "rejected",
};

// Paid homepage bookings still running or to come, grouped by business.
async function loadPromotions() {
  const { data, error } = await supabase
    .from("homepage_placements")
    .select("business_id, slot_type, status, starts_at, ends_at")
    .not("paid_at", "is", null)
    .not("status", "in", "(held,cancelled)")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) return new Map();
  const now = Date.now();
  const byBusiness = new Map();
  for (const p of data ?? []) {
    if (!p.business_id) continue;
    const live = p.status === "approved" && new Date(p.starts_at).getTime() <= now;
    const list = byBusiness.get(p.business_id) ?? [];
    list.push({
      slotType: p.slot_type,
      label: `Homepage ${PROMOTION_NAMES[p.slot_type] ?? p.slot_type}`,
      state: live ? "live now" : (PROMOTION_STATES[p.status] ?? p.status),
      live,
      startsAt: p.starts_at,
      endsAt: p.ends_at,
    });
    byBusiness.set(p.business_id, list);
  }
  return byBusiness;
}

export async function getBusinesses({ status } = {}) {
  let q = supabase.from("businesses").select(SELECT).order("submitted_at", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const [{ data, error }, live, promotions] = await Promise.all([q, getLivePlacementMap("featured_business"), loadPromotions()]);
  if (error) throw error;
  return (data ?? []).map((row) => withFeatured(fromRow(row), live, promotions));
}

export async function getBusinessById(id) {
  const [{ data, error }, live, promotions] = await Promise.all([
    supabase.from("businesses").select(SELECT).eq("id", id).maybeSingle(),
    getLivePlacementMap("featured_business"),
    loadPromotions(),
  ]);
  if (error) throw error;
  return data ? withFeatured(fromRow(data), live, promotions) : null;
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
    return new Error(`Only ${FEATURED_LIMIT} businesses of this type can be featured at once. Un-feature one first.`);
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
  assertValidCoords(data.lat, data.lng);
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

    // Featured is a Featured Business booking, made once the listing (and so
    // the business type its slots are counted by) exists.
    const featuredNow = (await getLivePlacementMap("featured_business")).has(id);
    if (!!data.featured !== featuredNow) await setFeatured(id, !!data.featured);

    // Every business gets a plan — Free unless admin chose Premium.
    const plan = planFor(data.planKey);
    const { error: subError } = await supabase.from("business_subscriptions").upsert({
      business_id: id,
      plan: plan.key,
      plan_status: "Active",
      // Admin choosing the Visibility Plan gives it away: nothing is billed,
      // so it's recorded at £0 and flagged, keeping revenue figures honest.
      monthly_fee: 0,
      granted_by_admin: plan.key === "premium" ? "full" : null,
      granted_at: plan.key === "premium" ? new Date().toISOString() : null,
      renewal_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      upgrade_plan_key: plan.key,
      // Admin registering on the business's behalf stands in for their
      // agreeing to the Terms of Use / Privacy Policy at signup.
      terms_accepted_at: new Date().toISOString(),
    }, { onConflict: "business_id" });
    if (subError) throw subError;

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

  // A Featured Business booking from now for the slot's normal length; its
  // dates can be changed in Homepage Slots.
  if (featured) {
    const res = await featureNow("featured_business", "business", id);
    if (res.full) throw new Error(`Only ${FEATURED_LIMIT} businesses of this type can be featured at once. Un-feature one first, or book a later start in Homepage Slots.`);
  } else {
    await unfeature("featured_business", id);
  }

  addLog(
    featured ? "Business Featured" : "Business Unfeatured",
    { id, name: biz?.name ?? id },
    featured ? `Promoted to the featured list (max ${FEATURED_LIMIT} per business type).` : "Removed from the featured list.",
  );
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
  // Mirrored onto the business's own activity feed so the owner sees the
  // decision on their dashboard, not only in admin's audit log.
  const ACTIVITY = {
    "Business Approved": "business.approved",
    "Business Rejected": "business.rejected",
    "Business Suspended": "business.suspended",
    "Business Reinstated": "business.reinstated",
  };
  if (ACTIVITY[logLabel]) {
    await logBusinessActivity(id, { action: ACTIVITY[logLabel], entityType: "business", entityId: id, title: biz?.name ?? id, detail: note || null });
  }
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
  // Paying / admin-granted / free come from the same classification every
  // other dashboard figure uses, so the Business Profiles card, Plan
  // Distribution and Platform Overview always add up to the same totals.
  const [businesses, ownersRes] = await Promise.all([
    loadClassifiedBusinesses(),
    supabase.from("business_users").select("business_id").eq("role", "Owner").eq("status", "approved"),
  ]);
  if (ownersRes.error) throw ownersRes.error;

  const claimedIds = new Set((ownersRes.data ?? []).map((r) => r.business_id));
  const total = businesses.length;
  const claimed = businesses.filter((b) => claimedIds.has(b.id)).length;
  const tally = (bucket) => businesses.filter((b) => b.bucket === bucket).length;

  return {
    total,
    claimed,
    unclaimed: total - claimed,
    paid: tally("paying"),
    adminGranted: tally("granted"),
    free: tally("free"),
  };
}


// Saves a business's logo straight onto its listing. The public site only
// shows it while the business is on the Visibility Plan.
export async function setBusinessLogo(id, url) {
  const { error } = await supabase
    .from("business_listings")
    .update({ logo: url || null, updated_at: new Date().toISOString() })
    .eq("business_id", id);
  if (error) throw error;
  const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();
  addLog("Logo Updated", { id, name: biz?.name ?? id }, url ? "New logo uploaded" : "Logo removed");
}

// Moves a business between Free and Premium. Admin can do this at any time —
// a comp upgrade, a lapsed payment, or correcting a registration — and the
// business's editors and public page follow the new plan immediately.
export async function setBusinessPlan(id, planKey) {
  const plan = planFor(planKey);

  // A business paying through Stripe is on Premium because Stripe says so;
  // dropping it to Free here would leave Stripe still charging it, and the next
  // renewal would put it straight back. That has to be cancelled in Stripe.
  const { data: current } = await supabase
    .from("business_subscriptions").select("stripe_subscription_id, plan").eq("business_id", id).maybeSingle();
  const payingThroughStripe = !!current?.stripe_subscription_id && current.plan === "premium";
  if (payingThroughStripe) {
    if (plan.key === "free") {
      throw new Error("This business pays for the Visibility Plan through Stripe. Cancel the subscription in the Stripe dashboard — the plan will switch to Free automatically.");
    }
    return { ok: true, plan: plan.name }; // already paying for it; nothing to change
  }

  const { error } = await supabase.from("business_subscriptions").upsert({
    business_id: id,
    plan: plan.key,
    plan_status: "Active",
    // Given by admin, not bought: £0 and flagged so reports don't count it as revenue.
    monthly_fee: 0,
    granted_by_admin: plan.key === "premium" ? "full" : null,
    granted_at: plan.key === "premium" ? new Date().toISOString() : null,
    upgrade_plan_key: plan.key,
    renewal_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  }, { onConflict: "business_id" });
  if (error) throw error;

  const { data: biz } = await supabase.from("businesses").select("name").eq("id", id).maybeSingle();
  addLog("Plan Changed", { id, name: biz?.name ?? id }, `Now on ${plan.name}`);
  await logBusinessActivity(id, { action: "subscription.changed", entityType: "subscription", entityId: id, title: plan.name });
  return { ok: true, plan: plan.name };
}
