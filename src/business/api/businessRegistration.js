import { recordAgreements } from "./agreements";
import { supabase } from "../../lib/supabaseClient";
import { checkEmail } from "../../lib/emailCheck";
import { FREE_PLAN } from "../../Data/plans";
import { signUpPending, clearPendingSignup } from "./pendingSignup";

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

// Taken already? Asked before the account is made, so a clash is caught now
// rather than after the person has confirmed their email. (No answer — the
// check isn't installed — just lets the database decide later, as before.)
async function nameTaken(name) {
  const { data, error } = await supabase.rpc("business_name_available", { p_name: name });
  return !error && data === false;
}

// Step 1, from the sign-up form: the login is made and the person is asked
// to confirm their email (pendingSignup.js). Their answers wait with the
// login; createRegisteredBusiness makes the business once they're signed in.
// Resolves { ok, confirmEmail } — confirmEmail when the email has been sent.
export async function registerBusiness(form) {
  // Checked before Supabase is asked to email it — a bounce counts against
  // the whole project's sending (lib/emailCheck).
  const emailProblem = await checkEmail(form.email);
  if (emailProblem) return { ok: false, error: emailProblem };
  if (await nameTaken(form.businessName)) {
    return { ok: false, error: readableBusinessNameError({ code: "23505" }, form.businessName) };
  }

  // Everything but the password; the id is fixed now so that making the
  // business twice (two tabs, say) finds the first one instead of a second.
  const details = Object.fromEntries(Object.entries(form)
    .filter(([k]) => !["password", "confirmPassword", "confirmFinal", "agreements"].includes(k)));
  details.accepted = form.agreements?.accepted ?? {};
  details.businessId = newBusinessId(form.businessName);

  const res = await signUpPending(form.email, form.password, "business", details);
  if (res.error) return { ok: false, error: readableSignUpError(res.error) };
  if (!res.session) return { ok: true, confirmEmail: true };

  // Email confirmation is switched off: already signed in, so make it now.
  const done = await createRegisteredBusiness(details, res.user);
  if (done.ok) await clearPendingSignup();
  return done;
}

// A row the same attempt already made (the id is fixed per registration).
const alreadyThere = (error, constraint) => error?.code === "23505" && (!constraint || String(error.message).includes(constraint));

// Step 2, signed in as the new login: the business, its owner, listing, free
// plan and the agreements ticked during sign-up.
export async function createRegisteredBusiness(form, user) {
  const businessId = form.businessId;
  const isHotel = form.businessType === "hotel";
  // An accommodation management company: its own account, which then adds
  // properties. It never appears on the public site itself (the database's
  // public view leaves companies out). See Data/accommodation.js.
  const isAccommodation = form.businessType === "accommodation";
  // "Freelancer & Trader" (Tradesperson/Professional/Freelancer) is the
  // Services category — stored as "services" so MyListingPage's
  // businessType === "services" checks show the Services content editor
  // (Services List, Areas Covered, Why Choose Us, Stats/Highlights).
  const listingBusinessType = form.businessType === "freelancer" ? "services" : form.businessType;

  const { error: businessError } = await supabase
    .from("businesses")
    .insert({ id: businessId, name: form.businessName, ...(isAccommodation ? { kind: "accommodation_company" } : {}) });
  if (businessError && !alreadyThere(businessError, "businesses_pkey")) {
    return { ok: false, error: readableBusinessNameError(businessError, form.businessName) };
  }

  // Pending until admin approves the registration — the owner's first sign-in
  // attempt is what surfaces this to them (useBusinessAuth only builds a
  // session for an "approved" row).
  const { error: ownerError } = await supabase.from("business_users").insert({
    auth_user_id: user.id,
    business_id: businessId,
    role: "Owner",
    status: "pending",
    requested_at: new Date().toISOString(),
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone,
    // Terms were accepted in the signup form itself, so no Terms & Review
    // step after approval (that's only for claims).
    onboarding_completed_at: new Date().toISOString(),
  });
  if (ownerError && !alreadyThere(ownerError)) return { ok: false, error: ownerError.message };

  // A new business is reviewed as a whole in Business Registrations, so its
  // sections start Up to Date; the approval queue only shows sections the
  // business later edits.
  const approvalStatus = Object.fromEntries(ALL_TABS.map((t) => [t, "Up to Date"]));
  const { error: listingError } = await supabase.from("business_listings").insert({
    business_id: businessId,
    name: form.businessName,
    business_type: listingBusinessType,
    business_type_detail: isAccommodation ? { accommodationRole: "company" } : {
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
  if (listingError && !alreadyThere(listingError)) return { ok: false, error: listingError.message };

  // Registration no longer sells anything: every new business starts on the
  // free listing and subscribes later from their dashboard.
  const freePlan = FREE_PLAN;
  const renewalDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const { error: subError } = await supabase.from("business_subscriptions").insert({
    business_id: businessId,
    plan: freePlan.key,
    plan_status: "Active",
    renewal_date: renewalDate,
    monthly_fee: freePlan.price,
    is_multi_site: false,
    // The company's tier decides how many properties it may have live.
    site_tier_key: isAccommodation ? "acc-free" : null,
    upgrade_plan_key: "basic",
    terms_accepted_at: new Date().toISOString(),
  });
  if (subError && !alreadyThere(subError)) return { ok: false, error: subError.message };

  // Each of the four agreements, with the moment it was ticked.
  await recordAgreements(businessId, form.email, "registration", form.accepted);
  return { ok: true };
}
