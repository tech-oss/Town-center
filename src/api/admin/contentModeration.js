import { supabase } from "../../lib/supabaseClient";

// Moderation of the two remaining things businesses publish to the public
// site: their News & Offers articles, and the customer reviews shown on their
// listing. Both follow the same shape as the event queues — approve, or reject
// with a reason the business sees back on their own dashboard.

// ─── Business articles (News & Offers) ─────────────────────────────────────

function articleFromRow(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? row.business_id,
    title: row.title,
    type: row.type,
    status: row.status,
    date: row.date,
    startDate: row.start_date,
    endDate: row.end_date,
    heroImage: row.hero_image,
    thumbnail: row.thumbnail,
    body: row.body,
    rejectionReason: row.rejection_reason,
  };
}

export async function getBusinessArticles({ status } = {}) {
  let q = supabase
    .from("business_articles")
    .select("*, businesses(name)")
    .order("date", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(articleFromRow);
}

export async function approveArticle(id) {
  const { error } = await supabase
    .from("business_articles")
    .update({ status: "Live", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectArticle(id, reason) {
  const { error } = await supabase
    .from("business_articles")
    .update({ status: "Rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
}

// ─── Customer reviews ──────────────────────────────────────────────────────

function reviewFromRow(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? row.business_id,
    reviewer: row.reviewer,
    rating: row.rating,
    date: row.date,
    text: row.text,
    // `reply` is jsonb — the business's response plus its own approval state,
    // so a reply is moderated separately from the review it answers.
    reply: row.reply?.text ?? "",
    replyStatus: row.reply?.status ?? null,
    status: row.status ?? "Visible",
    moderationNote: row.moderation_note,
  };
}

export async function approveReply(id) {
  const { data: row, error: readError } = await supabase
    .from("business_reviews").select("reply").eq("id", id).maybeSingle();
  if (readError) throw readError;
  const { error } = await supabase
    .from("business_reviews")
    .update({ reply: { ...(row?.reply ?? {}), status: "Approved" } })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectReply(id, reason) {
  const { data: row, error: readError } = await supabase
    .from("business_reviews").select("reply").eq("id", id).maybeSingle();
  if (readError) throw readError;
  const { error } = await supabase
    .from("business_reviews")
    .update({ reply: { ...(row?.reply ?? {}), status: "Rejected", rejectionReason: reason || null } })
    .eq("id", id);
  if (error) throw error;
}

export async function getReviews({ status } = {}) {
  let q = supabase
    .from("business_reviews")
    .select("*, businesses(name)")
    .order("date", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(reviewFromRow);
}

// Hiding is the default moderation action — it pulls the review off the public
// listing but keeps it on record, so a decision can be reversed and there's
// still an audit trail. Deletion is separate and deliberate.
export async function hideReview(id, note) {
  const { error } = await supabase
    .from("business_reviews")
    .update({ status: "Hidden", moderation_note: note || null })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreReview(id) {
  const { error } = await supabase
    .from("business_reviews")
    .update({ status: "Visible", moderation_note: null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReview(id) {
  const { error } = await supabase.from("business_reviews").delete().eq("id", id);
  if (error) throw error;
}
