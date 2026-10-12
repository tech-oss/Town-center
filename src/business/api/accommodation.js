import { supabase } from "../../lib/supabaseClient";

// Accommodation companies and their properties. Every change to a property's
// lifecycle (create, submit, hide, reactivate, replace, delete) goes through
// a database function that checks the caller and enforces the plan's slot
// limit — see supabase/sql/accommodation_module_2026_10.sql on the
// admin-panel branch. Nothing here writes businesses.property_state itself.

// Database errors arrive as Postgres messages; the slot-limit one carries a
// code word so it can be told apart and offered an upgrade.
export function readableError(error) {
  const message = String(error?.message ?? error ?? "Something went wrong.");
  if (message.includes("PROPERTY_LIMIT")) {
    return { limit: true, message: message.replace(/^PROPERTY_LIMIT:\s*/, "").replace(/^./, (c) => c.toUpperCase()) + " Upgrade your plan, or hide or delete another property first." };
  }
  return { limit: false, message };
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data;
}

// Every property the company has (replaced ones left out), each with the
// listing details the My Properties cards show.
export async function listProperties(companyId) {
  const { data: rows, error } = await supabase
    .from("businesses")
    .select("id, name, property_state, replaces_id, submitted_at")
    .eq("parent_id", companyId)
    .neq("property_state", "archived")
    .order("submitted_at", { ascending: true });
  if (error) throw error;
  if (!rows?.length) return [];

  const { data: listings, error: listingError } = await supabase
    .from("business_listings")
    .select("business_id, name, address, postal_code, hero_image, rejection_reason, updated_at")
    .in("business_id", rows.map((r) => r.id));
  if (listingError) throw listingError;
  const byId = Object.fromEntries((listings ?? []).map((l) => [l.business_id, l]));

  return rows.map((r) => {
    const l = byId[r.id] ?? {};
    return {
      id: r.id,
      name: l.name || r.name,
      state: r.property_state,
      address: [l.address, l.postal_code].filter(Boolean).join(", "),
      heroImage: l.hero_image ?? null,
      rejectionReason: l.rejection_reason?.property ?? null,
      updatedAt: l.updated_at ?? r.submitted_at,
    };
  });
}

export async function getProperty(propertyId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, property_state, parent_id, replaces_id")
    .eq("id", propertyId)
    .eq("kind", "accommodation_property")
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, name: data.name, state: data.property_state, companyId: data.parent_id, replacesId: data.replaces_id } : null;
}

// { tier, limit, used, article_allowance }
export async function getSlotUsage(companyId) {
  return rpc("accommodation_slot_usage", { p_company: companyId });
}

export async function listTiers() {
  const { data, error } = await supabase
    .from("accommodation_plan_tiers")
    .select("key, name, max_properties, article_allowance, monthly_price, yearly_price, sort_order, active")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export const createProperty = (companyId, name) =>
  rpc("accommodation_create_property", { p_company: companyId, p_name: name });
export const submitProperty = (propertyId) =>
  rpc("accommodation_submit_property", { p_property: propertyId });
export const setPropertyHidden = (propertyId, hidden) =>
  rpc("accommodation_set_property_hidden", { p_property: propertyId, p_hidden: hidden });
export const reactivateProperty = (propertyId) =>
  rpc("accommodation_reactivate_property", { p_property: propertyId });
// Returns the id of the new draft that takes the old one's place.
export const replaceProperty = (propertyId, newName) =>
  rpc("accommodation_replace_property", { p_property: propertyId, p_new_name: newName });
export const deleteProperty = (propertyId) =>
  rpc("accommodation_delete_property", { p_property: propertyId });


// ── Company profile (the MANAGED BY details) ───────────────────────────────
// What's live, plus any submission waiting on admin. The form edits the
// submission when there is one, so a rejected change can be corrected
// rather than retyped.

const PROFILE_FIELDS = ["name", "logo", "address", "postal_code", "phone", "email", "website", "social"];

export async function getCompanyProfile(companyId) {
  const { data, error } = await supabase
    .from("accommodation_company_profiles")
    .select("*")
    .eq("business_id", companyId)
    .maybeSingle();
  if (error) throw error;
  const live = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, data?.[f] ?? (f === "social" ? {} : "")]));
  return {
    exists: !!data,
    live,
    pending: data?.pending ?? null,
    status: data?.approval_status ?? null,
    rejectionReason: data?.rejection_reason ?? null,
    submittedAt: data?.submitted_at ?? null,
  };
}

// The details the company typed in at registration — only ever used to
// pre-fill the form; nothing becomes public until submitted and approved.
export async function getRegistrationDetails(companyId) {
  const { data } = await supabase
    .from("business_listings")
    .select("name, address, phone, email, website")
    .eq("business_id", companyId)
    .maybeSingle();
  return data ?? {};
}

export const submitCompanyProfile = (companyId, values) =>
  rpc("accommodation_submit_company_profile", { p_company: companyId, p_values: values });
