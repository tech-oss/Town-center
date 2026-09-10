import { supabase } from "../../lib/supabaseClient";

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

function fromRow(r) {
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
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    featuredOnHome: r.featured_on_home,
    payType: r.pay_type,
    createdAt: (r.created_at ?? "").slice(0, 10),
  };
}

function slugify(text) {
  return String(text ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// The homepage carousel — published items admin has chosen to feature, in the
// shape BlogCards expects.
export async function getSpotlightPosts() {
  const { data, error } = await supabase
    .from("news_offers")
    .select("*")
    .eq("featured_on_home", true)
    .eq("status", "Published")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    slug: n.slug,
    category: `${n.business_name} · ${n.category}`,
    title: n.title,
    excerpt: n.excerpt,
    imageSrc: n.image,
    imageAlt: n.title,
    href: `/news/${n.slug}`,
    date: n.date_label,
  }));
}

export async function getNewsOffers({ businessId, status } = {}) {
  let q = supabase.from("news_offers").select("*").order("created_at", { ascending: false });
  if (businessId) q = q.eq("business_id", businessId);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function getNewsOfferById(id) {
  const { data, error } = await supabase.from("news_offers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
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
    start_date: item.startDate || null,
    end_date: item.endDate || null,
    status: item.status ?? "Draft",
    featured_on_home: !!item.featuredOnHome,
    pay_type: item.payType ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("news_offers").upsert(row).select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteNewsOffer(id) {
  const { error } = await supabase.from("news_offers").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// The homepage shows four spotlight slots. Turning a slot off always
// succeeds; turning one on when all four are taken returns { full: true }
// instead of erroring, so the UI can offer a swap rather than a dead end.
export async function setHomepageFeature(id, featured) {
  if (!featured) {
    const { error } = await supabase.from("news_offers").update({ featured_on_home: false }).eq("id", id);
    if (error) throw error;
    return { id, featuredOnHome: false };
  }

  const { count, error: countError } = await supabase
    .from("news_offers")
    .select("id", { count: "exact", head: true })
    .eq("featured_on_home", true)
    .neq("id", id);
  if (countError) throw countError;
  if ((count ?? 0) >= 4) return { full: true };

  const { error } = await supabase.from("news_offers").update({ featured_on_home: true }).eq("id", id);
  if (error) throw error;
  return { id, featuredOnHome: true };
}

// Swaps one homepage slot: takes `removeId` offline and puts `addId` live in
// its place. Used both when a 4th item is featured and swap.
export async function swapHomepageFeature(addId, removeId) {
  const { error: offErr } = await supabase.from("news_offers").update({ featured_on_home: false }).eq("id", removeId);
  if (offErr) throw offErr;
  const { error: onErr } = await supabase.from("news_offers").update({ featured_on_home: true }).eq("id", addId);
  if (onErr) throw onErr;
  return { addId, removeId };
}
