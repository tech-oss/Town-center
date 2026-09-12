import { supabase } from "../../lib/supabaseClient";
import { logBusinessActivity, articleContext, reviewContext } from "./businessActivity";

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

// Approving is a judgement about the content, not about whether the business
// has a free slot for it — so a business already at its 3-live limit still
// gets approved, the article just lands as Hidden rather than Live. The owner
// then swaps it in from their own News & Articles page (or subscribes for
// more room). Without this, admin's approve button would simply fail with the
// trigger's error on any business that happens to be full, which reads as
// admin being unable to approve rather than the business being at capacity.
export async function approveArticle(id) {
  const ctx = await articleContext(id);
  const { error } = await supabase
    .from("business_articles")
    .update({ status: "Live", rejection_reason: null })
    .eq("id", id);

  if (!error) {
    await logBusinessActivity(ctx?.business_id, { action: "article.approved", entityType: "article", entityId: id, title: ctx?.title });
    return { ok: true, live: true };
  }

  if (!String(error.message ?? "").includes("Live article limit reached")) throw error;

  const { error: hiddenError } = await supabase
    .from("business_articles")
    .update({ status: "Hidden", rejection_reason: null })
    .eq("id", id);
  if (hiddenError) throw hiddenError;

  await logBusinessActivity(ctx?.business_id, {
    action: "article.approved", entityType: "article", entityId: id, title: ctx?.title,
    detail: "Held off the site until you swap out one of your 3 live posts.",
  });
  return { ok: true, live: false };
}

export async function rejectArticle(id, reason) {
  const ctx = await articleContext(id);
  const { error } = await supabase
    .from("business_articles")
    .update({ status: "Rejected", rejection_reason: reason || null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "article.rejected", entityType: "article", entityId: id, title: ctx?.title, detail: reason || null });
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
    // Whatever the reviewer left as proof this is a real, verified customer
    // (a booking reference, an order link, etc.) — collected on the business
    // portal's review form but never surfaced to the moderator who actually
    // needs it to judge whether a review is genuine.
    verificationLink: row.verification_link ?? null,
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
  const ctx = await reviewContext(id);
  await logBusinessActivity(ctx?.business_id, { action: "review.reply_approved", entityType: "review", entityId: id, title: ctx?.title });
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
  const ctx = await reviewContext(id);
  await logBusinessActivity(ctx?.business_id, { action: "review.reply_rejected", entityType: "review", entityId: id, title: ctx?.title, detail: reason || null });
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
  const ctx = await reviewContext(id);
  const { error } = await supabase
    .from("business_reviews")
    .update({ status: "Hidden", moderation_note: note || null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "review.hidden", entityType: "review", entityId: id, title: ctx?.title });
}

export async function restoreReview(id) {
  const ctx = await reviewContext(id);
  const { error } = await supabase
    .from("business_reviews")
    .update({ status: "Visible", moderation_note: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "review.restored", entityType: "review", entityId: id, title: ctx?.title });
}

export async function deleteReview(id) {
  const { error } = await supabase.from("business_reviews").delete().eq("id", id);
  if (error) throw error;
}
