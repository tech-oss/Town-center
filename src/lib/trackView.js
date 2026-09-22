import { useEffect } from "react";
import { supabase } from "./supabaseClient";

// Records a view of a business page, post or event for the business's
// analytics (supabase/sql/analytics_every_view_2026_09.sql → record_view).
// Every page load of a live item counts as its own view — there is no
// per-minute, per-session or per-device deduplication. The anonymous
// per-browser token is still sent (no personal data) so abuse can be spotted,
// but it no longer suppresses a view. Fire and forget: a failed recording
// never affects the page.

const SESSION_KEY = "mh_view_session";

function sessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode): a per-page-load token still labels the
    // visit; nothing depends on it being stable.
    return (window.__mhViewSession ??= crypto.randomUUID());
  }
}

const source = () => (window.location.pathname.startsWith("/mobile") ? "app" : "web");

// What to record for a business listing (only registered businesses count).
export function businessView(item) {
  return item?.live && item.businessId ? { businessId: item.businessId, type: "profile", id: item.businessId } : null;
}

// What to record for a news / offer post of a business.
export function articleView(article) {
  const businessId = article?.business?.businessId;
  if (!businessId) return null;
  const raw = String(article.id ?? "");
  const id = article.newsOfferId
    ?? (raw.startsWith("live-") ? raw.slice(5) : null)
    ?? (raw.startsWith("spotlight-") ? raw.slice(10) : null);
  if (!id) return null;
  return { businessId, type: article.category === "Offer" ? "offer" : "news", id: String(id) };
}

// What to record for an event run by a business.
export function eventView(event) {
  return event?.businessId && event.id ? { businessId: event.businessId, type: "event", id: String(event.id) } : null;
}

// A Featured Article that belongs to a business — either one the business
// wrote against a slot it bought, or an admin story attached to it.
export function featureView(story) {
  return story?.businessId && story.id
    ? { businessId: story.businessId, type: "featured", id: String(story.id) }
    : null;
}

export function trackView(target) {
  if (!target || typeof window === "undefined") return;
  supabase.rpc("record_view", {
    p_business_id: target.businessId,
    p_content_type: target.type,
    p_content_id: target.id,
    p_source: source(),
    p_session_id: sessionId(),
  }).then(({ error }) => {
    // Never breaks the page, but never silent either: this used to discard
    // every error, which is how a database rule rejecting repeat views went
    // unnoticed while the numbers quietly stopped moving.
    if (error) console.warn("View not recorded:", error.message, target);
  }, (e) => console.warn("View not recorded:", e?.message ?? e, target));
}

// Records a view every time an item is shown — each page load, and each time
// the visitor navigates to it again within the site. Call it before any early
// return.
export function useTrackView(target) {
  const key = target ? `${target.businessId}|${target.type}|${target.id}` : null;
  useEffect(() => {
    if (key) trackView(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
