import { supabase } from "../../lib/supabaseClient";
import { logBusinessActivity } from "./businessActivity";

// Push notifications a business has asked Maidenhead to send.
//
// A business composes the notification but cannot broadcast it —
// push_notifications is admin-only by RLS and nothing grants a business
// access to it. Approving here is what actually sends: the same insert +
// send-push call admin's own composer makes, with the request's own words.

function fromRow(r) {
  return {
    id: r.id,
    businessId: r.business_id,
    businessName: r.businesses?.name ?? r.business_id,
    title: r.title,
    body: r.body ?? "",
    url: r.url ?? "",
    audience: r.audience ?? "all",
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
    notificationId: r.notification_id,
  };
}

export async function getPushRequests({ status } = {}) {
  let q = supabase
    .from("business_push_requests")
    .select("*, businesses(name)")
    .order("created_at", { ascending: false });
  if (status && status !== "All") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

// For the sidebar badge and the page's own tab count.
export async function countPendingPushRequests() {
  const { count, error } = await supabase
    .from("business_push_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// Approving sends it. The push_notifications row is written first so the send
// is on record even if delivery fails (the send-push function isn't deployed
// on every environment — see its header), then the request is marked and
// pointed at what was sent.
export async function approvePushRequest(request) {
  const { data: sent, error: sendError } = await supabase
    .from("push_notifications")
    .insert({
      title: request.title,
      body: request.body || null,
      url: request.url || null,
      audience: request.audience ?? "all",
      channels: request.channels ?? [],
      notif_type: request.notifType ?? "simple",
      article_id: request.attachedArticle?.id ?? null,
      article_title: request.attachedArticle?.title ?? null,
      article_image: request.attachedArticle?.thumbnail ?? null,
      article_link: request.attachedArticle?.link ?? null,
    })
    .select()
    .single();
  if (sendError) throw sendError;

  let delivery = null;
  try {
    const { data: result, error: fnError } = await supabase.functions.invoke("send-push", {
      body: { title: request.title, body: request.body, url: request.url, audience: request.audience ?? "all" },
    });
    delivery = fnError ? { error: fnError.message } : result;
  } catch (e) {
    delivery = { error: e.message };
  }

  // How many devices it actually reached, when delivery reports it. Left
  // null otherwise rather than written as 0, which would read as "sent to
  // nobody" instead of "not measured".
  if (typeof delivery?.sent === "number") {
    await supabase.from("push_notifications")
      .update({ reach: delivery.sent }).eq("id", sent.id);
  }

  const { error } = await supabase
    .from("business_push_requests")
    .update({
      status: "approved",
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      notification_id: sent.id,
    })
    .eq("id", request.id);
  if (error) throw error;

  await logBusinessActivity(request.businessId, {
    action: "push.approved",
    entityType: "push_request",
    entityId: request.id,
    title: request.title,
    detail: "Approved and sent.",
  });
  return { delivery };
}

export async function rejectPushRequest(request, reason) {
  if (!reason?.trim()) throw new Error("A reason is required — the business is shown it.");
  const { error } = await supabase
    .from("business_push_requests")
    .update({
      status: "rejected",
      rejection_reason: reason.trim(),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", request.id);
  if (error) throw error;

  await logBusinessActivity(request.businessId, {
    action: "push.rejected",
    entityType: "push_request",
    entityId: request.id,
    title: request.title,
    detail: reason.trim(),
  });
}
