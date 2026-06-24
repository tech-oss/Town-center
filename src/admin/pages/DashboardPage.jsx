import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import { getReportingSummary, getApprovals, getBusinesses, getUsers } from "../../api/admin";
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
