import { supabase } from "../../lib/supabaseClient";
import { logBusinessActivity, articleContext, reviewContext } from "./businessActivity";
import { unfeature } from "./homepageSlots";

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

// ─── Featured Articles ────────────────────────────────────────────────────
// The longer editorial pieces, from either side:
//   • author = 'business' — written by a business against a Featured Article
//     slot it has bought, and needing approval before it reaches the site;
//   • author = 'admin'    — written here, live the moment it is saved.
//
// Both kinds may be attached to a business, and then show on that business's
// profile as well as on the Offers page. An unattached one is a town story
// and shows on the Offers page only.
//
// This list used to be filtered to author = 'business', which meant the nine
// admin-written articles — six of them attached to a business — could not be
// seen, edited or hidden from anywhere in admin once written.

function featureFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    businessId: row.business_id,
    businessName: row.businesses?.name ?? row.business_id ?? "",
    author: row.author ?? "admin",
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

// Every Featured Article, whoever wrote it. `author` narrows to one side when
// a filter is on; `status` narrows to one state. Admin-written pieces have no
// submitted_at, so ordering falls back to when they were last touched.
export async function getBusinessFeatureArticles({ status, author } = {}) {
  let q = supabase
    .from("feature_articles")
    .select("*, businesses(name)")
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  if (author && author !== "All") q = q.eq("author", author);
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
  // An article that is off the site must not still be holding a homepage
  // slot — that left the Featured Stories row pointing at nothing.
  await unfeature("featured_article", id).catch(() => {});
  await logBusinessActivity(row?.business_id, {
    action: "featured_article.removed", entityType: "featured_article", entityId: id,
    title: row?.title, detail: reason.trim(),
  });
}

// Hiding and restoring, for admin's own housekeeping rather than moderation.
//
// Hidden is the quiet one: the article comes off the site and off the
// homepage but keeps everything it has, and putting it back is one click.
// Restoring also clears any reason left over from an earlier rejection or
// take-down, so the business no longer reads a complaint about a live piece.
export async function setFeatureArticleStatus(id, status) {
  if (!["Live", "Hidden", "Draft"].includes(status)) {
    throw new Error(`Use approve, reject or take down for "${status}".`);
  }
  const { data: row } = await supabase
    .from("feature_articles").select("business_id, title").eq("id", id).maybeSingle();

  const patch = { status };
  if (status === "Live") patch.rejection_reason = null;

  const { error } = await supabase.from("feature_articles").update(patch).eq("id", id);
  if (error) throw error;
  if (status !== "Live") await unfeature("featured_article", id).catch(() => {});

  await logBusinessActivity(row?.business_id, {
    action: status === "Live" ? "featured_article.restored" : "featured_article.hidden",
    entityType: "featured_article", entityId: id, title: row?.title,
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
