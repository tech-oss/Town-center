import { supabase } from "../../lib/supabaseClient";

// What a business may attach to a push notification: its own live content,
// and only its own. Admin's equivalent (api/admin/pushAttachments.js) offers
// everything on the site, which is right for admin and wrong here — a
// business attaching another business's offer would be sending people
// somewhere it has no say over.
//
// Links match the public URLs the site actually serves, so the push lands on
// a real page: /news/live-<id> for a news or offer post (see mapArticle in
// the main site's liveBusinesses.js), /story/<slug> for a Featured Article
// and /event/<slug or id> for an event.

export async function getMyAttachableContent(businessId) {
  const [posts, features, events] = await Promise.all([
    supabase.from("business_articles")
      .select("id, title, type, status, thumbnail, hero_image")
      .eq("business_id", businessId).eq("status", "Live"),
    supabase.from("feature_articles")
      .select("id, slug, title, card_heading, card_image, hero_image, status")
      .eq("business_id", businessId).eq("status", "Live"),
    supabase.from("business_events")
      .select("id, slug, title, hero_image, gallery, status")
      .eq("business_id", businessId).eq("status", "Live"),
  ]);

  const out = [];

  for (const a of posts.data ?? []) {
    out.push({
      id: `live-${a.id}`,
      title: a.title,
      category: a.type === "Offer" ? "Offer" : "News",
      thumbnail: a.hero_image || a.thumbnail,
      link: `/news/live-${a.id}`,
    });
  }
  for (const f of features.data ?? []) {
    out.push({
      id: `story-${f.slug ?? f.id}`,
      title: f.card_heading || f.title,
      category: "Featured Article",
      thumbnail: f.card_image || f.hero_image,
      link: `/story/${f.slug ?? f.id}`,
    });
  }
  for (const e of events.data ?? []) {
    out.push({
      id: `event-${e.slug ?? e.id}`,
      title: e.title,
      category: "Event",
      thumbnail: e.hero_image || (e.gallery ?? [])[0],
      link: `/event/${e.slug ?? e.id}`,
    });
  }

  return out;
}
