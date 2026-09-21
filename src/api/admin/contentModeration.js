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
    status: row.status ?? "Pending Approval",
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

// Reviews a business adds (or edits) wait as "Pending Approval" until admin
// approves them; only then do they appear on the business's public page.
export async function approveReview(id) {
  const ctx = await reviewContext(id);
  const { error } = await supabase
    .from("business_reviews")
    .update({ status: "Visible", moderation_note: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "review.approved", entityType: "review", entityId: id, title: ctx?.title });
}

export async function rejectReview(id, reason) {
  const ctx = await reviewContext(id);
  const { error } = await supabase
    .from("business_reviews")
    .update({ status: "Rejected", moderation_note: reason || null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, { action: "review.rejected", entityType: "review", entityId: id, title: ctx?.title, detail: reason || null });
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

// ─── Taking an already-published post down ────────────────────────────────
// Approval isn't infallible: something can get through that shouldn't have.
// Admin can pull any business post off the site, or delete it outright, and
// both require a reason — which is written to rejection_reason so the
// business reads it on their own News & Articles page, and to their activity
// feed so they're notified.

export async function takeDownArticle(id, reason) {
  if (!reason?.trim()) throw new Error("A reason is required — the business is shown it.");
  const ctx = await articleContext(id);
  const { error } = await supabase
    .from("business_articles")
    .update({ status: "Removed", rejection_reason: reason.trim() })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, {
    action: "article.removed", entityType: "article", entityId: id,
    title: ctx?.title, detail: reason.trim(),
  });
}

// Back on the site after a take-down, if the decision is reversed. It returns
// as Hidden rather than Live so it never jumps the business's 3-live limit;
// the business chooses when to swap it back in.
export async function restoreArticle(id) {
  const ctx = await articleContext(id);
  const { error } = await supabase
    .from("business_articles")
    .update({ status: "Hidden", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(ctx?.business_id, {
    action: "article.restored", entityType: "article", entityId: id, title: ctx?.title,
  });
}

export async function deleteBusinessArticle(id, reason) {
  if (!reason?.trim()) throw new Error("A reason is required — the business is shown it.");
  const ctx = await articleContext(id);
  // Logged against the business BEFORE the row goes, so the notice survives
  // the post it's about.
  await logBusinessActivity(ctx?.business_id, {
    action: "article.deleted", entityType: "article", entityId: id,
    title: ctx?.title, detail: reason.trim(),
  });
  const { error } = await supabase.from("business_articles").delete().eq("id", id);
  if (error) throw error;
}

// ─── Business-written Featured Articles ───────────────────────────────────
// Longer editorial pieces a business writes for itself, against a Featured
// Article slot it has bought. They sit in feature_articles alongside admin's
// own stories, told apart by author = 'business', and need approving before
// they reach the site.

function featureFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? row.business_id,
    status: row.status,
    title: row.title,
    standfirst: row.standfirst ?? "",
    category: row.category ?? "",
    heroImage: row.hero_image,
    cardImage: row.card_image,
    website: row.website ?? "",
    location: row.location ?? "",
    body: Array.isArray(row.body) ? row.body : [],
    submittedAt: row.submitted_at,
    rejectionReason: row.rejection_reason,
  };
}

export async function getBusinessFeatureArticles({ status } = {}) {
  let q = supabase
    .from("feature_articles")
    .select("*, businesses(name)")
    .eq("author", "business")
    .order("submitted_at", { ascending: false, nullsFirst: false });
  if (status && status !== "All") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(featureFromRow);
}

export async function approveFeatureArticle(id) {
  const { data: row, error: readError } = await supabase
    .from("feature_articles").select("business_id, title").eq("id", id).maybeSingle();
  if (readError) throw readError;
  const { error } = await supabase
    .from("feature_articles")
    .update({ status: "Live", rejection_reason: null })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(row?.business_id, {
    action: "featured_article.approved", entityType: "featured_article", entityId: id, title: row?.title,
  });
}

export async function rejectFeatureArticle(id, reason) {
  if (!reason?.trim()) throw new Error("A reason is required — the business is shown it.");
  const { data: row } = await supabase
    .from("feature_articles").select("business_id, title").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("feature_articles")
    .update({ status: "Rejected", rejection_reason: reason.trim() })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(row?.business_id, {
    action: "featured_article.rejected", entityType: "featured_article", entityId: id,
    title: row?.title, detail: reason.trim(),
  });
}

// Pulling a live one off the site, with the reason the business reads.
export async function takeDownFeatureArticle(id, reason) {
  if (!reason?.trim()) throw new Error("A reason is required — the business is shown it.");
  const { data: row } = await supabase
    .from("feature_articles").select("business_id, title").eq("id", id).maybeSingle();
  const { error } = await supabase
    .from("feature_articles")
    .update({ status: "Removed", rejection_reason: reason.trim() })
    .eq("id", id);
  if (error) throw error;
  await logBusinessActivity(row?.business_id, {
    action: "featured_article.removed", entityType: "featured_article", entityId: id,
    title: row?.title, detail: reason.trim(),
  });
}

// How many business Featured Articles are waiting, for the sidebar badge.
export async function countFeatureArticlesNeedingApproval() {
  const { count, error } = await supabase
    .from("feature_articles")
    .select("id", { count: "exact", head: true })
    .eq("author", "business")
    .eq("status", "Pending Approval");
  if (error) return 0;
  return count ?? 0;
}
