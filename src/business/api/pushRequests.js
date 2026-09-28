import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";

// A business asking Maidenhead to send a push notification.
//
// The business composes exactly what admin composes, but cannot send: the
// push_notifications table is admin-only by RLS, and nothing here touches it.
// Approving the request is what sends it — see the admin panel's Business
// Requests tab. Rejecting carries a reason back, which is read here.
//
// Push notifications are also paid — one credit is spent per notification
// (see push_notification_addon_2026_09.sql). Only the owner can spend one,
// so a Content Manager composing one raises a 'draft' instead of a real
// request; the owner reviews it here and submits it (submitPushDraft), which
// is what actually spends the credit and puts it in front of admin.

export const PUSH_STATUS = {
  draft: { label: "Awaiting the owner", bg: "rgba(37,99,235,0.1)", fg: "#1D4ED8" },
  pending: { label: "Waiting for approval", bg: "rgba(217,119,6,0.14)", fg: "#92400E" },
  approved: { label: "Sent", bg: "rgba(22,163,74,0.14)", fg: "#15803D" },
  rejected: { label: "Not approved", bg: "rgba(185,28,28,0.1)", fg: "#991B1B" },
};

function fromRow(r) {
  return {
    id: r.id,
    title: r.title,
    body: r.body ?? "",
    url: r.url ?? "",
    channels: r.channels ?? [],
    notifType: r.notif_type,
    attachedArticle: r.article_id
      ? { id: r.article_id, title: r.article_title, thumbnail: r.article_image, link: r.article_link }
      : null,
    status: r.status,
    rejectionReason: r.rejection_reason ?? "",
    requestedName: r.requested_name ?? "",
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
  };
}

export async function listPushRequests(businessId) {
  const { data, error } = await supabase
    .from("business_push_requests")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

// How many of this business's requests are still waiting, for the page badge.
export async function countPendingPushRequests(businessId) {
  const { count, error } = await supabase
    .from("business_push_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// A Content Manager's drafts, waiting on the owner to submit or discard them
// — for the sidebar badge on Push Notifications, same as Support's open
// ticket count.
export async function countOwnerDrafts(businessId) {
  const { count, error } = await supabase
    .from("business_push_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "draft");
  if (error) return 0;
  return count ?? 0;
}

// How many push notifications this business has left to send: purchased
// (unexpired packs) minus spent (every request that has actually reached
// admin). A rejected one stops counting the moment admin rejects it, so its
// credit is back without a separate refund step.
export async function getPushNotificationBalance(businessId) {
  const { data, error } = await supabase.rpc("push_notification_balance", { p_business_id: businessId });
  if (error) throw error;
  return data ?? { purchased: 0, used: 0, remaining: 0 };
}

// `isOwner` decides what submitting actually does: the owner spends a credit
// and sends it straight to admin (status 'pending'); anyone else composes a
// draft for the owner to review and submit (status 'draft') — RLS enforces
// the same split, so this can't be bypassed from the browser.
export async function requestPush(businessId, form, requestedName, isOwner) {
  const { data: { user } } = await supabase.auth.getUser();
  const channels = [form.web && "Web", form.mobile && "Mobile"].filter(Boolean);
  const article = form.attachedArticle;
  const { data, error } = await supabase
    .from("business_push_requests")
    .insert({
      business_id: businessId,
      status: isOwner ? "pending" : "draft",
      title: form.title.trim(),
      body: form.body?.trim() || null,
      url: form.url?.trim() || null,
      channels,
      notif_type: article ? "rich" : "simple",
      article_id: article?.id ?? null,
      article_title: article?.title ?? null,
      article_image: article?.thumbnail ?? null,
      article_link: article?.link ?? null,
      requested_by: user?.id ?? null,
      requested_name: requestedName ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity(businessId, {
    action: isOwner ? "push.requested" : "push.drafted",
    entityType: "push_request",
    entityId: data.id,
    title: data.title,
    detail: isOwner
      ? `Requested by ${requestedName ?? "the business"}. Waiting for Maidenhead to approve it.`
      : `Composed by ${requestedName ?? "a content manager"}. Waiting for the owner to submit it.`,
  });
  return fromRow(data);
}

// The owner turning a Content Manager's draft into a real request — spends a
// credit and sends it to admin. Refuses outright (via the RPC's own checks)
// if the caller isn't the owner or there's nothing left to spend, so this is
// never the only thing stopping a business going into the red.
export async function submitPushDraft(id) {
  const { data, error } = await supabase.rpc("submit_push_draft", { p_id: id });
  if (error) throw error;
  return fromRow(data);
}

// A draft or a still-pending request — the RLS policy enforces the same, so
// an approved or rejected one can't be made to disappear.
export async function withdrawPushRequest(id) {
  const { error } = await supabase.from("business_push_requests").delete().eq("id", id);
  if (error) throw error;
}
