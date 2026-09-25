import { supabase } from "../../lib/supabaseClient";
import { logActivity } from "./businessActivity";

// A business asking Maidenhead to send a push notification.
//
// The business composes exactly what admin composes, but cannot send: the
// push_notifications table is admin-only by RLS, and nothing here touches it.
// Approving the request is what sends it — see the admin panel's Business
// Requests tab. Rejecting carries a reason back, which is read here.

export const PUSH_STATUS = {
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

export async function requestPush(businessId, form, requestedName) {
  const { data: { user } } = await supabase.auth.getUser();
  const channels = [form.web && "Web", form.mobile && "Mobile"].filter(Boolean);
  const article = form.attachedArticle;
  const { data, error } = await supabase
    .from("business_push_requests")
    .insert({
      business_id: businessId,
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
    action: "push.requested",
    entityType: "push_request",
    entityId: data.id,
    title: data.title,
    detail: `Requested by ${requestedName ?? "the business"}. Waiting for Maidenhead to approve it.`,
  });
  return fromRow(data);
}

// Only while it is still pending — the RLS policy enforces the same, so an
// approved or rejected one can't be made to disappear.
export async function withdrawPushRequest(id) {
  const { error } = await supabase.from("business_push_requests").delete().eq("id", id);
  if (error) throw error;
}
