import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import useFetch from "../../hooks/useFetch";
import {
  getReportingSummary, getApprovals, getBusinesses, getUsers,
  getRevenueTrend, getSignupTrend, getPlanDistribution, getTopCategories,
} from "../../api/admin";
import LoadingState from "../components/LoadingState";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const NAVY    = "#0A192F";
const BRASS   = "#B39258";
const BRASS2  = "#C9A96E";   // lighter brass highlight
const BRASS3  = "#8B6F3E";   // darker brass depth
const BRASS4  = "#7A8C6E";   // muted olive-brass
const OFF     = "#F4F6F9";
const CINZEL  = "'Cinzel', Georgia, serif";
const CARD    = {
  backgroundImage: "linear-gradient(180deg, #ffffff 0%, #f7f5f0 100%)",
  border: "1px solid rgba(10,25,47,0.06)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 5px rgba(10,25,47,0.035), 0 1px 2px rgba(10,25,47,0.06), 0 14px 30px -12px rgba(10,25,47,0.28)",
};
const MUTED   = "#6B7280";
const BORDER  = "rgba(10,25,47,0.08)";

// Refined pastel palette — distinct hues that sit gracefully with navy + brass.
const PASTELS = [
  "#C9A96E", // soft brass / gold
  "#9DBE9C", // sage green
  "#9BB4D4", // dusty blue
  "#C9A6BE", // soft mauve
  "#E2B79A", // warm blush
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Lighten / darken a hex colour toward white / black by amount 0..1 (for metallic gradients).
function mix(hex, amt, toward) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = toward === "white" ? 255 : 0;
  const f = (c) => Math.round(c + (t - c) * amt);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}
const lighten = (hex, amt) => mix(hex, amt, "white");
const darken = (hex, amt) => mix(hex, amt, "black");

// ─── SVG icons for stat cards ─────────────────────────────────────────────────
const Icons = {
  revenue:       (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  subscriptions: (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  users:         (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  content:       (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  business:      (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  user:          (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, pending, to }) {
  const isPending = !!pending;
  const inner = (
    <div className="bg-white rounded-xl p-5 flex flex-col gap-3 h-full transition-all hover:-translate-y-0.5 relative overflow-hidden"
      style={CARD}>
      <span className="absolute top-0 left-0 right-0" style={{ height: 3, backgroundColor: isPending ? BRASS : NAVY }} />
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            backgroundImage: isPending
              ? "linear-gradient(145deg, rgba(179,146,88,0.22), rgba(179,146,88,0.06))"
              : "linear-gradient(145deg, rgba(10,25,47,0.12), rgba(10,25,47,0.03))",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -2px 3px rgba(10,25,47,0.08), 0 2px 4px rgba(10,25,47,0.1)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}>
          {icon(isPending ? BRASS : NAVY)}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: MUTED }}>{label}</p>
        <p className="text-2xl font-bold" style={{ color: NAVY, fontFamily: CINZEL }}>{value}</p>
      </div>
      {isPending
        ? <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded self-start" style={{ backgroundColor: "rgba(179,146,88,0.12)", color: BRASS, border: `1px solid rgba(179,146,88,0.3)` }}>Pending</span>
        : <p className="text-xs font-medium" style={{ color: BRASS3 }}>{sub}</p>
      }
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

// ─── Period selector ──────────────────────────────────────────────────────────
const PERIODS = [{ key: 7, label: "Last 7 Days" }, { key: 15, label: "Last 15 Days" }, { key: 30, label: "Last 30 Days" }];

function PeriodSelector({ days, setDays }) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button key={p.key} onClick={() => setDays(p.key)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={days === p.key
            ? { backgroundColor: NAVY, color: "#fff", border: `1px solid ${NAVY}` }
            : { backgroundColor: "transparent", color: MUTED, border: "1px solid rgba(10,25,47,0.15)" }
          }>
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ─── Revenue chart ────────────────────────────────────────────────────────────
function RevTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-sm shadow-lg" style={{ backgroundColor: NAVY, color: "#fff" }}>
      <p className="font-semibold" style={{ fontFamily: CINZEL }}>£{payload[0].value.toLocaleString()}</p>
      <p className="text-xs opacity-60 mt-0.5">{label}</p>
    </div>
  );
}

function RevenueChart() {
  const [days, setDays] = useState(7);
  const { data } = useFetch(() => getRevenueTrend({ days }), [days]);
  const trend = data ?? { data: [], total: 0, change: 0 };
  const up = trend.change >= 0;
  const tickInterval = days === 7 ? 0 : days === 15 ? 2 : 4;

  return (
    <div className="bg-white rounded-xl p-6 h-full flex flex-col" style={CARD}>
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap gap-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base" style={{ color: NAVY, fontFamily: CINZEL }}>Revenue Overview</h2>
          <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(10,25,47,0.07)", color: MUTED }}>i</span>
        </div>
        <PeriodSelector days={days} setDays={setDays} />
      </div>
      <p className="text-3xl font-bold mt-2" style={{ color: NAVY, fontFamily: CINZEL }}>£{trend.total.toLocaleString()}</p>
      <p className="text-sm mt-0.5 mb-5 font-medium" style={{ color: up ? BRASS3 : "#991B1B" }}>
        {up ? "+" : ""}{trend.change}% on previous {days} days
      </p>
      <div className="flex-1 min-h-0" style={{ minHeight: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trend.data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="brassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BRASS}  stopOpacity={0.22} />
              <stop offset="95%" stopColor={BRASS}  stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} interval={tickInterval} padding={{ right: 12 }} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
          <Tooltip content={<RevTooltip />} cursor={{ stroke: BORDER, strokeWidth: 1 }} />
          <Area type="monotone" dataKey="revenue" stroke={BRASS} strokeWidth={2} fill="url(#brassGrad)" dot={false} activeDot={{ r: 4, fill: BRASS, strokeWidth: 0 }} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Plan distribution ────────────────────────────────────────────────────────
// Distinct pastel palette for the donut segments
const PIE_COLOURS = PASTELS;

function PlanDistributionChart() {
  const { data: plans } = useFetch(getPlanDistribution, []);
  const rows = plans ?? [];
  const total = rows.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-xl p-6 flex flex-col h-full" style={CARD}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-semibold text-base" style={{ color: NAVY, fontFamily: CINZEL }}>Plan Distribution</h2>
        <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(10,25,47,0.07)", color: MUTED }}>i</span>
      </div>
      <div className="relative mx-auto" style={{ width: 170, height: 170, filter: "drop-shadow(0 8px 12px rgba(10,25,47,0.28))" }}>
        <PieChart width={170} height={170}>
          <defs>
            {PIE_COLOURS.map((c, i) => (
              <radialGradient key={i} id={`pieMetal${i}`} cx="38%" cy="32%" r="75%">
                <stop offset="0%"  stopColor={lighten(c, 0.5)} />
                <stop offset="45%" stopColor={c} />
                <stop offset="100%" stopColor={darken(c, 0.35)} />
              </radialGradient>
            ))}
          </defs>
          <Pie data={rows} dataKey="count" nameKey="plan" cx={85} cy={85} innerRadius={54} outerRadius={80} paddingAngle={2} stroke="rgba(255,255,255,0.55)" strokeWidth={1} isAnimationActive={false}>
            {rows.map((_, i) => <Cell key={i} fill={`url(#pieMetal${i % PIE_COLOURS.length})`} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} businesses`, n]}
            contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(10,25,47,0.1)", fontSize: 12 }} />
        </PieChart>
        {/* glossy highlight sweep */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(60% 45% at 36% 28%, rgba(255,255,255,0.45), rgba(255,255,255,0) 60%)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold" style={{ color: NAVY, fontFamily: CINZEL }}>{total}</span>
          <span className="text-xs font-medium mt-0.5" style={{ color: MUTED }}>Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 mt-5">
        {rows.map((d, i) => (
          <div key={d.plan} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLOURS[i % PIE_COLOURS.length] }} />
              <span className="text-sm font-medium" style={{ color: NAVY }}>{d.plan}</span>
            </div>
            <span className="text-xs font-medium" style={{ color: MUTED }}>{d.pct}% ({d.count})</span>
          </div>
        ))}
      </div>
      <Link to="/admin/subscriptions" className="mt-5 pt-4 text-center text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: NAVY, borderTop: `1px solid ${BORDER}`, fontFamily: CINZEL }}>
        View All Plans
      </Link>
    </div>
  );
}

// ─── Platform overview ────────────────────────────────────────────────────────
const PLAN_COLOURS = {
  Free: PASTELS[0], "Plan 1": PASTELS[1], "Plan 2": PASTELS[2], "Plan 3": PASTELS[3],
};
const PLAN_KEYS = ["Free", "Plan 1", "Plan 2", "Plan 3"];

function SignupTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2.5 text-xs shadow-lg" style={{ backgroundColor: "#fff", border: `1px solid ${BORDER}` }}>
      <p className="font-semibold mb-1.5" style={{ color: NAVY, fontFamily: CINZEL }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span style={{ color: MUTED }}>{p.dataKey}</span>
          <span className="font-semibold ml-auto pl-3" style={{ color: NAVY }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function SignupChart() {
  const [days, setDays] = useState(7);
  const { data: rows } = useFetch(() => getSignupTrend({ days }), [days]);
  const tickInterval = days === 7 ? 0 : days === 15 ? 2 : 4;

  return (
    <div className="bg-white rounded-xl p-6 h-full flex flex-col" style={CARD}>
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap gap-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base" style={{ color: NAVY, fontFamily: CINZEL }}>Platform Overview</h2>
          <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(10,25,47,0.07)", color: MUTED }}>i</span>
        </div>
        <PeriodSelector days={days} setDays={setDays} />
      </div>
      <div className="flex-1 min-h-0" style={{ minHeight: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows ?? []} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} interval={tickInterval} padding={{ right: 12 }} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<SignupTooltip />} cursor={{ stroke: BORDER, strokeWidth: 1 }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            formatter={(v) => <span style={{ color: MUTED }}>{v}</span>} />
          {PLAN_KEYS.map((k) => (
            <Line key={k} type="monotone" dataKey={k} stroke={PLAN_COLOURS[k]} strokeWidth={2.5}
              dot={{ r: 3, fill: PLAN_COLOURS[k], strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Top categories ───────────────────────────────────────────────────────────
const CAT_COLOURS = PASTELS;

function TopCategoriesCard() {
  const { data: cats } = useFetch(getTopCategories, []);
  const rows = cats ?? [];
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="bg-white rounded-xl p-6 h-full flex flex-col" style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base" style={{ color: NAVY, fontFamily: CINZEL }}>Top Performing Categories</h2>
          <span className="text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(10,25,47,0.07)", color: MUTED }}>i</span>
        </div>
        <Link to="/admin/listings" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: BRASS }}>View All</Link>
      </div>
      <div className="flex flex-col gap-4 flex-1 justify-center">
        {rows.map((r, i) => (
          <div key={r.category} className="flex items-center gap-3">
            <span className="text-base w-6 text-center shrink-0">{r.icon}</span>
            <span className="text-sm font-medium w-32 shrink-0" style={{ color: NAVY }}>{r.category}</span>
            <div className="lux-track flex-1 rounded-full overflow-hidden" style={{ height: 8 }}>
              <div className="lux-fill h-full rounded-full transition-all duration-500"
                style={{ width: `${(r.count / max) * 100}%`, backgroundImage: `linear-gradient(180deg, ${lighten(CAT_COLOURS[i % CAT_COLOURS.length], 0.35)}, ${CAT_COLOURS[i % CAT_COLOURS.length]} 55%, ${darken(CAT_COLOURS[i % CAT_COLOURS.length], 0.2)})` }} />
            </div>
            <span className="text-xs font-medium w-16 text-right shrink-0" style={{ color: MUTED }}>
              {r.pct}% ({r.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pending table helpers ────────────────────────────────────────────────────
function PendingBadge() {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: "rgba(179,146,88,0.1)", color: BRASS, border: "1px solid rgba(179,146,88,0.3)" }}>
      Pending
    </span>
  );
}

function TableHead({ cols }) {
  return (
    <div className="grid gap-3 pb-2 mb-1" style={{ gridTemplateColumns: cols.map(() => "1fr").join(" "), borderBottom: `1px solid ${BORDER}` }}>
      {cols.map((c) => (
        <span key={c} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{c}</span>
      ))}
    </div>
  );
}

// ─── Quick action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, to }) {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: OFF, border: `1px solid ${BORDER}` }}>
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium" style={{ color: NAVY, fontFamily: CINZEL }}>{label}</span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: summary, loading: loadingSummary } = useFetch(getReportingSummary, []);
  const { data: approvals }        = useFetch(() => getApprovals({ status: "Pending" }), []);
  const { data: pendingBusinesses } = useFetch(() => getBusinesses({ status: "Pending" }), []);
  const { data: pendingUsers }     = useFetch(() => getUsers({ status: "Pending" }), []);

  if (loadingSummary) return <LoadingState />;
  const s = summary ?? {};

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: NAVY, fontFamily: CINZEL }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: MUTED }}>Overview of the Maidenhead Town Centre Portal.</p>
        </div>
        <span className="text-xs font-medium shrink-0" style={{ color: MUTED }}>
          Today, {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {/* ── 6 stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Icons.revenue}       label="Revenue This Month"   value={`£${(s.mrr ?? 0).toLocaleString()}`}  sub={`+${s.mrrChange}% on this month`}     to="/admin/subscriptions" />
        <StatCard icon={Icons.subscriptions} label="Active Subscriptions" value={s.activeSubscriptions ?? "—"}          sub={`+${s.subscriptionsChange} this month`} to="/admin/subscriptions" />
        <StatCard icon={Icons.users}         label="Total Users"          value={s.totalUsers ?? "—"}                   sub={`+${s.newUsersThisMonth} this month`}   to="/admin/users" />
        <StatCard icon={Icons.content}       label="Content Approvals"    value={approvals?.length ?? 0}                pending to="/admin/approvals" />
        <StatCard icon={Icons.business}      label="Business Approvals"   value={pendingBusinesses?.length ?? 0}        pending to="/admin/businesses" />
        <StatCard icon={Icons.user}          label="User Approvals"       value={pendingUsers?.length ?? 0}             pending to="/admin/users" />
      </div>

      {/* ── Revenue + Plan distribution ── */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 items-stretch">
        <div className="min-w-0 h-full"><RevenueChart /></div>
        <div className="min-w-0 h-full"><PlanDistributionChart /></div>
      </div>

      {/* ── Platform + Top categories ── */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 items-stretch">
        <div className="min-w-0 h-full"><SignupChart /></div>
        <div className="min-w-0 h-full"><TopCategoriesCard /></div>
      </div>

      {/* ── Pending content + Pending business ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: NAVY, fontFamily: CINZEL }}>Pending Content Approvals</h2>
            <Link to="/admin/approvals" className="text-xs font-medium" style={{ color: BRASS }}>View All</Link>
          </div>
          {(approvals ?? []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: MUTED }}>All clear — nothing pending.</p>
          ) : (
            <>
              <TableHead cols={["Title", "Type", "Submitted", "Status"]} />
              <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {(approvals ?? []).slice(0, 5).map((a) => (
                  <Link key={a.id} to={`/admin/approvals/${a.id}`}
                    className="grid gap-3 py-3 hover:opacity-75 transition-opacity items-center"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <span className="text-sm font-medium truncate" style={{ color: NAVY }}>{a.business}</span>
                    <span className="text-xs" style={{ color: MUTED }}>{a.type}</span>
                    <span className="text-xs" style={{ color: MUTED }}>{timeAgo(a.submittedAt)}</span>
                    <PendingBadge />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: NAVY, fontFamily: CINZEL }}>Pending Business Approvals</h2>
            <Link to="/admin/businesses" className="text-xs font-medium" style={{ color: BRASS }}>View All</Link>
          </div>
          {(pendingBusinesses ?? []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: MUTED }}>No pending business registrations.</p>
          ) : (
            <>
              <TableHead cols={["Business", "Category", "Plan", "Status"]} />
              <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {(pendingBusinesses ?? []).slice(0, 5).map((b) => (
                  <div key={b.id} className="grid gap-3 py-3 items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <span className="text-sm font-medium truncate" style={{ color: NAVY }}>{b.name}</span>
                    <span className="text-xs truncate" style={{ color: MUTED }}>{b.category}</span>
                    <span className="text-xs" style={{ color: MUTED }}>{b.plan}</span>
                    <PendingBadge />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Pending users + Quick actions ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: NAVY, fontFamily: CINZEL }}>Pending User Approvals</h2>
            <Link to="/admin/users" className="text-xs font-medium" style={{ color: BRASS }}>View All</Link>
          </div>
          {(pendingUsers ?? []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: MUTED }}>No pending user sign-ups.</p>
          ) : (
            <>
              <TableHead cols={["User", "Business", "Role", "Status"]} />
              <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                {(pendingUsers ?? []).slice(0, 5).map((u) => (
                  <Link key={u.id} to={`/admin/users/${u.id}`}
                    className="grid gap-3 py-3 hover:opacity-75 transition-opacity items-center"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <span className="text-sm font-medium truncate" style={{ color: NAVY }}>{u.name}</span>
                    <span className="text-xs truncate" style={{ color: MUTED }}>{u.business}</span>
                    <span className="text-xs" style={{ color: MUTED }}>{u.role}</span>
                    <PendingBadge />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl p-6" style={CARD}>
          <h2 className="font-semibold text-sm mb-5" style={{ color: NAVY, fontFamily: CINZEL }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon="➕" label="Add Listing"  to="/admin/listings" />
            <QuickAction icon="📅" label="Add Event"    to="/admin/events-news" />
            <QuickAction icon="🗺" label="Add Project"  to="/admin/projects" />
            <QuickAction icon="📊" label="View Reports" to="/admin/reporting" />
          </div>
        </div>
      </div>

    </div>
  );
}
