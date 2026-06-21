import useFetch from "../../hooks/useFetch";
import { getReportingSummary, getRevenueByTier, getSubscriptionTrend, getActivityTrend } from "../../api/admin";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import LoadingState from "../components/LoadingState";

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <h3 className="font-bold text-sm mb-4" style={{ color: "#1B4332" }}>{title}</h3>
      {children}
    </div>
  );
}

function StatBadge({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 rounded-xl" style={{ backgroundColor: "rgba(27,67,50,0.04)", border: "1px solid rgba(27,67,50,0.08)" }}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-2xl font-bold" style={{ color: "#1B4332" }}>{value}</span>
      {sub && <span className="text-xs font-medium" style={{ color: "#2D6A4F" }}>{sub}</span>}
    </div>
  );
}

const TIER_COLOURS = { Premium: "#1B4332", Standard: "#2D6A4F", Agent: "#52B788", Basic: "#D8F3DC" };

export default function ReportingPage() {
  const { data: summary, loading: loadingS } = useFetch(getReportingSummary, []);
  const { data: revenueByTier, loading: loadingR } = useFetch(getRevenueByTier, []);
  const { data: subTrend, loading: loadingT } = useFetch(getSubscriptionTrend, []);
  const { data: activityTrend, loading: loadingA } = useFetch(getActivityTrend, []);

  if (loadingS || loadingR || loadingT || loadingA) return <LoadingState />;

  const s = summary ?? {};

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1B4332" }}>Reporting</h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Revenue, subscriptions, and activity for Maidenhead Town Centre Portal.</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge label="MRR" value={`£${(s.mrr ?? 0).toLocaleString()}`} sub={`${s.mrrChange > 0 ? "+" : ""}${s.mrrChange}% vs last month`} />
        <StatBadge label="Active Subscriptions" value={s.activeSubscriptions ?? "—"} sub={`+${s.subscriptionsChange} this month`} />
        <StatBadge label="Total Listings" value={s.totalListings ?? "—"} />
        <StatBadge label="Total Users" value={s.totalUsers ?? "—"} sub={`+${s.newUsersThisMonth} this month`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by tier */}
        <Card title="Revenue by Tier (this month)">
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
        <Card title="Subscriptions by Tier (6 months)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={subTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,67,50,0.08)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.keys(TIER_COLOURS).map((tier) => (
                <Line key={tier} type="monotone" dataKey={tier} stroke={TIER_COLOURS[tier]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity trend */}
        <Card title="User Activity (6 months)">
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

        {/* Tier breakdown */}
        <Card title="Tier Breakdown">
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
      </div>
    </div>
  );
}
