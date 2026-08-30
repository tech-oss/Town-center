import { Link } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast } from "../components/FormKit";
import {
  DASHBOARD_ACTIVITY, PROFILE_COMPLETENESS, BUSINESS_SUPPORT_TICKETS, BUSINESS_ARTICLES,
} from "../../Data/businessPortalMock";

const FOREST = "var(--forest)", SAGE = "var(--sage)", MUTED = "#64748B", BORDER = "rgba(28,46,56,0.12)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(28,46,56,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-1" style={CARD}>
      <span className="text-2xl font-bold" style={{ color: FOREST }}>{value}</span>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {sub && <span className="text-[11px] mt-1" style={{ color: "#0F766E" }}>{sub}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, toggleVisibility } = useBusinessAuth();
  const [toast, setToast] = useToast();

  const activity = DASHBOARD_ACTIVITY[user.id] ?? [];
  const completeness = PROFILE_COMPLETENESS[user.id] ?? { percent: 100, missing: [] };
  const openTickets = (BUSINESS_SUPPORT_TICKETS[user.id] ?? []).filter((t) => t.status !== "Resolved").length;
  const articles = BUSINESS_ARTICLES[user.id] ?? [];
  const liveArticles = articles.filter((a) => a.status === "Live").length;

  function handleToggle() {
    toggleVisibility();
    // TODO: update Supabase visibility field
    setToast(user.visible ? "Your profile is now hidden from the public site." : "Your profile is now live.");
  }

  return (
    <BusinessLayout>
      <Toast message={toast} />
      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Welcome back, {user.businessName}.</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Here's how your listing is performing.</p>
        </div>

        {/* Subscription banner */}
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: `linear-gradient(135deg, ${FOREST} 0%, #245C63 60%, ${SAGE} 100%)` }}>
          <p className="text-sm text-white">Your <strong className="capitalize">{user.plan.replace(/-/g, " ")}</strong> plan renews on <strong>{new Date(user.renewalDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>.</p>
          <Link to="/business/billing" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>Manage Billing</Link>
        </div>

        {/* Visibility toggle */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap" style={CARD}>
          <div>
            <p className="text-sm font-bold" style={{ color: FOREST }}>My profile is currently {user.visible ? "Live" : "Hidden"}</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{user.visible ? "Visible to everyone on the public site." : "Hidden from the public site until you switch it back on."}</p>
          </div>
          <button onClick={handleToggle}
            className="w-14 h-7 rounded-full transition-colors flex items-center px-1 shrink-0"
            style={{ backgroundColor: user.visible ? SAGE : "#D1D5DB" }}>
            <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: user.visible ? "translateX(28px)" : "translateX(0)" }} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Profile Views (this month)" value="1,284" sub="+18% vs last month" />
          <StatCard label="Article / Offer Views" value="392" sub="+6% vs last month" />
          <StatCard label="Active Articles / Offers" value={liveArticles} />
          <StatCard label="Support Tickets (open)" value={openTickets} />
        </div>

        {/* Profile completeness */}
        <div className="bg-white rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: FOREST }}>Profile Completeness</p>
            <span className="text-sm font-bold" style={{ color: "#0F766E" }}>{completeness.percent}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF2F1" }}>
            <div className="h-full rounded-full" style={{ width: `${completeness.percent}%`, backgroundColor: SAGE }} />
          </div>
          {completeness.missing.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {completeness.missing.map((m) => (
                <Link key={m} to="/business/listing" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#0F766E" }}>→ {m}</Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <Link to="/business/listing" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: SAGE }}>Edit My Listing</Link>
          <Link to="/business/articles/new" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: FOREST, border: `1.5px solid ${BORDER}` }}>Create News/Offer</Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: FOREST, border: `1.5px solid ${BORDER}` }}>View Public Page</a>
          <Link to="/business/support" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: FOREST, border: `1.5px solid ${BORDER}` }}>Contact Support</Link>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-5" style={CARD}>
          <p className="text-sm font-bold mb-4" style={{ color: FOREST }}>Recent Activity</p>
          <div className="flex flex-col gap-3">
            {activity.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 text-sm" style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 10 }}>
                <span style={{ color: FOREST }}>{a.text}</span>
                <span className="text-xs shrink-0" style={{ color: "#9CA3AF" }}>{a.date}</span>
              </div>
            ))}
            {activity.length === 0 && <p className="text-sm" style={{ color: MUTED }}>No activity yet.</p>}
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
