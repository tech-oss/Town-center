import { supabase } from "../../lib/supabaseClient";
import { logBusinessActivity } from "./businessActivity";

// Admin side of homepage bookings (supabase/sql/homepage_slot_bookings_2026_09.sql).
// Every homepage placement — In the Spotlight, Featured Articles, What's On and
// Featured Businesses — is a booking with a start and end. Admin can create,
// move, swap, end and approve any of them; businesses buy them from the
// business dashboard.

export const SLOT_KINDS = {
  spotlight: ["news_offer", "business_article"],
  featured_article: ["feature_article", "business_article"],
  whats_on: ["business_event"],
  featured_business: ["business"],
};

export const PLACEMENT_STATUS_LABELS = {
  held: "Awaiting payment",
  awaiting_content: "Paid · waiting for content",
  pending_approval: "Needs approval",
  approved: "Approved",
  rejected: "Content rejected",
  cancelled: "Cancelled",
};

const DAY_MS = 86_400_000;

// ── Slot types (capacity, length, price) ───────────────────────────────────

function typeFromRow(r) {
  return {
    key: r.key,
    label: r.label,
    description: r.description ?? "",
    capacity: r.capacity,
    perBusinessType: r.per_business_type,
    durationDays: r.duration_days,
    price: r.price_pence / 100,
    bookable: r.bookable,
  };
}

export async function getSlotTypes() {
  const { data, error } = await supabase.from("homepage_slot_types").select("*");
  if (error) throw error;
  const order = ["spotlight", "featured_article", "whats_on", "featured_business"];
  return (data ?? []).map(typeFromRow).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
}

export async function saveSlotType(key, { price, durationDays, capacity, bookable, description }) {
  const pence = Math.round(Number(price) * 100);
  if (!Number.isFinite(pence) || pence < 0) throw new Error("Enter a price of £0 or more.");
  const days = Number(durationDays);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("Length must be 1–365 days.");
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 50) throw new Error("Slots must be 1–50.");
  const { data, error } = await supabase
    .from("homepage_slot_types")
    .update({
      price_pence: pence, duration_days: days, capacity: cap, bookable: !!bookable,
      description: description ?? null, updated_at: new Date().toISOString(),
    })
    .eq("key", key)
    .select()
    .single();
  if (error) throw error;
  return typeFromRow(data);
}

// ── Content that can go in a slot ──────────────────────────────────────────

// Everything admin could put into a slot of this type, as { kind, id, title, detail, businessId, image }.
export async function getSlotContentOptions(slotType) {
  const kinds = SLOT_KINDS[slotType] ?? [];
  const lists = await Promise.all(kinds.map(async (kind) => {
    if (kind === "news_offer") {
      const { data } = await supabase.from("news_offers").select("id, title, business_id, business_name, image, status")
        .eq("status", "Published").order("created_at", { ascending: false });
      return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.title, detail: `Admin post${r.business_name ? ` · ${r.business_name}` : ""}`, businessId: r.business_id, image: r.image }));
    }
    if (kind === "business_article") {
      const { data } = await supabase.from("business_articles").select("id, title, type, business_id, hero_image, thumbnail, businesses(name)")
        .eq("status", "Live").order("date", { ascending: false });
      return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.title, detail: `${r.businesses?.name ?? "Business"} · ${r.type ?? "News"}`, businessId: r.business_id, image: r.hero_image || r.thumbnail }));
    }
    if (kind === "feature_article") {
      const { data } = await supabase.from("feature_articles").select("id, title, card_heading, card_image").order("sort_order");
      return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.card_heading || r.title, detail: "Featured story", businessId: null, image: r.card_image }));
    }
    if (kind === "business_event") {
      const { data } = await supabase.from("business_events").select("id, title, event_date, date_label, business_id, hero_image, businesses(name)")
        .eq("status", "Live").order("event_date", { ascending: true });
      return (data ?? []).map((r) => ({ kind, id: String(r.id), title: r.title, detail: [r.businesses?.name, r.date_label || r.event_date].filter(Boolean).join(" · "), businessId: r.business_id, image: r.hero_image }));
    }
    if (kind === "business") {
      const { data } = await supabase.from("businesses").select("id, name, business_listings(business_type, hero_image)")
        .eq("status", "Approved").order("name");
      return (data ?? []).map((r) => {
        const l = Array.isArray(r.business_listings) ? r.business_listings[0] : r.business_listings;
        return { kind, id: r.id, title: r.name, detail: l?.business_type ?? "", businessId: r.id, image: l?.hero_image };
      });
    }
    return [];
  }));
  return lists.flat();
}

// Titles for a batch of placements, keyed "kind:id".
async function contentTitles(rows) {
  const ids = (kind) => [...new Set(rows.filter((r) => r.content_kind === kind).map((r) => r.content_id))];
  const titles = new Map();
  const load = async (kind, table, cols, pick) => {
    const list = ids(kind);
    if (!list.length) return;
    const { data } = await supabase.from(table).select(cols).in("id", list);
    for (const r of data ?? []) titles.set(`${kind}:${r.id}`, pick(r));
  };
  await Promise.all([
    load("news_offer", "news_offers", "id, title, image", (r) => ({ title: r.title, image: r.image })),
    load("business_article", "business_articles", "id, title, hero_image, thumbnail", (r) => ({ title: r.title, image: r.hero_image || r.thumbnail })),
    load("feature_article", "feature_articles", "id, title, card_heading, card_image", (r) => ({ title: r.card_heading || r.title, image: r.card_image })),
    load("business_event", "business_events", "id, title, hero_image", (r) => ({ title: r.title, image: r.hero_image })),
    load("business", "businesses", "id, name", (r) => ({ title: r.name, image: null })),
  ]);
  return titles;
}

// ── Placements ─────────────────────────────────────────────────────────────

function placementFromRow(r, titles, businesses) {
  const content = titles?.get(`${r.content_kind}:${r.content_id}`);
  const now = Date.now();
  const start = new Date(r.starts_at).getTime();
  const end = new Date(r.ends_at).getTime();
  let phase = "upcoming";
  if (end <= now) phase = "ended";
  else if (start <= now) phase = "live";
  return {
    id: r.id,
    slotType: r.slot_type,
    pool: r.pool,
    lane: r.lane,
    businessId: r.business_id,
    businessName: businesses?.get(r.business_id) ?? null,
    contentKind: r.content_kind,
    contentId: r.content_id,
    contentTitle: content?.title ?? null,
    contentImage: content?.image ?? null,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    status: r.status,
    source: r.source,
    amount: r.amount_pence != null ? r.amount_pence / 100 : null,
    paidAt: r.paid_at,
    rejectionReason: r.rejection_reason,
    holdExpiresAt: r.hold_expires_at,
    createdAt: r.created_at,
    phase,
    // On the homepage right now.
    live: phase === "live" && r.status === "approved" && !!r.content_id,
  };
}

// Bookings that haven't ended (or, with `includeEnded`, the last 60 days too).
export async function getPlacements({ slotType, includeEnded = false } = {}) {
  let q = supabase.from("homepage_placements").select("*").neq("status", "cancelled").order("starts_at");
  if (slotType) q = q.eq("slot_type", slotType);
  const since = includeEnded ? new Date(Date.now() - 60 * DAY_MS) : new Date();
  q = q.gt("ends_at", since.toISOString());
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []).filter((r) => !(r.status === "held" && new Date(r.hold_expires_at) < new Date()));

  const bizIds = [...new Set(rows.map((r) => r.business_id).filter(Boolean))];
  const [titles, bizRes] = await Promise.all([
    contentTitles(rows),
    bizIds.length ? supabase.from("businesses").select("id, name").in("id", bizIds) : Promise.resolve({ data: [] }),
  ]);
  const businesses = new Map((bizRes.data ?? []).map((b) => [b.id, b.name]));
  return rows.map((r) => placementFromRow(r, titles, businesses));
}

function readableScheduleError(error) {
  const message = String(error?.message ?? "");
  if (message.includes("SLOT_FULL")) {
    const err = new Error(message.replace(/^.*SLOT_FULL:\s*/, "").replace(/\.$/, "") + ". Pick other dates, or end or move one first.");
    err.full = true;
    return err;
  }
  if (message.includes("homepage_placements_no_overlap")) {
    const err = new Error("That slot was just taken. Refresh and try again.");
    err.full = true;
    return err;
  }
  return error;
}

// Creates (no id) or changes a placement. Admin placements are approved.
export async function schedulePlacement({ id = null, slotType, contentKind = null, contentId = null, businessId = null, startsAt, endsAt }) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new Error("Enter a start and end date and time.");
  if (end <= start) throw new Error("The end must be after the start.");
  const { data, error } = await supabase.rpc("admin_schedule_placement", {
    p_id: id,
    p_slot_type: slotType,
    p_kind: contentKind,
    p_content_id: contentId,
    p_business_id: businessId,
    p_starts_at: start.toISOString(),
    p_ends_at: end.toISOString(),
  });
  if (error) throw readableScheduleError(error);
  return data;
}

// Takes a placement off the homepage now. One that hasn't started is cancelled.
export async function endPlacement(id) {
  const { data: row, error: readError } = await supabase.from("homepage_placements").select("starts_at, ends_at").eq("id", id).single();
  if (readError) throw readError;
  const now = new Date();
  const patch = new Date(row.starts_at) >= now
    ? { status: "cancelled" }
    : { ends_at: now.toISOString() };
  const { error } = await supabase.from("homepage_placements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function cancelPlacement(id) {
  const { error } = await supabase.from("homepage_placements").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}

export async function approvePlacement(placement) {
  const { error } = await supabase.from("homepage_placements")
    .update({ status: "approved", rejection_reason: null })
    .eq("id", placement.id);
  if (error) throw error;
  await logBusinessActivity(placement.businessId, {
    action: "placement.approved", entityType: "placement", entityId: placement.id,
    title: placement.contentTitle ?? "Homepage slot",
    detail: "Approved for the homepage.",
  });
}

export async function rejectPlacement(placement, reason) {
  const { error } = await supabase.from("homepage_placements")
    .update({ status: "rejected", rejection_reason: reason || null })
    .eq("id", placement.id);
  if (error) throw error;
  await logBusinessActivity(placement.businessId, {
    action: "placement.rejected", entityType: "placement", entityId: placement.id,
    title: placement.contentTitle ?? "Homepage slot",
    detail: reason ? `Not approved: ${reason}. Choose something else for your slot.` : "Not approved. Choose something else for your slot.",
  });
}

// ── Quick feature / unfeature (the existing section pages) ────────────────

// Live placements of one slot type, keyed by content id.
export async function getLivePlacementMap(slotType) {
  const list = await getPlacements({ slotType });
  return new Map(list.filter((p) => p.live).map((p) => [p.contentId, p]));
}

async function slotLengthMs(slotType) {
  const { data } = await supabase.from("homepage_slot_types").select("duration_days").eq("key", slotType).single();
  return (data?.duration_days ?? 14) * DAY_MS;
}

// Puts content on the homepage from now for the slot type's normal length.
// Returns { full: true } when every slot is taken, so the page can offer a swap.
export async function featureNow(slotType, contentKind, contentId, { startsAt, endsAt } = {}) {
  const start = startsAt ? new Date(startsAt) : new Date();
  const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + await slotLengthMs(slotType));
  try {
    await schedulePlacement({ slotType, contentKind, contentId, startsAt: start, endsAt: end });
    return { ok: true };
  } catch (e) {
    if (e.full) return { full: true };
    throw e;
  }
}

// Takes content off the homepage now (every live or upcoming booking of it).
export async function unfeature(slotType, contentId) {
  const { data, error } = await supabase.from("homepage_placements").select("id")
    .eq("slot_type", slotType).eq("content_id", String(contentId))
    .neq("status", "cancelled").gt("ends_at", new Date().toISOString());
  if (error) throw error;
  for (const r of data ?? []) await endPlacement(r.id);
}

// Puts `addId` into the slot `removeId` is using, keeping that slot's dates.
export async function swapFeatured(slotType, contentKind, addId, removeId) {
  const live = await getLivePlacementMap(slotType);
  const slot = live.get(String(removeId));
  if (!slot) return featureNow(slotType, contentKind, addId);
  await schedulePlacement({
    id: slot.id, slotType, contentKind, contentId: String(addId),
    startsAt: slot.startsAt, endsAt: slot.endsAt,
  });
  return { ok: true };
}
