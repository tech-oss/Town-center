import { useEffect, useState } from "react";
import { isPremium, BILLING_OPTIONS } from "../../Data/plans";
import { Link } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import { Toast, useToast } from "../components/FormKit";
import { PROFILE_COMPLETENESS } from "../../Data/businessPortalMock";
import { listArticles } from "../api/businessArticles";
import { listTickets } from "../api/businessTickets";
import { listActivity, activityLabel, activityIcon, relativeTime } from "../api/businessActivity";

const FOREST = "#1E293B", SAGE = "#2563EB", MUTED = "#64748B", BORDER = "rgba(16,24,40,0.1)";
const CARD = { backgroundColor: "#fff", border: "1px solid rgba(16,24,40,0.08)", boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" };

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-1" style={CARD}>
      <span className="text-2xl font-bold" style={{ color: FOREST }}>{value}</span>
      <span className="text-xs font-semibold" style={{ color: MUTED }}>{label}</span>
      {sub && <span className="text-[11px] mt-1" style={{ color: "#2563EB" }}>{sub}</span>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, toggleVisibility } = useBusinessAuth();
  const [toast, setToast] = useToast();

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");
  const completeness = PROFILE_COMPLETENESS[user.id] ?? { percent: 100, missing: [] };
  const [openTickets, setOpenTickets] = useState(0);
  const [liveArticles, setLiveArticles] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listTickets(user.id).then((tickets) => {
      if (!cancelled) setOpenTickets(tickets.filter((t) => t.status !== "Resolved").length);
    });
    listArticles(user.id).then((articles) => {
      if (!cancelled) setLiveArticles(articles.filter((a) => a.status === "Live").length);
    });
    listActivity(user.id, 10)
      .then((rows) => { if (!cancelled) { setActivity(rows); setActivityError(""); } })
      .catch((e) => { if (!cancelled) setActivityError(`Couldn't load your recent activity: ${e.message}`); })
      .finally(() => { if (!cancelled) setActivityLoading(false); });
    return () => { cancelled = true; };
  }, [user.id]);

  async function handleToggle() {
    const goingLive = !user.visible;
    const res = await toggleVisibility();
    if (res && !res.ok) {
      setToast("Couldn't update your profile's visibility. Please try again.");
      return;
    }
    setToast(goingLive
      ? "Your business profile is now live on the public site."
      : "Your business profile is now hidden from the public site.");
  }

  // "free" is what registration and claim onboarding now write for everyone.
  const isFreePlan = !isPremium(user.plan);

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
          {isFreePlan ? (
            <p className="text-sm text-white">You're on the <strong>Free plan</strong>. Upgrade to the <strong>Visibility Plan</strong> — just {BILLING_OPTIONS.year.perDay} a day — to add your logo, photos, opening hours, description, website, social links, news &amp; offers and analytics.</p>
          ) : (
            <p className="text-sm text-white">Your <strong className="capitalize">{String(user.plan ?? "").replace(/-/g, " ")}</strong> plan renews on <strong>{user.renewalDate ? new Date(user.renewalDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</strong>.</p>
          )}
          {user.role === "Content Manager" ? (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Managed by the business owner</span>
          ) : (
            <div className="flex gap-2">
              <Link to="/business/upgrade" className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: SAGE }}>{isFreePlan ? "See the Visibility Plan" : "Manage plan"}</Link>
              <Link to="/business/billing" className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" }}>Manage Billing</Link>
            </div>
          )}
        </div>

        {/* Visibility toggle */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap" style={CARD}>
          <div>
            <p className="text-sm font-bold" style={{ color: FOREST }}>Your business profile is currently {user.visible ? "Live" : "Hidden"}</p>
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
            <span className="text-sm font-bold" style={{ color: "#2563EB" }}>{completeness.percent}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF2F1" }}>
            <div className="h-full rounded-full" style={{ width: `${completeness.percent}%`, backgroundColor: SAGE }} />
          </div>
          {completeness.missing.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {completeness.missing.map((m) => (
                <Link key={m} to="/business/listing" className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#2563EB" }}>→ {m}</Link>
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

        {/* Recent activity — the last 10 changes to this business, whether
            made here or by admin reviewing something submitted. */}
        <div className="bg-white rounded-2xl p-5" style={CARD}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm font-bold" style={{ color: FOREST }}>Recent Activity</p>
            {activity.length > 0 && (
              <span className="text-[11px] font-semibold" style={{ color: "#9CA3AF" }}>Last {activity.length} update{activity.length === 1 ? "" : "s"}</span>
            )}
          </div>
          <div className="flex flex-col">
            {activityLoading ? (
              <p className="text-sm" style={{ color: MUTED }}>Loading…</p>
            ) : activityError ? (
              <p className="text-sm" style={{ color: "#B91C1C" }}>{activityError}</p>
            ) : activity.length === 0 ? (
              <p className="text-sm" style={{ color: MUTED }}>
                No activity yet. Editing your listing, posting news or submitting an event will show up here.
              </p>
            ) : activity.map((a, i) => (
              <div key={a.id} className="flex items-start gap-3 py-3"
                style={i < activity.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden="true">{activityIcon(a)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: FOREST }}>{activityLabel(a)}</p>
                  {a.detail && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{a.detail}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.actor === "admin" && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: SAGE }}>Admin</span>
                  )}
                  <span className="text-xs" style={{ color: "#9CA3AF" }} title={new Date(a.createdAt).toLocaleString("en-GB")}>{relativeTime(a.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
