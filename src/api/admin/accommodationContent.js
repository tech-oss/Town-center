import { supabase } from "../../lib/supabaseClient";

// Admin's content editor for an accommodation company: its company profile
// (the MANAGED BY details on every property page) and its properties.
//
// Admin's own edits don't go through approval, the same as every other
// business admin edits: the profile is saved straight onto the live
// details, and a property admin adds or publishes goes live at once. The
// property steps use the same database functions the business portal does
// (accommodation_module_2026_10.sql), which let admin act for any company
// and still enforce the plan's property limit.

async function call(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw readable(error);
  return data;
}

// The plan-limit error carries a code word; turn it into a sentence.
function readable(error) {
  const message = String(error?.message ?? error ?? "Something went wrong.");
  if (message.includes("PROPERTY_LIMIT")) {
    return new Error(`${message.replace(/^PROPERTY_LIMIT:\s*/, "").replace(/^./, (c) => c.toUpperCase())} Change the company's plan, or hide or delete another property first.`);
  }
  return new Error(message);
}

const PROFILE_FIELDS = ["name", "logo", "address", "postal_code", "phone", "email", "website", "social"];

export async function getCompanyContent(companyId) {
  const profileQ = supabase.from("accommodation_company_profiles").select("*").eq("business_id", companyId).maybeSingle();
  const registrationQ = supabase.from("business_listings").select("name, address, postal_code, phone, email, website").eq("business_id", companyId).maybeSingle();
  const businessQ = supabase.from("businesses").select("name").eq("id", companyId).maybeSingle();
  const propertiesQ = supabase.from("businesses").select("id, name, property_state, submitted_at")
    .eq("parent_id", companyId).neq("property_state", "archived").order("submitted_at", { ascending: true });
  const usageQ = supabase.rpc("accommodation_slot_usage", { p_company: companyId });

  const profileRes = await profileQ;
  const registrationRes = await registrationQ;
  const businessRes = await businessQ;
  const propertiesRes = await propertiesQ;
  const usageRes = await usageQ;
  if (profileRes.error) throw profileRes.error;
  if (propertiesRes.error) throw propertiesRes.error;

  const profile = profileRes.data;
  const registration = registrationRes.data ?? {};
  // Nothing saved yet: start from what was typed in at registration.
  const live = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, profile?.[f] ?? (f === "social" ? {} : "")]));
  if (!profile) {
    for (const f of ["name", "address", "postal_code", "phone", "email", "website"]) live[f] = registration[f] ?? "";
    if (!live.name) live.name = businessRes.data?.name ?? "";
  }

  const rows = propertiesRes.data ?? [];
  let listings = {};
  if (rows.length) {
    const { data, error } = await supabase.from("business_listings")
      .select("business_id, name, address, postal_code, hero_image, rejection_reason, updated_at")
      .in("business_id", rows.map((r) => r.id));
    if (error) throw error;
    listings = Object.fromEntries((data ?? []).map((l) => [l.business_id, l]));
  }

  return {
    profile: {
      saved: !!profile,
      values: live,
      // A change the company sent that's waiting for approval.
      pending: profile?.approval_status === "Pending Approval" ? profile.pending : null,
    },
    usage: usageRes.error ? null : usageRes.data,
    properties: rows.map((r) => {
      const l = listings[r.id] ?? {};
      return {
        id: r.id,
        name: l.name || r.name,
        state: r.property_state,
        address: [l.address, l.postal_code].filter(Boolean).join(", "),
        heroImage: l.hero_image ?? null,
        rejectionReason: l.rejection_reason?.property ?? null,
      };
    }),
  };
}

const clean = (v, max) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
};

// Saves the company's details straight onto the live profile. Anything the
// company had waiting for approval is replaced by this.
export async function saveCompanyProfile(companyId, values) {
  const name = clean(values.name, 120);
  if (!name) throw new Error("The company name is required.");
  if (String(values.logo ?? "").startsWith("data:")) throw new Error("Upload the logo rather than pasting it in.");
  const social = Object.fromEntries(Object.entries(values.social ?? {})
    .map(([k, v]) => [k, String(v ?? "").trim().slice(0, 500)]).filter(([, v]) => v));
  const now = new Date().toISOString();
  const { error } = await supabase.from("accommodation_company_profiles").upsert({
    business_id: companyId,
    name,
    logo: clean(values.logo, 1000),
    address: clean(values.address, 300),
    postal_code: clean(values.postal_code, 20),
    phone: clean(values.phone, 40),
    email: clean(values.email, 200),
    website: clean(values.website, 500),
    social,
    pending: null,
    approval_status: "Up to Date",
    rejection_reason: null,
    updated_at: now,
  }, { onConflict: "business_id" });
  if (error) throw error;
}

export const createProperty = (companyId, name) =>
  call("accommodation_create_property", { p_company: companyId, p_name: name });

// Puts a property live: a draft or rejected one is submitted and approved in
// one go (its name and address are needed, and the plan must have room).
export async function publishProperty(propertyId, state) {
  if (state === "draft" || state === "rejected") await call("accommodation_submit_property", { p_property: propertyId });
  await call("accommodation_review_property", { p_property: propertyId, p_approve: true, p_reason: null });
}

export const setPropertyHidden = (propertyId, hidden) =>
  call("accommodation_set_property_hidden", { p_property: propertyId, p_hidden: hidden });
export const reactivateProperty = (propertyId) =>
  call("accommodation_reactivate_property", { p_property: propertyId });
export const deleteProperty = (propertyId) =>
  call("accommodation_delete_property", { p_property: propertyId });

// The company a property belongs to, and that company's plan (a property
// has no plan of its own).
export async function getPropertyCompany(propertyId) {
  const { data: p, error } = await supabase.from("businesses").select("id, name, parent_id, property_state")
    .eq("id", propertyId).maybeSingle();
  if (error) throw error;
  if (!p?.parent_id) return null;
  const { data: c } = await supabase.from("businesses").select("id, name").eq("id", p.parent_id).maybeSingle();
  const { data: sub } = await supabase.from("business_subscriptions").select("plan").eq("business_id", p.parent_id).maybeSingle();
  return { state: p.property_state, companyId: p.parent_id, companyName: c?.name ?? "", plan: sub?.plan ?? "free" };
}
