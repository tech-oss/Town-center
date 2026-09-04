// ═══════════════════════════════════════════════════════════════════════════
// track-view — the single ingestion endpoint both the public website and the
// mobile app call to record a profile or content view.
//
// NOT DEPLOYED YET. Written and ready for when tracking goes live — see
// supabase/sql/analytics_events.sql for the table this writes to, and the
// "Wiring this up later" note at the bottom of this file for what a caller
// looks like once it's connected.
//
// Deploy with: supabase functions deploy track-view
//
// Runs with the service_role key (Deno.env SUPABASE_SERVICE_ROLE_KEY), so it
// is the ONLY way analytics_events ever gets written to — the table has no
// public INSERT policy. That's deliberate: it's what stops a visitor from
// scripting fake views for their own (or a competitor's) business from
// devtools, since the anon/public Supabase key alone can't write here.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CONTENT_TYPES = new Set(["profile", "article", "news", "offer"]);
const SOURCES = new Set(["web", "app"]);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: {
    businessId?: string;
    contentType?: string;
    contentId?: string;
    source?: string;
    sessionId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { businessId, contentType, contentId, source, sessionId } = body;

  // ── Validate shape ──────────────────────────────────────────────────────
  if (!businessId || !contentType || !contentId || !source) {
    return new Response("Missing required field", { status: 400 });
  }
  if (!CONTENT_TYPES.has(contentType)) {
    return new Response("Invalid contentType", { status: 400 });
  }
  if (!SOURCES.has(source)) {
    return new Response("Invalid source", { status: 400 });
  }

  // ── Validate the thing being viewed actually exists ─────────────────────
  // A 'profile' view's contentId must be the business itself; anything else
  // must be a real row in business_articles belonging to that business —
  // this is what stops someone posting an arbitrary businessId/contentId
  // pair that doesn't correspond to real content.
  if (contentType === "profile") {
    if (contentId !== businessId) {
      return new Response("contentId must equal businessId for profile views", { status: 400 });
    }
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .maybeSingle();
    if (!business) return new Response("Unknown business", { status: 404 });
  } else {
    const { data: article } = await supabase
      .from("business_articles")
      .select("id, type")
      .eq("id", contentId)
      .eq("business_id", businessId)
      .maybeSingle();
    if (!article) return new Response("Unknown content", { status: 404 });
    // The row's own `type` (News/Offer) must agree with the contentType the
    // caller claims — stops a News item being counted as an Offer view.
    if (article.type?.toLowerCase() !== contentType) {
      return new Response("contentType does not match content's real type", { status: 400 });
    }
  }

  // ── Dedup: one view per (business, content, session) per UTC day ────────
  // sessionId is an anonymous, per-browser-session token generated
  // client-side (see the future trackView() helper) — no PII. Without a
  // sessionId, every call is recorded as-is (used for anonymous/no-JS
  // fallback paths, if any ever exist) rather than rejected outright.
  if (sessionId) {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const { data: existing } = await supabase
      .from("analytics_events")
      .select("id")
      .eq("business_id", businessId)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .eq("session_id", sessionId)
      .gte("created_at", startOfDay.toISOString())
      .maybeSingle();
    if (existing) {
      return new Response(null, { status: 204 }); // already counted today
    }
  }

  const { error } = await supabase.from("analytics_events").insert({
    business_id: businessId,
    content_type: contentType,
    content_id: contentId,
    event_type: "view",
    source,
    session_id: sessionId ?? null,
  });

  if (error) {
    console.error("track-view insert failed", error);
    return new Response("Failed to record view", { status: 500 });
  }

  return new Response(null, { status: 204 });
});

// ─── Wiring this up later ───────────────────────────────────────────────────
// A tiny client-side helper (to live in the main-site/app codebase, not
// here) is all a caller needs:
//
//   function getSessionId() {
//     let id = sessionStorage.getItem("mh_session_id");
//     if (!id) {
//       id = crypto.randomUUID();
//       sessionStorage.setItem("mh_session_id", id);
//     }
//     return id;
//   }
//
//   export function trackView({ businessId, contentType, contentId, source }) {
//     fetch(`${SUPABASE_URL}/functions/v1/track-view`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
//       body: JSON.stringify({ businessId, contentType, contentId, source, sessionId: getSessionId() }),
//     }).catch(() => {}); // fire-and-forget — a tracking failure must never
//                          // be visible to a visitor or block rendering.
//   }
//
// Called once per mount of a business detail page (profile) or an
// article/news/offer detail page (content) — see the implementation plan
// for the exact list of pages on both web and mobile.
