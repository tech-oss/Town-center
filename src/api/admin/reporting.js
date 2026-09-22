import { supabase } from "../../lib/supabaseClient";
import { isPayingSubscription, isAdminGrantedSubscription, monthlyRevenue, planBucket } from "../../lib/subscriptionStatus";

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

// `range` is either a preset key string ("6m") or { type: "custom", from, to }
// (from/to as "YYYY-MM-DD"). Resolves both to a concrete [since, until] pair
// so every function below works off real dates rather than a month count —
// a custom range can span any window, not just whole trailing months.
function resolveRange(range) {
  if (range && typeof range === "object" && range.type === "custom" && range.from && range.to) {
    return { since: new Date(range.from), until: new Date(range.to) };
  }
  const months = RANGE_MONTHS[range] ?? 6;
  const until = new Date();
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  return { since, until };
}

// Month buckets spanning [since, until] inclusive, oldest → newest.
function monthBuckets(since, until) {
  const out = [];
  const d = new Date(since.getFullYear(), since.getMonth(), 1);
  const end = new Date(until.getFullYear(), until.getMonth(), 1);
  while (d <= end) {
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, month: MONTH_NAMES[d.getMonth()] });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

const monthKey = (iso) => (iso ? String(iso).slice(0, 7) : null);

async function loadSubscriptions() {
  const { data, error } = await supabase.from("business_subscriptions").select("*");
  if (error) throw error;
  return data ?? [];
}

// business_payments.amount is stored the way it is displayed — a formatted
// string like "£9.99" (see money() in the stripe-webhook function), so
// Number() on it is NaN and any total built from it came out as "£NaN".
// Everything outside digits, a dot and a minus sign is stripped before
// parsing, which handles "£9.99", "GBP 9.99" and "1,234.00" alike.
function paymentAmount(p) {
  const n = Number(String(p?.amount ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// The day a payment belongs to. The column is `date` (a plain YYYY-MM-DD);
// there is no paid_at, and reading one gave undefined for every row.
function paymentDay(p) {
  return String(p?.date ?? p?.created_at ?? "").slice(0, 10);
}

// Only money actually taken counts towards revenue — a failed charge is still
// a row in this table.
const isPaid = (p) => String(p?.status ?? "Paid").toLowerCase() === "paid";

async function loadPayments() {
  const { data, error } = await supabase.from("business_payments").select("*");
  if (error) throw error;
  return (data ?? []).filter(isPaid);
}

// ─── Every business, classified once ──────────────────────────────────────
// The single answer to "what plan is this business on, and is it paying?",
// used by every figure on the dashboard so none of them can disagree.
//
// It starts from `businesses`, not `business_subscriptions`: a business admin
// registered and nobody has subscribed has no subscription row at all, and
// counting from the subscriptions table left it out entirely — which is why
// Plan Distribution showed fewer Free businesses than Business Profiles did.
//
//   paying  — Visibility Plan billed through Stripe
//   granted — Visibility Plan admin gave it, nothing billed (not revenue)
//   free    — everything else
export async function loadClassifiedBusinesses() {
  const [bizRes, subs] = await Promise.all([
    supabase.from("businesses").select("id, status, submitted_at"),
    loadSubscriptions(),
  ]);
  if (bizRes.error) throw bizRes.error;
  const subByBusiness = new Map(subs.map((s) => [s.business_id, s]));
  return (bizRes.data ?? []).map((b) => {
    const sub = subByBusiness.get(b.id) ?? null;
    const bucket = isPayingSubscription(sub) ? "paying" : isAdminGrantedSubscription(sub) ? "granted" : "free";
    return { id: b.id, status: b.status, submittedAt: b.submitted_at, sub, bucket };
  });
}

export const BUCKET_LABELS = {
  paying: "Visibility Plan (paying)",
  granted: "Visibility Plan (admin, not paying)",
  free: "Free",
};

// Money actually collected in a calendar month, from every paid charge —
// subscriptions AND ad-hoc purchases (homepage slots, add-on slots).
function revenueInMonth(payments, year, month) {
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  return Math.round(
    payments.filter((p) => paymentDay(p).slice(0, 7) === key).reduce((sum, p) => sum + paymentAmount(p), 0) * 100
  ) / 100;
}

// ─── Summary KPIs ──────────────────────────────────────────────────────────

export async function getReportingSummary({ range = "6m", tier = "All" } = {}) {
  const { since } = resolveRange(range);
  const sinceIso = since.toISOString();

  const [subs, listingsRes, usersRes, bizRes, occRes, payments] = await Promise.all([
    loadSubscriptions(),
    supabase.from("business_listings").select("business_id, approval_status"),
    supabase.from("business_users").select("id, status, requested_at"),
    supabase.from("businesses").select("id, status, submitted_at"),
    supabase.from("business_events").select("id, status"),
    loadPayments().catch(() => []),
  ]);
  if (listingsRes.error) throw listingsRes.error;
  if (usersRes.error) throw usersRes.error;
  if (bizRes.error) throw bizRes.error;

  const scoped = tier === "All" ? subs : subs.filter((s) => label(s.plan) === tier);
  // Admin-granted Visibility Plans earn nothing, so only Stripe-backed plans
  // count towards revenue and paying accounts.
  const mrr = scoped.reduce((sum, s) => sum + monthlyRevenue(s), 0);
  const paying = scoped.filter(isPayingSubscription).length;
  const adminGranted = scoped.filter(isAdminGrantedSubscription).length;

  const businesses = bizRes.data ?? [];
  const listings = listingsRes.data ?? [];
  const users = usersRes.data ?? [];

  // Opening hours publish without review, so they never sit in a queue —
  // matches AUTO_PUBLISHED_SECTIONS in approvals.js.
  const reviewable = (l) =>
    Object.entries(l.approval_status ?? {}).filter(([section]) => section !== "hours");

  // A listing counts as active once every section of it is approved.
  const isActive = (l) => {
    const states = reviewable(l).map(([, state]) => state);
    return states.length > 0 && states.every((s) => s === "Up to Date");
  };
  const activeListings = listings.filter(isActive).length;

  // Everything still sitting in a queue: listing sections, pending businesses,
  // pending user accounts and unapproved events.
  const pendingSections = listings.reduce(
    (n, l) => n + reviewable(l).filter(([, s]) => s === "Pending Approval").length, 0);
  const pendingBusinesses = businesses.filter((b) => b.status === "Pending").length;
  const pendingUsers = users.filter((u) => u.status === "pending").length;
  const pendingEvents = (occRes.data ?? []).filter((e) => e.status === "Pending Approval").length;

  const thisMonth = monthKey(new Date().toISOString());
  const newUsersThisMonth = users.filter((u) => monthKey(u.requested_at) === thisMonth).length;
  const newUsersInRange = users.filter((u) => u.requested_at && u.requested_at >= sinceIso).length;

  const cancelled = subs.filter((s) => s.cancelled).length;

  // What was actually collected this calendar month versus last, including
  // one-off purchases. `mrr` stays alongside as the recurring rate — the two
  // answer different questions and used to be shown as if they were one.
  const now = new Date();
  const revenueThisMonth = revenueInMonth(payments, now.getFullYear(), now.getMonth());
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const revenueLastMonth = revenueInMonth(payments, last.getFullYear(), last.getMonth());
  const revenueChange = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 1000) / 10
    : null;

  return {
    revenueThisMonth,
    revenueLastMonth,
    revenueChange,
    mrr: Math.round(mrr * 100) / 100,
    mrrChange: 0,
    arpa: paying > 0 ? Math.round(mrr / paying) : 0,
    activeSubscriptions: paying,
    payingSubscriptions: paying,
    adminGrantedSubscriptions: adminGranted,
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
  const all = await loadSubscriptions();
  const subs = tier === "All" ? all : all.filter((s) => label(s.plan) === tier);
  const byTier = {};
  for (const s of subs) {
    const t = planBucket(s);
    byTier[t] ??= { tier: t, revenue: 0, count: 0 };
    byTier[t].revenue += monthlyRevenue(s);
    byTier[t].count += 1;
  }
  const list = Object.values(byTier).sort((a, b) => b.revenue - a.revenue);
  return list;
}

export async function getSubscriptionTrend({ range = "6m", tier = "All" } = {}) {
  const subs = await loadSubscriptions();
  const { since, until } = resolveRange(range);
  const buckets = monthBuckets(since, until);
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
  const { since, until } = resolveRange(range);
  const buckets = monthBuckets(since, until);
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

// Daily buckets between two dates, inclusive — used by the revenue and signup
// sparklines. `range` is either a day-count (trailing from today) or
// { type: "custom", from, to }, matching resolveRange's two shapes.
function dayBuckets(range) {
  let since, until;
  if (range && typeof range === "object" && range.type === "custom") {
    since = new Date(range.from);
    until = new Date(range.to);
  } else {
    until = new Date();
    since = new Date();
    since.setDate(since.getDate() - ((range ?? 30) - 1));
  }
  const out = [];
  const d = new Date(since.getFullYear(), since.getMonth(), since.getDate());
  const end = new Date(until.getFullYear(), until.getMonth(), until.getDate());
  while (d <= end) {
    out.push({ key: d.toISOString().slice(0, 10), date: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}` });
    d.setDate(d.getDate() + 1);
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
      .filter((p) => paymentDay(p) === key)
      .reduce((sum, p) => sum + paymentAmount(p), 0),
  }));
  const total = Math.round(data.reduce((s, d) => s + d.revenue, 0) * 100) / 100;

  // Previous period of equal length, for the "+N% on previous X days" line.
  // Only meaningful for the trailing-days form — a custom range has no
  // natural "previous period" to compare against, so change stays 0.
  let change = 0;
  if (typeof days === "number") {
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - days * 2);
    const prevEnd = new Date();
    prevEnd.setDate(prevEnd.getDate() - days);
    const prevStartKey = prevStart.toISOString().slice(0, 10);
    const prevEndKey = prevEnd.toISOString().slice(0, 10);
    const prevTotal = payments
      .filter((p) => {
        const day = paymentDay(p);
        return day && day >= prevStartKey && day < prevEndKey;
      })
      .reduce((sum, p) => sum + paymentAmount(p), 0);
    change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : 0;
  }

  return { data, total, change };
}

// Dashboard's Platform Overview chart: cumulative businesses on each plan,
// dated by when the business registered. Three lines — Free, paying, and
// admin-granted — because those are the only plans that exist; it used to
// plot Basic, Standard and Agent (retired) and fold paying and admin-granted
// together as "Premium", which hid exactly the difference that matters.
//
// It shows each business's CURRENT plan at the date it joined, since plan
// history isn't recorded — so the right-hand end always matches the other
// figures on the page.
export const SIGNUP_SERIES = ["Free", "Visibility (paying)", "Visibility (admin, not paying)"];
const SERIES_FOR_BUCKET = {
  free: "Free",
  paying: "Visibility (paying)",
  granted: "Visibility (admin, not paying)",
};

export async function getSignupTrend({ days = 30 } = {}) {
  const businesses = await loadClassifiedBusinesses();
  return dayBuckets(days).map(({ key, date }) => {
    const row = { date };
    for (const series of SIGNUP_SERIES) row[series] = 0;
    for (const b of businesses) {
      const joined = String(b.submittedAt ?? "").slice(0, 10);
      if (!joined || joined > key) continue;
      row[SERIES_FOR_BUCKET[b.bucket]] += 1;
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
  // Approved businesses only — a rejected or still-pending registration isn't
  // on the site, so it shouldn't shape what the site's top categories are.
  const [{ data, error }, bizRes] = await Promise.all([
    supabase.from("business_listings").select("business_id, business_type, category"),
    supabase.from("businesses").select("id").eq("status", "Approved"),
  ]);
  if (error) throw error;
  const approved = new Set((bizRes.data ?? []).map((b) => b.id));

  const counts = {};
  for (const l of (data ?? []).filter((r) => approved.has(r.business_id))) {
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
  const businesses = await loadClassifiedBusinesses();
  const counts = {};
  for (const b of businesses) {
    const plan = BUCKET_LABELS[b.bucket];
    counts[plan] = (counts[plan] ?? 0) + 1;
  }
  const rows = Object.entries(counts).map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count);
  const total = rows.reduce((s, d) => s + d.count, 0) || 1;
  // The same colours as the Platform Overview lines, so paying and
  // not-paying read the same way everywhere on the dashboard.
  const colourFor = {
    [BUCKET_LABELS.free]: "#94A3B8",
    [BUCKET_LABELS.paying]: "#16A34A",
    [BUCKET_LABELS.granted]: "#D97706",
  };
  return rows.map((d, i) => ({ ...d, colour: colourFor[d.plan] ?? PALETTE[i % PALETTE.length], pct: Math.round((d.count / total) * 100) }));
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
