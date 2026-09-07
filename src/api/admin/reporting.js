import { supabase } from "../../lib/supabaseClient";

// Reporting has no tables of its own — every figure is derived from
// businesses, business_subscriptions, business_users, business_listings and
// business_payments.
//
// Two caveats worth knowing when reading these numbers:
//   • Revenue comes from business_payments, which is empty until billing is
//     wired up, so the revenue series legitimately reads zero rather than
//     being broken.
//   • There is no login tracking anywhere in the schema, so the activity
//     series reports signups and new listings only.

const RANGE_MONTHS = { "30d": 1, "3m": 3, "6m": 6, "12m": 12 };
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PLAN_LABELS = { free: "Free", basic: "Basic", standard: "Standard", premium: "Premium", agent: "Agent" };
const label = (plan) => PLAN_LABELS[String(plan ?? "").toLowerCase()] ?? (plan || "Basic");

// Trailing month buckets, oldest → newest, the last being the current month.
function monthBuckets(count) {
  const now = new Date();
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, month: MONTH_NAMES[d.getMonth()] });
  }
  return out;
}

const monthKey = (iso) => (iso ? String(iso).slice(0, 7) : null);

async function loadSubscriptions() {
  const { data, error } = await supabase.from("business_subscriptions").select("*");
  if (error) throw error;
  return data ?? [];
}

async function loadPayments() {
  const { data, error } = await supabase.from("business_payments").select("*");
  if (error) throw error;
  return data ?? [];
}

// ─── Summary KPIs ──────────────────────────────────────────────────────────

export async function getReportingSummary({ range = "6m", tier = "All" } = {}) {
  const months = RANGE_MONTHS[range] ?? 6;
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceIso = since.toISOString();

  const [subs, listingsRes, usersRes, bizRes, occRes] = await Promise.all([
    loadSubscriptions(),
    supabase.from("business_listings").select("business_id, approval_status"),
    supabase.from("business_users").select("id, status, requested_at"),
    supabase.from("businesses").select("id, status, submitted_at"),
    supabase.from("business_events").select("id, status"),
  ]);
  if (listingsRes.error) throw listingsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (bizRes.error) throw bizRes.error;

  const scoped = tier === "All" ? subs : subs.filter((s) => label(s.plan) === tier);
  const mrr = scoped.reduce((sum, s) => sum + Number(s.monthly_fee ?? 0), 0);
  const paying = scoped.filter((s) => Number(s.monthly_fee ?? 0) > 0).length;

  const businesses = bizRes.data ?? [];
  const listings = listingsRes.data ?? [];
  const users = usersRes.data ?? [];

  // A listing counts as active once every section of it is approved.
  const isActive = (l) => {
    const states = Object.values(l.approval_status ?? {});
    return states.length > 0 && states.every((s) => s === "Up to Date");
  };
  const activeListings = listings.filter(isActive).length;

  // Everything still sitting in a queue: listing sections, pending businesses,
  // pending user accounts and unapproved events.
  const pendingSections = listings.reduce(
    (n, l) => n + Object.values(l.approval_status ?? {}).filter((s) => s === "Pending Approval").length, 0);
  const pendingBusinesses = businesses.filter((b) => b.status === "Pending").length;
  const pendingUsers = users.filter((u) => u.status === "pending").length;
  const pendingEvents = (occRes.data ?? []).filter((e) => e.status === "Pending Approval").length;

  const thisMonth = monthKey(new Date().toISOString());
  const newUsersThisMonth = users.filter((u) => monthKey(u.requested_at) === thisMonth).length;
  const newUsersInRange = users.filter((u) => u.requested_at && u.requested_at >= sinceIso).length;

  const cancelled = subs.filter((s) => s.cancelled).length;

  return {
    mrr,
    mrrChange: 0,
    arpa: paying > 0 ? Math.round(mrr / paying) : 0,
    activeSubscriptions: scoped.filter((s) => !s.cancelled).length,
    subscriptionsChange: 0,
    pendingApprovals: pendingSections + pendingBusinesses + pendingUsers + pendingEvents,
    activeListings,
    totalListings: listings.length,
    listingsByStatus: {
      Active: activeListings,
      Pending: listings.length - activeListings,
      Lapsed: cancelled,
    },
    totalUsers: users.length,
    newUsersThisMonth,
    newUsersInRange,
    // No login tracking exists in the schema yet.
    totalLoginsInRange: null,
    trialsActive: subs.filter((s) => s.plan_status === "Trial").length,
    churnRate: subs.length ? Math.round((cancelled / subs.length) * 1000) / 10 : 0,
    conversionRate: null,
  };
}

// ─── Revenue ───────────────────────────────────────────────────────────────

export async function getRevenueByTier({ tier = "All" } = {}) {
  const subs = await loadSubscriptions();
  const byTier = {};
  for (const s of subs) {
    const t = label(s.plan);
    byTier[t] ??= { tier: t, revenue: 0, count: 0 };
    byTier[t].revenue += Number(s.monthly_fee ?? 0);
    byTier[t].count += 1;
  }
  const list = Object.values(byTier).sort((a, b) => b.revenue - a.revenue);
  return tier === "All" ? list : list.filter((t) => t.tier === tier);
}

export async function getSubscriptionTrend({ range = "6m", tier = "All" } = {}) {
  const subs = await loadSubscriptions();
  const buckets = monthBuckets(RANGE_MONTHS[range] ?? 6);
  const tiers = tier === "All" ? ["Premium", "Standard", "Agent", "Basic", "Free"] : [tier];

  // Cumulative: a subscription counts in every month from its start onward.
  return buckets.map(({ key, month }) => {
    const row = { month };
    for (const t of tiers) row[t] = 0;
    for (const s of subs) {
      const started = monthKey(s.terms_accepted_at);
      if (!started || started > key) continue;
      const t = label(s.plan);
      if (row[t] !== undefined) row[t] += 1;
    }
    return row;
  });
}

export async function getActivityTrend({ range = "6m" } = {}) {
  const buckets = monthBuckets(RANGE_MONTHS[range] ?? 6);
  const [usersRes, listingsRes] = await Promise.all([
    supabase.from("business_users").select("requested_at"),
    supabase.from("business_listings").select("updated_at"),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (listingsRes.error) throw listingsRes.error;

  return buckets.map(({ key, month }) => ({
    month,
    signups: (usersRes.data ?? []).filter((u) => monthKey(u.requested_at) === key).length,
    listings: (listingsRes.data ?? []).filter((l) => monthKey(l.updated_at) === key).length,
  }));
}

// Trailing daily buckets — used by the revenue and signup sparklines.
function dayBuckets(days) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({
      key: d.toISOString().slice(0, 10),
      date: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
    });
  }
  return out;
}

// Dashboard's RevenueChart wants { data, total, change } — not the bare
// day-array — so the big total figure and the "vs previous period" line above
// the chart have something to render from.
export async function getRevenueTrend({ days = 30 } = {}) {
  const payments = await loadPayments();
  const buckets = dayBuckets(days);
  const data = buckets.map(({ key, date }) => ({
    date,
    revenue: payments
      .filter((p) => String(p.paid_at ?? p.created_at ?? "").slice(0, 10) === key)
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
  }));
  const total = data.reduce((s, d) => s + d.revenue, 0);

  // Previous period of equal length, for the "+N% on previous X days" line.
  const prevStart = new Date();
  prevStart.setDate(prevStart.getDate() - days * 2);
  const prevEnd = new Date();
  prevEnd.setDate(prevEnd.getDate() - days);
  const prevTotal = payments
    .filter((p) => {
      const d = new Date(p.paid_at ?? p.created_at ?? 0);
      return d >= prevStart && d < prevEnd;
    })
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : 0;

  return { data, total, change };
}

// Dashboard's Platform Overview chart plots cumulative sign-ups per plan tier
// as separate lines (PLAN_KEYS in DashboardPage.jsx), not a single daily count.
export async function getSignupTrend({ days = 30 } = {}) {
  const subs = await loadSubscriptions();
  return dayBuckets(days).map(({ key, date }) => {
    const row = { date };
    for (const tier of ["Free", "Basic", "Standard", "Premium", "Agent"]) row[tier] = 0;
    for (const s of subs) {
      const started = String(s.terms_accepted_at ?? "").slice(0, 10);
      if (!started || started > key) continue;
      const t = label(s.plan);
      if (row[t] !== undefined) row[t] += 1;
    }
    return row;
  });
}

// ─── Breakdowns ────────────────────────────────────────────────────────────

const SECTION_LABELS = {
  "eat-drink": "Eat & Drink", "see-do": "See & Do", shop: "Shop",
  services: "Services", live: "Live", hotel: "Live & Stay",
};
const SECTION_ICONS = {
  "Eat & Drink": "🍽", Shop: "🛍", "See & Do": "🎭", Services: "🔧", Live: "🏠", "Live & Stay": "🛏",
};
const PALETTE = ["#2563EB", "#1D4ED8", "#60A5FA", "#93C5FD", "#3B82F6", "#1E40AF"];

export async function getTopCategories() {
  const { data, error } = await supabase.from("business_listings").select("business_type, category");
  if (error) throw error;

  const counts = {};
  for (const l of data ?? []) {
    const name = SECTION_LABELS[l.business_type] ?? l.category ?? "Uncategorised";
    counts[name] = (counts[name] ?? 0) + 1;
  }
  const rows = Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const total = rows.reduce((s, d) => s + d.count, 0) || 1;
  return rows.map((d, i) => ({
    ...d,
    icon: SECTION_ICONS[d.category] ?? "📍",
    colour: PALETTE[i % PALETTE.length],
    pct: Math.round((d.count / total) * 100),
  }));
}

export async function getPlanDistribution() {
  const subs = await loadSubscriptions();
  const counts = {};
  for (const s of subs) {
    const plan = label(s.plan);
    counts[plan] = (counts[plan] ?? 0) + 1;
  }
  const rows = Object.entries(counts).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);
  const total = rows.reduce((s, d) => s + d.count, 0) || 1;
  return rows.map((d, i) => ({ ...d, colour: PALETTE[i % PALETTE.length], pct: Math.round((d.count / total) * 100) }));
}

export async function getListingsBySection() {
  const { data, error } = await supabase.from("business_listings").select("business_type, category");
  if (error) throw error;

  const counts = {};
  for (const l of data ?? []) {
    const name = SECTION_LABELS[l.business_type] ?? l.category ?? "Uncategorised";
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return Object.entries(counts).map(([section, count]) => ({ section, count })).sort((a, b) => b.count - a.count);
}
