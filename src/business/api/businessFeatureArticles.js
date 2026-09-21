import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";

// Featured Articles a business writes for itself — the longer, editorial-style
// pieces, as opposed to the short News & Offers posts in businessArticles.js.
// They need a Featured Article slot (see addonSlots.js) and admin approval
// before they reach the site. Rows live in the same feature_articles table as
// admin's own stories, told apart by author = 'business'.

function slugify(text) {
  return String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fromRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    status: r.status,
    rejectionReason: r.rejection_reason ?? "",
    submittedAt: r.submitted_at,
    // The short version, used on cards and in listings.
    cardHeading: r.card_heading ?? "",
    cardBody: r.card_body ?? "",
    cardImage: r.card_image ?? "",
    // The article itself.
    title: r.title ?? "",
    heroImage: r.hero_image ?? "",
    standfirst: r.standfirst ?? "",
    category: r.category ?? "",
    location: r.location ?? "",
    website: r.website ?? "",
    // [{ heading, text, image }] — a section of the article, each able to
    // carry its own picture.
    body: Array.isArray(r.body) ? r.body : [],
    updatedAt: r.updated_at,
  };
}

function toRow(businessId, form) {
  return {
    business_id: businessId,
    author: "business",
    slug: form.slug || `${slugify(form.cardHeading || form.title)}-${String(businessId).slice(-5)}`,
    card_heading: form.cardHeading || form.title,
    card_body: form.cardBody || form.standfirst || null,
    card_image: form.cardImage || form.heroImage || null,
    title: form.title,
    hero_image: form.heroImage || null,
    standfirst: form.standfirst || null,
    category: form.category || null,
    location: form.location || null,
    website: form.website || null,
    body: form.body ?? [],
    updated_at: new Date().toISOString(),
  };
}

export async function listFeatureArticles(businessId) {
  const { data, error } = await supabase
    .from("feature_articles")
    .select("*")
    .eq("business_id", businessId)
    .eq("author", "business")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getFeatureArticle(id) {
  const { data, error } = await supabase.from("feature_articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

// `submit` true sends it to admin; false keeps it as a draft the business can
// come back to. Editing something already live puts it back in the queue —
// nothing reaches the public site without admin seeing it.
export async function saveFeatureArticle(businessId, form, { submit = true } = {}) {
  const row = {
    ...toRow(businessId, form),
    status: submit ? "Pending Approval" : "Draft",
    rejection_reason: null,
    ...(submit ? { submitted_at: new Date().toISOString() } : {}),
  };

  const query = form.id
    ? supabase.from("feature_articles").update(row).eq("id", form.id).select().single()
    : supabase.from("feature_articles").insert(row).select().single();

  const { data, error } = await query;
  if (error) throw error;

  await logActivity(businessId, {
    action: submit ? "featured_article.submitted" : "featured_article.saved",
    entityType: "featured_article", entityId: data.id, title: data.title,
  });
  return fromRow(data);
}

// Taking it off the site without deleting it — the slot is freed for the next
// one, and the article can be sent back for approval later.
export async function setFeatureArticleStatus(id, status) {
  const { error } = await supabase
    .from("feature_articles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFeatureArticle(id) {
  const { error } = await supabase.from("feature_articles").delete().eq("id", id);
  if (error) throw error;
}

// The trigger's refusal, turned into a sentence worth reading.
export function isSlotLimitError(error) {
  const m = String(error?.message ?? "");
  return m.includes("Featured Article slot");
}
