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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const CARD = { backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" };

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  revenue: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  subscriptions: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  users: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  content: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  business: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  user: (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, to, pending }) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-2 transition-all hover:-translate-y-0.5 h-full" style={CARD}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: accent === "#E8A33D" ? "rgba(232,163,61,0.1)" : "rgba(45,106,79,0.1)" }}>
          {icon(accent === "#E8A33D" ? "#E8A33D" : "#2D6A4F")}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: "#1B4332" }}>{value}</p>
      </div>
      {pending ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full self-start" style={{ backgroundColor: "rgba(232,163,61,0.12)", color: "#E8A33D" }}>Pending</span>
      ) : (
        <p className="text-xs font-medium" style={{ color: accent }}>{sub}</p>
      )}
    </div>
  );
  return to ? <Link to={to} className="block h-full">{inner}</Link> : inner;
}

// ─── Revenue chart ────────────────────────────────────────────────────────────
const PERIODS = [{ key: 7, label: "7 Days" }, { key: 15, label: "15 Days" }, { key: 30, label: "30 Days" }];

function RevenueCustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-sm shadow-lg" style={{ backgroundColor: "#1B4332", color: "#fff" }}>
      <p className="font-semibold">£{payload[0].value.toLocaleString()}</p>
      <p className="text-xs opacity-70">{label}</p>
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
    <div className="bg-white rounded-2xl p-6" style={CARD}>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Revenue Overview</h2>
          <span className="text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#9CA3AF" }}>?</span>
        </div>
        <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: "#1B4332" }}>
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setDays(p.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={days === p.key ? { backgroundColor: "#fff", color: "#1B4332" } : { color: "rgba(255,255,255,0.7)" }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-3xl font-bold mt-2" style={{ color: "#1B4332" }}>£{trend.total.toLocaleString()}</p>
      <p className="text-sm mt-0.5 font-medium mb-4" style={{ color: up ? "#2D6A4F" : "#991B1B" }}>
        {up ? "↑" : "↓"} {Math.abs(trend.change)}% vs previous {days} days
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={trend.data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.07)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={tickInterval} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
          <Tooltip content={<RevenueCustomTooltip />} cursor={{ stroke: "rgba(27,67,50,0.12)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="revenue" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: "#2D6A4F", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Plan distribution ────────────────────────────────────────────────────────
const PLAN_COLOURS_PIE = { Free: "#52B788", Basic: "#2D6A4F", "Plan 1": "#1B4332", "Plan 2": "#E8A33D" };

function PlanDistributionChart() {
  const { data: plans } = useFetch(getPlanDistribution, []);
  const rows = plans ?? [];
  const total = rows.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col" style={CARD}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Plan Distribution</h2>
        <span className="text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#9CA3AF" }}>?</span>
      </div>
      <div className="relative mx-auto" style={{ width: 170, height: 170 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={54} outerRadius={80} paddingAngle={3} strokeWidth={0}>
              {rows.map((entry) => <Cell key={entry.plan} fill={entry.colour} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [`${v} businesses`, n]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold" style={{ color: "#1B4332" }}>{total}</span>
          <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Total</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 mt-5">
        {rows.map((d) => (
          <div key={d.plan} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.colour }} />
              <span className="text-sm font-semibold" style={{ color: "#1B4332" }}>{d.plan}</span>
            </div>
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#6B7280" }}>{d.pct}% ({d.count})</span>
          </div>
        ))}
      </div>
      <Link to="/admin/subscriptions" className="mt-5 pt-4 text-center text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: "#2D6A4F", borderTop: "1px solid rgba(27,67,50,0.08)" }}>
        View All Plans
      </Link>
    </div>
  );
}

// ─── Platform overview (signup trend) ─────────────────────────────────────────
const PLAN_COLOURS = { Free: "#52B788", "Plan 1": "#2D6A4F", "Plan 2": "#1B4332", "Plan 3": "#E8A33D" };
const PLAN_KEYS = ["Free", "Plan 1", "Plan 2", "Plan 3"];

function SignupTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-lg flex flex-col gap-1" style={{ backgroundColor: "#fff", border: "1px solid rgba(27,67,50,0.12)" }}>
      <p className="font-bold mb-1" style={{ color: "#1B4332" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span style={{ color: "#6B7280" }}>{p.dataKey}</span>
          <span className="font-semibold ml-auto pl-3" style={{ color: "#1B4332" }}>{p.value}</span>
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
    <div className="bg-white rounded-2xl p-6" style={CARD}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Platform Overview</h2>
          <span className="text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#9CA3AF" }}>?</span>
        </div>
        <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: "#1B4332" }}>
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setDays(p.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={days === p.key ? { backgroundColor: "#fff", color: "#1B4332" } : { color: "rgba(255,255,255,0.7)" }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={rows ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.07)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={tickInterval} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<SignupTooltip />} cursor={{ stroke: "rgba(27,67,50,0.1)", strokeWidth: 1 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={(v) => <span style={{ color: "#6B7280" }}>{v}</span>} />
          {PLAN_KEYS.map((k) => (
            <Line key={k} type="monotone" dataKey={k} stroke={PLAN_COLOURS[k]} strokeWidth={2}
              dot={{ r: 3, fill: PLAN_COLOURS[k], strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Top categories ───────────────────────────────────────────────────────────
function TopCategoriesCard() {
  const { data: cats } = useFetch(getTopCategories, []);
  const rows = cats ?? [];
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="bg-white rounded-2xl p-6" style={CARD}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Top Performing Categories</h2>
          <span className="text-xs rounded-full w-4 h-4 flex items-center justify-center" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#9CA3AF" }}>?</span>
        </div>
        <Link to="/admin/listings" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>View All</Link>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.category} className="flex items-center gap-3">
            <span className="text-xl w-7 text-center shrink-0">{r.icon}</span>
            <span className="text-sm font-semibold w-32 shrink-0" style={{ color: "#1B4332" }}>{r.category}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(27,67,50,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: `${(r.count / max) * 100}%`, backgroundColor: r.colour }} />
            </div>
            <span className="text-xs font-semibold w-16 text-right shrink-0" style={{ color: "#6B7280" }}>{r.pct}% ({r.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pending table components ─────────────────────────────────────────────────
function PendingBadge() {
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(232,163,61,0.12)", color: "#E8A33D" }}>
      Pending
    </span>
  );
}

function TableHead({ cols }) {
  return (
    <div className="grid gap-3 pb-2 mb-1" style={{ gridTemplateColumns: cols.map(() => "1fr").join(" "), borderBottom: "1px solid rgba(27,67,50,0.08)" }}>
      {cols.map((c) => (
        <span key={c} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>{c}</span>
      ))}
    </div>
  );
}

// ─── Quick action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, to }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl transition-all hover:-translate-y-0.5 text-center" style={CARD}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold" style={{ color: "#1B4332" }}>{label}</span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: summary, loading: loadingSummary } = useFetch(getReportingSummary, []);
  const { data: approvals } = useFetch(() => getApprovals({ status: "Pending" }), []);
  const { data: pendingBusinesses } = useFetch(() => getBusinesses({ status: "Pending" }), []);
  const { data: pendingUsers } = useFetch(() => getUsers({ status: "Pending" }), []);

  if (loadingSummary) return <LoadingState />;
  const s = summary ?? {};

  return (
    <div className="flex flex-col gap-6 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Overview of the Maidenhead Town Centre Portal.</p>
        </div>
        <span className="text-xs font-medium shrink-0" style={{ color: "#9CA3AF" }}>
          Today, {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {/* ── 6 stat cards in one row ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Icons.revenue}       label="Revenue This Month"   value={`£${(s.mrr ?? 0).toLocaleString()}`}  sub={`${s.mrrChange > 0 ? "+" : ""}${s.mrrChange}% vs last month`} accent="#2D6A4F" to="/admin/subscriptions" />
        <StatCard icon={Icons.subscriptions} label="Active Subscriptions" value={s.activeSubscriptions ?? "—"}          sub={`+${s.subscriptionsChange} this month`}                       accent="#2D6A4F" to="/admin/subscriptions" />
        <StatCard icon={Icons.users}         label="Total Users"          value={s.totalUsers ?? "—"}                   sub={`+${s.newUsersThisMonth} this month`}                         accent="#2D6A4F" to="/admin/users" />
        <StatCard icon={Icons.content}       label="Content Approvals"    value={approvals?.length ?? 0}                accent="#E8A33D" pending to="/admin/approvals" />
        <StatCard icon={Icons.business}      label="Business Approvals"   value={pendingBusinesses?.length ?? 0}        accent="#E8A33D" pending to="/admin/businesses" />
        <StatCard icon={Icons.user}          label="User Approvals"       value={pendingUsers?.length ?? 0}             accent="#E8A33D" pending to="/admin/users" />
      </div>

      {/* ── Row 2: Revenue chart + Plan distribution ────────────────── */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 items-start">
        <div className="min-w-0"><RevenueChart /></div>
        <div className="min-w-0"><PlanDistributionChart /></div>
      </div>

      {/* ── Row 3: Platform chart + Top categories ──────────────────── */}
      <div className="grid lg:grid-cols-[3fr_2fr] gap-6 items-start">
        <div className="min-w-0"><SignupChart /></div>
        <div className="min-w-0"><TopCategoriesCard /></div>
      </div>

      {/* ── Row 4: Pending content + Pending business (side by side) ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Content approvals table */}
        <div className="bg-white rounded-2xl p-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending Content Approvals</h2>
            <Link to="/admin/approvals" className="text-xs font-semibold" style={{ color: "#2D6A4F" }}>View All</Link>
          </div>
          {(approvals ?? []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>All clear — nothing pending. 🎉</p>
          ) : (
            <>
              <TableHead cols={["Title", "Type", "Submitted", "Status"]} />
              <div className="flex flex-col divide-y" style={{ borderColor: "rgba(27,67,50,0.06)" }}>
                {(approvals ?? []).slice(0, 5).map((a) => (
                  <Link key={a.id} to={`/admin/approvals/${a.id}`}
                    className="grid gap-3 py-3 hover:opacity-80 transition-opacity items-center"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <span className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{a.business}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{a.type}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>{timeAgo(a.submittedAt)}</span>
                    <PendingBadge />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Business approvals table */}
        <div className="bg-white rounded-2xl p-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending Business Approvals</h2>
            <Link to="/admin/businesses" className="text-xs font-semibold" style={{ color: "#2D6A4F" }}>View All</Link>
          </div>
          {(pendingBusinesses ?? []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No pending business registrations.</p>
          ) : (
            <>
              <TableHead cols={["Business", "Category", "Plan", "Status"]} />
              <div className="flex flex-col divide-y" style={{ borderColor: "rgba(27,67,50,0.06)" }}>
                {(pendingBusinesses ?? []).slice(0, 5).map((b) => (
                  <div key={b.id} className="grid gap-3 py-3 items-center" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <span className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{b.name}</span>
                    <span className="text-xs truncate" style={{ color: "#6B7280" }}>{b.category}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{b.plan}</span>
                    <PendingBadge />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Row 5: Pending users + Quick actions ────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* User approvals table */}
        <div className="bg-white rounded-2xl p-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending User Approvals</h2>
            <Link to="/admin/users" className="text-xs font-semibold" style={{ color: "#2D6A4F" }}>View All</Link>
          </div>
          {(pendingUsers ?? []).length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No pending user sign-ups.</p>
          ) : (
            <>
              <TableHead cols={["User", "Business", "Role", "Status"]} />
              <div className="flex flex-col divide-y" style={{ borderColor: "rgba(27,67,50,0.06)" }}>
                {(pendingUsers ?? []).slice(0, 5).map((u) => (
                  <Link key={u.id} to={`/admin/users/${u.id}`}
                    className="grid gap-3 py-3 hover:opacity-80 transition-opacity items-center"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                    <span className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{u.name}</span>
                    <span className="text-xs truncate" style={{ color: "#6B7280" }}>{u.business}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{u.role}</span>
                    <PendingBadge />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-6" style={CARD}>
          <h2 className="font-bold text-base mb-5" style={{ color: "#1B4332" }}>Quick Actions</h2>
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
