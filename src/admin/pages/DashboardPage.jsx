import { useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import useFetch from "../../hooks/useFetch";
import { getReportingSummary, getApprovals, getBusinesses, getUsers, getRevenueTrend, getSignupTrend, getPlanDistribution } from "../../api/admin";
import LoadingState from "../components/LoadingState";
import StatusTag from "../components/StatusTag";

function StatCard({ label, value, sub, accent = "#2D6A4F", to }) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-1 transition-all hover:-translate-y-0.5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>{label}</span>
      <span className="text-3xl font-bold" style={{ color: "#1B4332" }}>{value}</span>
      {sub && <span className="text-xs font-medium" style={{ color: accent }}>{sub}</span>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function QuickAction({ icon, label, to }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl transition-all hover:-translate-y-0.5 text-center" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold" style={{ color: "#1B4332" }}>{label}</span>
    </Link>
  );
}

const PERIODS = [
  { key: 7, label: "Last 7 Days" },
  { key: 15, label: "Last 15 Days" },
  { key: 30, label: "Last 30 Days" },
];

function CustomTooltip({ active, payload, label }) {
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

  // Thin the x-axis labels so they don't crowd
  const tickInterval = days === 7 ? 0 : days === 15 ? 2 : 4;

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Revenue Overview</h2>
            <span className="text-xs rounded-full px-1.5 py-0.5" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#6B7280" }}>ⓘ</span>
          </div>
          <p className="text-3xl font-bold mt-1" style={{ color: "#1B4332" }}>£{trend.total.toLocaleString()}</p>
          <p className="text-sm mt-0.5 font-medium" style={{ color: up ? "#2D6A4F" : "#991B1B" }}>
            {up ? "↑" : "↓"} {Math.abs(trend.change)}% vs previous {days} days
          </p>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 rounded-xl p-1 shrink-0" style={{ backgroundColor: "rgba(27,67,50,0.05)" }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setDays(p.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={days === p.key ? { backgroundColor: "#1B4332", color: "#fff" } : { color: "#6B7280" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={trend.data} margin={{ top: 16, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.07)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={tickInterval} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(27,67,50,0.15)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="revenue" stroke="#2D6A4F" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: "#2D6A4F", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const PLAN_COLOURS = {
  Free: "#52B788",
  "Plan 1": "#2D6A4F",
  "Plan 2": "#1B4332",
  "Plan 3": "#E8A33D",
};

const PLAN_KEYS = ["Free", "Plan 1", "Plan 2", "Plan 3"];

function SignupCustomTooltip({ active, payload, label }) {
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
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Platform Overview</h2>
          <span className="text-xs rounded-full px-1.5 py-0.5" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#6B7280" }}>ⓘ</span>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 rounded-xl p-1 shrink-0" style={{ backgroundColor: "rgba(27,67,50,0.05)" }}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setDays(p.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={days === p.key ? { backgroundColor: "#1B4332", color: "#fff" } : { color: "#6B7280" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rows ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {PLAN_KEYS.map((k) => (
              <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PLAN_COLOURS[k]} stopOpacity={0.12} />
                <stop offset="95%" stopColor={PLAN_COLOURS[k]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.07)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={tickInterval} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<SignupCustomTooltip />} cursor={{ stroke: "rgba(27,67,50,0.1)", strokeWidth: 1 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>}
          />
          {PLAN_KEYS.map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={PLAN_COLOURS[k]}
              strokeWidth={2.5}
              dot={{ r: 3, fill: PLAN_COLOURS[k], strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlanDistributionChart() {
  const { data: plans } = useFetch(getPlanDistribution, []);
  const rows = plans ?? [];
  const total = rows.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <div className="flex items-center gap-1.5 mb-4">
        <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Plan Distribution</h2>
        <span className="text-xs rounded-full px-1.5 py-0.5" style={{ backgroundColor: "rgba(27,67,50,0.07)", color: "#6B7280" }}>ⓘ</span>
      </div>

      <div className="flex items-center gap-6 flex-1">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                strokeWidth={0}
              >
                {rows.map((entry) => (
                  <Cell key={entry.plan} fill={entry.colour} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} businesses`, name]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold" style={{ color: "#1B4332" }}>{total.toLocaleString()}</span>
            <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {rows.map((d) => (
            <div key={d.plan} className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.colour }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{d.plan}</span>
                  <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#6B7280" }}>{d.pct}% ({d.count})</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(27,67,50,0.08)" }}>
                  <div className="h-full rounded-full" style={{ width: `${d.pct}%`, backgroundColor: d.colour }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/admin/subscriptions"
        className="mt-5 pt-4 text-center text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: "#2D6A4F", borderTop: "1px solid rgba(27,67,50,0.08)" }}
      >
        View All Plans
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { data: summary, loading: loadingSummary } = useFetch(getReportingSummary, []);
  const { data: approvals } = useFetch(() => getApprovals({ status: "Pending" }), []);
  const { data: pendingBusinesses } = useFetch(() => getBusinesses({ status: "Pending" }), []);
  const { data: pendingUsers } = useFetch(() => getUsers({ status: "Pending" }), []);

  if (loadingSummary) return <LoadingState />;

  const s = summary ?? {};

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Overview of the Maidenhead Town Centre Portal.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue this Month" value={`£${(s.mrr ?? 0).toLocaleString()}`} sub={`${s.mrrChange > 0 ? "+" : ""}${s.mrrChange}% vs last month`} accent="#2D6A4F" to="/admin/subscriptions" />
        <StatCard label="Active Subscriptions" value={s.activeSubscriptions ?? "—"} sub={`${s.subscriptionsChange > 0 ? "+" : ""}${s.subscriptionsChange} this month`} accent="#2D6A4F" to="/admin/subscriptions" />
        <StatCard label="Pending Approvals" value={approvals?.length ?? "—"} sub="Awaiting review" accent="#E8A33D" to="/admin/approvals" />
        <StatCard label="Total Users" value={s.totalUsers ?? "—"} sub={`+${s.newUsersThisMonth} this month`} accent="#2D6A4F" to="/admin/users" />
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <RevenueChart />
          <SignupChart />
        </div>
        <div style={{ width: 320 }}>
          <PlanDistributionChart />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending content approvals */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending Content</h2>
            <Link to="/admin/approvals" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>View all →</Link>
          </div>
          {(approvals ?? []).length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>All clear — nothing pending. 🎉</p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: "rgba(27,67,50,0.08)" }}>
              {(approvals ?? []).slice(0, 5).map((a) => (
                <Link key={a.id} to={`/admin/approvals/${a.id}`} className="py-3 flex items-start justify-between gap-3 hover:opacity-80 transition-opacity">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{a.business}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{a.type} — {a.summary}</p>
                  </div>
                  <StatusTag status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending business registrations */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending Businesses</h2>
            <Link to="/admin/businesses" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>View all →</Link>
          </div>
          {(pendingBusinesses ?? []).length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>No pending business registrations.</p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: "rgba(27,67,50,0.08)" }}>
              {(pendingBusinesses ?? []).slice(0, 5).map((b) => (
                <div key={b.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{b.name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{b.category} · {b.plan}</p>
                  </div>
                  <StatusTag status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending user sign-ups */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending Sign-ups</h2>
            <Link to="/admin/users" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>View all →</Link>
          </div>
          {(pendingUsers ?? []).length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>No pending user sign-ups.</p>
          ) : (
            <div className="flex flex-col divide-y" style={{ borderColor: "rgba(27,67,50,0.08)" }}>
              {(pendingUsers ?? []).slice(0, 5).map((u) => (
                <Link key={u.id} to={`/admin/users/${u.id}`} className="py-3 flex items-start justify-between gap-3 hover:opacity-80 transition-opacity">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{u.name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{u.business} · {u.role}</p>
                  </div>
                  <StatusTag status={u.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-base mb-4" style={{ color: "#1B4332" }}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction icon="➕" label="Add Listing" to="/admin/listings" />
          <QuickAction icon="📅" label="Add Event" to="/admin/events-news" />
          <QuickAction icon="🗺" label="Add Project" to="/admin/projects" />
          <QuickAction icon="📊" label="View Reports" to="/admin/reporting" />
        </div>
      </div>
    </div>
  );
}
