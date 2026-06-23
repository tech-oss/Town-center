import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getReportingSummary } from "../../api/admin";
import { getApprovals } from "../../api/admin";
import { getRecentActivity } from "../../api/admin";
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

export default function DashboardPage() {
  const { data: summary, loading: loadingSummary } = useFetch(getReportingSummary, []);
  const { data: approvals } = useFetch(() => getApprovals({ status: "Pending" }), []);
  const { data: activity } = useFetch(getRecentActivity, []);

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
        <StatCard label="Monthly Revenue" value={`£${(s.mrr ?? 0).toLocaleString()}`} sub={`${s.mrrChange > 0 ? "+" : ""}${s.mrrChange}% vs last month`} accent="#2D6A4F" to="/admin/subscriptions" />
        <StatCard label="Active Subscriptions" value={s.activeSubscriptions ?? "—"} sub={`${s.subscriptionsChange > 0 ? "+" : ""}${s.subscriptionsChange} this month`} accent="#2D6A4F" to="/admin/subscriptions" />
        <StatCard label="Pending Approvals" value={approvals?.length ?? "—"} sub="Awaiting review" accent="#E8A33D" to="/admin/approvals" />
        <StatCard label="Total Users" value={s.totalUsers ?? "—"} sub={`+${s.newUsersThisMonth} this month`} accent="#2D6A4F" to="/admin/users" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1B4332" }}>Pending Approvals</h2>
            <Link to="/admin/approvals" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "#2D6A4F" }}>View all →</Link>
          </div>
          {(approvals ?? []).length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "#9CA3AF" }}>All clear — nothing pending. 🎉</p>
          )}
          <div className="flex flex-col divide-y" style={{ divideColor: "rgba(27,67,50,0.08)" }}>
            {(approvals ?? []).slice(0, 4).map((a) => (
              <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#1B4332" }}>{a.business}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{a.type} — {a.summary}</p>
                </div>
                <StatusTag status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(13,42,51,0.07)", border: "1px solid rgba(27,67,50,0.08)" }}>
          <h2 className="font-bold text-base mb-5" style={{ color: "#1B4332" }}>Recent Activity</h2>
          <div className="flex flex-col gap-4">
            {(activity ?? []).map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#2D6A4F" }}>
                  {a.user?.name?.[0] ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-snug" style={{ color: "#1B4332" }}>{a.user?.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{a.action}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>
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
