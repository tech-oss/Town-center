import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";

// business_articles: News & Offers. Drafts are unlimited; at most 3 can be
// LIVE at once. The cap is enforced by a trigger
// (supabase/sql/business_dashboard_ux_2026_09.sql) because three separate
// paths set this column — the owner promoting a draft, the owner swapping one
// in, and admin approving a submission — so a check in any one of them would
// leave the other two unguarded.
export const LIVE_ARTICLE_LIMIT = 3;

// The trigger's refusal, turned into the sentence the business should see.
export function isLiveLimitError(error) {
  return String(error?.message ?? "").includes("Live article limit reached");
}

export const LIVE_LIMIT_MESSAGE =
  `You already have ${LIVE_ARTICLE_LIMIT} articles live. Please subscribe to get it live on the site, or hide one of your live articles to make room.`;

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    date: row.date,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    thumbnail: row.thumbnail,
    heroImage: row.hero_image,
    body: row.body,
    rejectionReason: row.rejection_reason,
  };
}

// Who owns an article, for the activity log — the mutations below are
// addressed by id alone.
async function articleOwner(id) {
  const { data } = await supabase.from("business_articles").select("business_id, title").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function listArticles(businessId) {
  const { data, error } = await supabase
    .from("business_articles")
    .select("*")
    .eq("business_id", businessId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getArticle(id) {
  const { data, error } = await supabase.from("business_articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createArticle(businessId, form) {
  const { data, error } = await supabase
    .from("business_articles")
    .insert({
      business_id: businessId,
      title: form.title,
      type: form.type,
      status: form.status,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      thumbnail: form.heroImage,
      hero_image: form.heroImage,
      body: form.body,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(businessId, {
    action: form.status === "Pending Approval" ? "article.submitted" : "article.created",
    entityType: "article", entityId: data.id, title: form.title,
  });
  return fromRow(data);
}

export async function updateArticle(id, form) {
  const { error } = await supabase
    .from("business_articles")
    .update({
      title: form.title,
      type: form.type,
      status: form.status,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
      thumbnail: form.heroImage,
      hero_image: form.heroImage,
      body: form.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  const owner = await articleOwner(id);
  await logActivity(owner?.business_id, {
    action: form.status === "Pending Approval" ? "article.submitted" : "article.updated",
    entityType: "article", entityId: id, title: form.title,
  });
}

// The database itself refuses "Live" from a business unless the article was
// already Hidden (business_content_needs_approval_2026_09.sql) — from Draft
// or Rejected this call must ask for "Pending Approval" instead, or the
// trigger throws. The two branches below are what the caller uses to tell
// those apart (see handleMakeLive in ArticlesPage.jsx).
export async function setArticleStatus(id, status) {
  const owner = await articleOwner(id);
  const { error } = await supabase.from("business_articles").update({ status }).eq("id", id);
  if (error) {
    if (isLiveLimitError(error)) throw new Error(LIVE_LIMIT_MESSAGE);
    throw error;
  }
  // Only the business reaches this — admin's own approve/reject logs its own
  // entry from the admin panel.
  const action = status === "Live" ? "article.published"
    : status === "Hidden" ? "article.hidden"
    : status === "Pending Approval" ? "article.submitted"
    : "article.updated";
  await logActivity(owner?.business_id, { action, entityType: "article", entityId: id, title: owner?.title });
}

// Swap: take one article off the site and put another on, in that order, so
// the pair never momentarily exceeds the cap and trips the trigger.
//
// showStatus is "Live" only when the article being swapped in was already
// Hidden (previously approved, just switched off) — a Draft or Rejected one
// must go to "Pending Approval" instead, same as making it live on its own
// would.
export async function swapLiveArticle(hideId, showId, showStatus = "Pending Approval") {
  await setArticleStatus(hideId, "Hidden");
  try {
    await setArticleStatus(showId, showStatus);
  } catch (e) {
    // Put the first one back rather than leaving the business with one fewer
    // live article than it started with.
    await setArticleStatus(hideId, "Live");
    throw e;
  }
}

export async function deleteArticle(id) {
  const owner = await articleOwner(id);
  const { error } = await supabase.from("business_articles").delete().eq("id", id);
  if (error) throw error;
  await logActivity(owner?.business_id, { action: "article.deleted", entityType: "article", entityId: id, title: owner?.title });
}

// How many articles this business may have live, and how many of its slots
// are already spoken for. A post waiting for approval counts: it becomes live
// the moment admin approves it, so letting a business queue up more than it
// can show would only produce approvals that can't take effect.
//
// `excludeId` leaves out the article being edited, so re-submitting a change
// to one that is already live isn't treated as asking for another slot.
export async function getArticleAllowance(businessId, excludeId = null) {
  const [{ data: allowance }, { data: rows, error }] = await Promise.all([
    supabase.rpc("addon_slot_allowance", { p_business_id: businessId, p_kind: "article" }),
    supabase.from("business_articles").select("id, status").eq("business_id", businessId),
  ]);
  if (error) throw error;
  const counted = (rows ?? []).filter(
    (r) => r.id !== excludeId && (r.status === "Live" || r.status === "Pending Approval")
  );
  const limit = allowance ?? LIVE_ARTICLE_LIMIT;
  return {
    allowance: limit,
    used: counted.length,
    live: counted.filter((r) => r.status === "Live").length,
    pending: counted.filter((r) => r.status === "Pending Approval").length,
    atLimit: counted.length >= limit,
  };
}

// Posts Maidenhead wrote for this business.
//
// They are rows in news_offers, not business_articles — a different table —
// so they have never counted towards the business's article slots and never
// will. They are listed on the dashboard only so the business can see what is
// live under its name; it does not edit them.
export async function listAdminPosts(businessId) {
  const { data, error } = await supabase
    .from("news_offers")
    .select("id, slug, title, excerpt, image, type, category, status, date_label, display_dates, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  // The read policy arrives with admin_added_free_2026_09.sql; until it does,
  // the dashboard simply shows none rather than failing to load.
  if (error) return [];
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt ?? "",
    image: r.image,
    type: r.category === "Offer" || r.type === "offer" ? "Offer" : "News",
    status: r.status === "Published" ? "Live" : r.status,
    date: r.display_dates?.trim() || r.date_label || "",
    addedByAdmin: true,
  }));
}
