import { supabase } from "../../lib/supabaseClient";

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
}

export async function setArticleStatus(id, status) {
  const { error } = await supabase.from("business_articles").update({ status }).eq("id", id);
  if (error) {
    if (isLiveLimitError(error)) throw new Error(LIVE_LIMIT_MESSAGE);
    throw error;
  }
}

// Swap: take one article off the site and put another on, in that order, so
// the pair never momentarily exceeds the cap and trips the trigger.
export async function swapLiveArticle(hideId, showId) {
  await setArticleStatus(hideId, "Hidden");
  try {
    await setArticleStatus(showId, "Live");
  } catch (e) {
    // Put the first one back rather than leaving the business with one fewer
    // live article than it started with.
    await setArticleStatus(hideId, "Live");
    throw e;
  }
}

export async function deleteArticle(id) {
  const { error } = await supabase.from("business_articles").delete().eq("id", id);
  if (error) throw error;
}
