import { useState } from "react";
import useFetch from "../../hooks/useFetch";
import {
  getReportingSummary,
  getRevenueByTier,
  getSubscriptionTrend,
  getActivityTrend,
  getListingsBySection,
} from "../../api/admin";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import LoadingState from "../components/LoadingState";

function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <div className="mb-4">
        <h3 className="font-bold text-sm" style={{ color: "#1B4332" }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function StatBadge({ label, value, sub, accent = "#2D6A4F" }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-xl" style={{ backgroundColor: "rgba(27,67,50,0.04)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-2xl font-bold" style={{ color: "#1B4332" }}>{value}</span>
      {sub && <span className="text-xs font-medium" style={{ color: accent }}>{sub}</span>}
    </div>
  );
}

const TIER_COLOURS = { Premium: "#1B4332", Standard: "#2D6A4F", Agent: "#52B788", Basic: "#D8F3DC" };
const SECTION_COLOURS = ["#1B4332", "#2D6A4F", "#52B788"];

const RANGES = [
  { key: "30d", label: "Last 30 days" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "12m", label: "Last 12 months" },
];
const TIERS = ["All", "Premium", "Standard", "Agent", "Basic"];

export default function ReportingPage() {
  const [range, setRange] = useState("6m");
  const [tier, setTier] = useState("All");

  const { data: summary, loading: loadingS } = useFetch(() => getReportingSummary({ range, tier }), [range, tier]);
  const { data: revenueByTier, loading: loadingR } = useFetch(() => getRevenueByTier({ tier }), [tier]);
  const { data: subTrend, loading: loadingT } = useFetch(() => getSubscriptionTrend({ range, tier }), [range, tier]);
  const { data: activityTrend, loading: loadingA } = useFetch(() => getActivityTrend({ range }), [range]);
  const { data: bySection } = useFetch(getListingsBySection, []);

  if (loadingS || loadingR || loadingT || loadingA) return <LoadingState />;

  const s = summary ?? {};
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? "";
  const visibleTiers = tier === "All" ? Object.keys(TIER_COLOURS) : [tier];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Reporting</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Revenue, subscriptions, listings and activity for Maidenhead Town Centre Portal.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
        <label className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Date range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm font-medium outline-none"
            style={{ border: "1.5px solid rgba(27,67,50,0.2)", color: "#1B4332", backgroundColor: "#fff" }}
          >
            {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </label>

        <span className="hidden sm:block w-px self-stretch my-1" style={{ backgroundColor: "rgba(27,67,50,0.1)" }} />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Tier</span>
          <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "rgba(27,67,50,0.05)" }}>
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={tier === t ? { backgroundColor: "#1B4332", color: "#fff" } : { color: "#6B7280" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="MRR" value={`£${(s.mrr ?? 0).toLocaleString()}`} sub={`${s.mrrChange > 0 ? "+" : ""}${s.mrrChange}% vs last month`} />
        <StatBadge label="Active Subscriptions" value={s.activeSubscriptions ?? "—"} sub={`+${s.subscriptionsChange} this month`} />
        <StatBadge label="Total Active Listings" value={s.activeListings ?? "—"} sub={`${s.totalListings} total`} />
        <StatBadge label="Total Users" value={s.totalUsers ?? "—"} sub={`+${s.newUsersInRange} in ${rangeLabel.replace("Last ", "")}`} />
      </div>

      {/* Secondary KPIs — admin-focused operational metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="Avg. Revenue / Account" value={`£${s.arpa ?? 0}`} sub="paying accounts" />
        <StatBadge label="Churn Rate" value={`${s.churnRate ?? 0}%`} sub="last 30 days" accent="#E8A33D" />
        <StatBadge label="Trial → Paid" value={`${s.conversionRate ?? 0}%`} sub={`${s.trialsActive} trials active`} />
        <StatBadge label="Pending Approvals" value={s.pendingApprovals ?? "—"} sub="awaiting review" accent="#E8A33D" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by tier */}
        <Card title="Revenue by Tier" subtitle={`This month${tier !== "All" ? ` · ${tier}` : ""}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByTier} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.08)" />
              <XAxis dataKey="tier" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v) => [`£${v}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="revenue" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Subscriptions by tier over time */}
        <Card title="Subscriptions by Tier" subtitle={rangeLabel}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={subTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {visibleTiers.map((t) => (
                <Line key={t} type="monotone" dataKey={t} stroke={TIER_COLOURS[t]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity trend */}
        <Card title="User Activity" subtitle={`Logins & new listings · ${rangeLabel}`}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="logins" stroke="#1B4332" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="listings" stroke="#52B788" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Listings by section */}
        <Card title="Active Listings by Section" subtitle="Current directory breakdown">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySection ?? []} layout="vertical" barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
              <YAxis type="category" dataKey="section" tick={{ fontSize: 11, fill: "#6B7280" }} width={90} />
              <Tooltip formatter={(v) => [v, "Listings"]} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#2D6A4F" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom row: tier breakdown + listings status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Tier Breakdown" subtitle="Accounts and monthly revenue per tier">
          <div className="flex flex-col gap-3">
            {(revenueByTier ?? []).map((t) => {
              const maxRevenue = Math.max(...(revenueByTier ?? []).map((x) => x.revenue), 1);
              return (
                <div key={t.tier} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#1B4332" }}>{t.tier}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{t.count} accounts · £{t.revenue}/mo</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(27,67,50,0.1)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(t.revenue / maxRevenue) * 100}%`, backgroundColor: TIER_COLOURS[t.tier] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Listings by Status" subtitle="Health of the business directory">
          <div className="flex flex-col gap-3">
            {Object.entries(s.listingsByStatus ?? {}).map(([status, count], i) => {
              const total = Object.values(s.listingsByStatus ?? {}).reduce((a, b) => a + b, 0) || 1;
              const colour = status === "Active" ? "#2D6A4F" : status === "Pending" ? "#E8A33D" : "#991B1B";
              return (
                <div key={status} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: "#1B4332" }}>{status}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{count} · {Math.round((count / total) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(27,67,50,0.1)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: colour }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
