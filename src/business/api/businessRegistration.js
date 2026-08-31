import { supabase } from "../../lib/supabaseClient";
import { SUBSCRIPTION_PLANS, HOTEL_SITE_TIERS, ACCOMMODATION_TIERS } from "../../Data/businessPortalMock";

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function newBusinessId(name) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `biz_${slugify(name)}-${suffix}`;
}

const ALL_TABS = ["profile", "hours", "gallery", "location", "contact", "faqs"];

export async function registerBusiness(form) {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
  });
  if (signUpError) return { ok: false, error: signUpError.message };

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
  if (businessError) return { ok: false, error: businessError.message };

  const { error: ownerError } = await supabase.from("business_users").insert({
    auth_user_id: signUpData.user.id,
    business_id: businessId,
    role: "Owner",
    status: "approved",
    approved_at: new Date().toISOString(),
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
  });
  if (ownerError) return { ok: false, error: ownerError.message };

  const approvalStatus = Object.fromEntries(ALL_TABS.map((t) => [t, "Pending Approval"]));
  const { error: listingError } = await supabase.from("business_listings").insert({
    business_id: businessId,
    name: form.businessName,
    business_type: listingBusinessType,
    business_type_detail: {
      freelancerKind: form.freelancerKind || null,
      hotelKind: isHotel ? form.hotelKind : null,
      cuisineTypes: form.cuisineTypes,
      venueTypes: form.venueTypes,
      shopCategories: form.shopCategories,
    },
    address: form.businessAddress,
    phone: form.businessPhone,
    email: form.businessEmail,
    website: form.website,
    approval_status: approvalStatus,
  });
  if (listingError) return { ok: false, error: listingError.message };

  let plan, monthlyFee, siteTierKey = null;
  if (isHotel) {
    const tiers = form.hotelKind === "hotel" ? HOTEL_SITE_TIERS : ACCOMMODATION_TIERS;
    const tier = tiers.find((t) => t.key === form.siteTierKey) ?? tiers[0];
    plan = `hotel-${tier.key}`;
    monthlyFee = tier.price;
    siteTierKey = tier.key;
  } else {
    const chosen = SUBSCRIPTION_PLANS.find((p) => p.key === form.planKey) ?? SUBSCRIPTION_PLANS[0];
    plan = chosen.key;
    monthlyFee = chosen.price;
  }

  const renewalDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const { error: subError } = await supabase.from("business_subscriptions").insert({
    business_id: businessId,
    plan,
    plan_status: "Active",
    renewal_date: renewalDate,
    monthly_fee: monthlyFee,
    is_multi_site: isHotel,
    site_tier_key: siteTierKey,
    upgrade_plan_key: "basic",
    terms_accepted_at: new Date().toISOString(),
  });
  if (subError) return { ok: false, error: subError.message };

  return { ok: true };
}
