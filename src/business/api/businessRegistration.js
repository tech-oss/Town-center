import { supabase } from "../../lib/supabaseClient";
import { SUBSCRIPTION_PLANS } from "../../Data/businessPortalMock";

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function newBusinessId(name) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `biz_${slugify(name)}-${suffix}`;
}

const ALL_TABS = ["profile", "hours", "gallery", "location", "contact", "faqs"];

// Both signUp (email) and the businesses insert (name) can fail on a
// duplicate, and both come back as terse provider/Postgres errors rather than
// something worth showing someone mid-signup.
function readableSignUpError(error) {
  const message = String(error?.message ?? "");
  if (/already registered|already exists/i.test(message)) {
    return "An account with this email already exists. Log in instead, or use a different email address.";
  }
  return message;
}

function readableBusinessNameError(error, name) {
  const message = String(error?.message ?? "");
  if (error?.code === "23505" || message.includes("businesses_name_unique")) {
    return `A business called "${name}" is already registered. If this is your business, use "Claim Your Business" from the login page instead.`;
  }
  return message;
}

export async function registerBusiness(form) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
  });
  if (signUpError) return { ok: false, error: readableSignUpError(signUpError) };

  const businessId = newBusinessId(form.businessName);
  const isHotel = form.businessType === "hotel";
  // "Freelancer & Trader" (Tradesperson/Professional/Freelancer) is the
  // Services category — stored as "services" so MyListingPage's
  // businessType === "services" checks show the Services content editor
  // (Services List, Areas Covered, Why Choose Us, Stats/Highlights).
  const listingBusinessType = form.businessType === "freelancer" ? "services" : form.businessType;

  const { error: businessError } = await supabase
    .from("businesses")
    .insert({ id: businessId, name: form.businessName });
  if (businessError) return { ok: false, error: readableBusinessNameError(businessError, form.businessName) };

  // Pending until admin approves the registration — the owner's first sign-in
  // attempt is what surfaces this to them (useBusinessAuth only builds a
  // session for an "approved" row).
  const { error: ownerError } = await supabase.from("business_users").insert({
    auth_user_id: signUpData.user.id,
    business_id: businessId,
    role: "Owner",
    status: "pending",
    requested_at: new Date().toISOString(),
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
  });
  if (ownerError) return { ok: false, error: ownerError.message };

  const approvalStatus = Object.fromEntries(ALL_TABS.map((t) => [t, "Pending Approval"]));
  const { error: listingError } = await supabase.from("business_listings").insert({
    business_id: businessId,
    name: form.businessName,
    business_type: listingBusinessType,
    business_type_detail: {
      freelancerKind: form.freelancerKind || null,
      freelancerCategories: form.freelancerKind ? form.freelancerCategories : [],
      hotelKind: isHotel ? form.hotelKind : null,
      cuisineTypes: form.cuisineTypes,
      venueTypes: form.venueTypes,
      shopCategories: form.shopCategories,
      seeDoCategories: form.seeDoCategories,
    },
    address: form.businessAddress,
    phone: form.businessPhone,
    email: form.businessEmail,
    website: form.website,
    approval_status: approvalStatus,
  });
  if (listingError) return { ok: false, error: listingError.message };

  const chosen = SUBSCRIPTION_PLANS.find((p) => p.key === form.planKey) ?? SUBSCRIPTION_PLANS[0];
  const renewalDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const { error: subError } = await supabase.from("business_subscriptions").insert({
    business_id: businessId,
    plan: chosen.key,
    plan_status: "Active",
    renewal_date: renewalDate,
    monthly_fee: chosen.price,
    is_multi_site: false,
    site_tier_key: null,
    upgrade_plan_key: "basic",
    terms_accepted_at: new Date().toISOString(),
  });
  if (subError) return { ok: false, error: subError.message };

  return { ok: true };
}
