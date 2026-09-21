import { supabase } from "../../lib/supabaseClient";
import { getLivePlacementMap, featureNow, unfeature, swapFeatured, schedulePlacement } from "./homepageSlots";
import { fromLondonInput } from "../../lib/ukDateTime";

// ─── Eat & Drink businesses available for news/offers ─────────────────────────
// Businesses eligible for a homepage spotlight. Was a hardcoded list of six;
// now every registered business, so a newly approved one can be featured
// without a code change.
export async function getSpotlightBusinesses() {
  const { data, error } = await supabase.from("businesses").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

// ─── Supabase-backed ──────────────────────────────────────────────────────────
// Admin-curated homepage promotion of a business. Separate from
// business_articles, which is what a business writes and admin approves — this
// is admin's own copy, schedule and paid/complimentary record.

function fromRow(r, slot) {
  return {
    id: r.id,
    slug: r.slug,
    businessId: r.business_id,
    businessName: r.business_name,
    category: r.category,
    type: r.type,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    image: r.image,
    date: r.date_label,
    displayDates: r.display_dates ?? r.date_label ?? "",
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    // On the homepage now: a live In the Spotlight booking.
    featuredOnHome: !!slot,
    homeStartsAt: slot?.startsAt ?? null,
    homeEndsAt: slot?.endsAt ?? null,
    placementId: slot?.id ?? null,
    payType: r.pay_type,
    createdAt: (r.created_at ?? "").slice(0, 10),
  };
}

function slugify(text) {
  return String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getNewsOffers({ businessId, status } = {}) {
  let q = supabase.from("news_offers").select("*").order("created_at", { ascending: false });
  if (businessId) q = q.eq("business_id", businessId);
  if (status) q = q.eq("status", status);
  const [{ data, error }, live] = await Promise.all([q, getLivePlacementMap("spotlight")]);
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r, live.get(String(r.id))));
}

export async function getNewsOfferById(id) {
  const [{ data, error }, live] = await Promise.all([
    supabase.from("news_offers").select("*").eq("id", id).maybeSingle(),
    getLivePlacementMap("spotlight"),
  ]);
  if (error) throw error;
  return data ? fromRow(data, live.get(String(data.id))) : null;
}

export async function saveNewsOffer(item) {
  const row = {
    id: item.id || undefined,
    slug: item.slug || slugify(item.title),
    business_id: item.businessId ?? null,
    business_name: item.businessName ?? null,
    type: item.type ?? "news",
    category: item.category ?? null,
    title: item.title,
    excerpt: item.excerpt ?? null,
    body: item.body ?? null,
    image: item.image ?? null,
    date_label: item.date ?? null,
    // What readers see. Kept apart from start_date/end_date, which only tell
    // the system when the post is live.
    display_dates: item.displayDates?.trim() || null,
    start_date: item.startDate || null,
    end_date: item.endDate || null,
    status: item.status ?? "Draft",
    pay_type: item.payType ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("news_offers").upsert(row).select().single();
  if (error) throw error;

  // The homepage spotlight is a booking. The post's start/end dates set its
  // homepage time (from 00:00 on the start date to 23:59 on the end date);
  // exact times can be changed in Homepage Slots.
  const live = await getLivePlacementMap("spotlight");
  const slot = live.get(String(data.id));
  if (item.featuredOnHome && data.status === "Published") {
    const startsAt = item.startDate ? fromLondonInput(`${item.startDate}T00:00`) : null;
    const endsAt = item.endDate ? fromLondonInput(`${item.endDate}T23:59`) : null;
    if (!slot) {
      const res = await featureNow("spotlight", "news_offer", String(data.id), { startsAt, endsAt });
      if (res.full) throw new Error("All In the Spotlight slots are taken for those dates. Swap one out or change the dates.");
    } else if (startsAt || endsAt) {
      await schedulePlacement({
        id: slot.id, slotType: "spotlight", contentKind: "news_offer", contentId: String(data.id),
        startsAt: startsAt ?? slot.startsAt, endsAt: endsAt ?? slot.endsAt,
      });
    }
  } else if (slot) {
    await unfeature("spotlight", data.id);
  }
  return getNewsOfferById(data.id);
}

export async function deleteNewsOffer(id) {
  const { error } = await supabase.from("news_offers").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// Turning a spotlight on books it from now for the slot's normal length;
// when every slot is taken it returns { full: true } so the page can offer a
// swap. Turning it off ends the booking now.
export async function setHomepageFeature(id, featured) {
  if (!featured) {
    await unfeature("spotlight", id);
    return { id, featuredOnHome: false };
  }
  const res = await featureNow("spotlight", "news_offer", String(id));
  if (res.full) return { full: true };
  return { id, featuredOnHome: true };
}

// Puts `addId` into the spotlight slot `removeId` is using, keeping its dates.
export async function swapHomepageFeature(addId, removeId) {
  await swapFeatured("spotlight", "news_offer", String(addId), String(removeId));
  return { addId, removeId };
}
