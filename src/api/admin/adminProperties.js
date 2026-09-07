import { supabase } from "../../lib/supabaseClient";

// Property listings come from two places: agents' XML feeds, whose rows import
// as 'Auto-published', and manual admin entries, which start 'Pending' and need
// approving. `source` records which, and feed_id + external_id let a re-sync
// update an imported row rather than duplicate it.

function fromRow(r) {
  return {
    id: r.id,
    externalId: r.external_id,
    feedId: r.feed_id,
    address: r.address,
    postcode: r.postcode,
    agent: r.agent,
    type: r.property_type,
    beds: r.beds,
    baths: r.baths,
    price: r.price,
    priceValue: r.price_value,
    pricePeriod: r.price_period,
    description: r.description,
    images: r.images ?? [],
    lat: r.lat,
    lng: r.lng,
    status: r.status,
    source: r.source,
    listedAt: r.listed_at,
  };
}

function feedFromRow(r) {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    agentName: r.agent_name,
    active: r.active,
    lastSync: r.last_sync,
    imported: r.imported,
    skipped: r.skipped,
    errors: r.errors,
    skipLog: r.skip_log ?? [],
  };
}

export async function getAdminProperties({ source, status } = {}) {
  let q = supabase.from("properties").select("*").order("listed_at", { ascending: false, nullsFirst: false });
  if (source) q = q.eq("source", source);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

// "£425,000" and "£2,100/mo" both need to sort and filter, so the numeric part
// and the period are pulled out alongside the display string.
function parsePrice(price) {
  if (!price) return { value: null, period: null };
  const value = Number(String(price).replace(/[^0-9.]/g, "")) || null;
  const period = /\/\s*mo|pcm|month/i.test(price) ? "month"
    : /\/\s*wk|pw|week/i.test(price) ? "week"
    : "sale";
  return { value, period };
}

export async function saveProperty(property) {
  const { value, period } = parsePrice(property.price);
  const row = {
    id: property.id || undefined,
    external_id: property.externalId ?? null,
    feed_id: property.feedId ?? null,
    address: property.address,
    postcode: property.postcode ?? null,
    agent: property.agent ?? null,
    property_type: property.type ?? null,
    beds: property.beds ?? null,
    baths: property.baths ?? null,
    price: property.price ?? null,
    price_value: value,
    price_period: period,
    description: property.description ?? null,
    images: property.images ?? [],
    lat: property.lat ?? null,
    lng: property.lng ?? null,
    status: property.status ?? "Pending",
    source: property.source ?? "manual",
    listed_at: property.listedAt || new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("properties").upsert(row).select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function setPropertyStatus(id, status) {
  const { error } = await supabase
    .from("properties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return { ok: true };
}

export async function deleteProperty(id) {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// ─── Agent feeds ───────────────────────────────────────────────────────────

export async function getFeeds() {
  const { data, error } = await supabase.from("property_feeds").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(feedFromRow);
}

export async function saveFeed(feed) {
  const { data, error } = await supabase.from("property_feeds").upsert({
    id: feed.id || undefined,
    name: feed.name,
    url: feed.url,
    agent_name: feed.agentName ?? null,
    active: feed.active !== false,
  }).select().single();
  if (error) throw error;
  return feedFromRow(data);
}

export async function deleteFeed(id) {
  const { error } = await supabase.from("property_feeds").delete().eq("id", id);
  if (error) throw error;
  return { id, deleted: true };
}

// Fetching and parsing an agent's XML has to happen server-side (the browser
// can't read a third-party feed cross-origin, and a scheduled sync shouldn't
// depend on an admin having a tab open). This records the attempt so the
// screen's sync log is real; the import itself belongs in an Edge Function.
export async function recordFeedSync(id, { imported = 0, skipped = 0, errors = 0, skipLog = [] } = {}) {
  const { error } = await supabase.from("property_feeds").update({
    last_sync: new Date().toISOString(),
    imported, skipped, errors, skip_log: skipLog,
  }).eq("id", id);
  if (error) throw error;
  return { ok: true };
}
