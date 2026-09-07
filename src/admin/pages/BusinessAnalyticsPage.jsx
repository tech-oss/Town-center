import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBusinesses } from "../../api/admin";
import { getProfileViewsSeries, getContentViewsSeries, getContentBreakdown } from "../../api/admin/businessAnalytics";
import { DEFAULT_RANGE, resolveRange } from "../../lib/analyticsRanges";
import AnalyticsChart from "../components/AnalyticsChart";
import AnalyticsRangeSelector from "../components/AnalyticsRangeSelector";
import LoadingState from "../components/LoadingState";
import { NAVY, BLUE, MUTED, BORDER, CARD } from "../theme";

function StatHeader({ total, rangeLabel }) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <span className="text-3xl font-bold" style={{ color: NAVY }}>{total.toLocaleString()}</span>
      <span className="text-sm" style={{ color: MUTED }}>views · {rangeLabel}</span>
    </div>
  );
}

// Business picker — a business is chosen once, then the URL carries it
// (/admin/business-analytics/:businessId), so the view is linkable/shareable
// and survives a refresh.
function BusinessPicker({ businesses, onPick }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = q ? businesses.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 8) : [];

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-1" style={{ color: NAVY }}>Business Analytics</h1>
      <p className="text-sm mb-5" style={{ color: MUTED }}>View a business's own profile and content analytics — the same numbers they see on their dashboard.</p>
      <div className="relative">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a business…" autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ border: `1.5px solid ${BORDER}`, color: NAVY, backgroundColor: "#fff" }} />
        {matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl overflow-hidden bg-white" style={{ border: `1.5px solid ${BORDER}`, boxShadow: "0 8px 24px rgba(16,24,40,0.12)" }}>
            {matches.map((b) => (
              <button key={b.id} onClick={() => onPick(b)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                style={{ color: NAVY, borderBottom: `1px solid ${BORDER}` }}>
                <span className="font-semibold">{b.name}</span>
                <span className="block text-xs" style={{ color: MUTED }}>{b.section || "—"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessAnalyticsPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState(null);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ total: 0, series: [] });
  const [content, setContent] = useState({ total: 0, series: [] });
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => { getBusinesses().then(setBusinesses); }, []);

  const business = businesses?.find((b) => b.id === businessId) ?? null;

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      getProfileViewsSeries(businessId, range),
      getContentViewsSeries(businessId, range),
      getContentBreakdown(businessId, range),
    ]).then(([p, c, b]) => {
      if (cancelled) return;
      setProfile(p); setContent(c); setBreakdown(b);
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      setError(e.message);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, JSON.stringify(range)]);

  if (!businessId) {
    if (!businesses) return <LoadingState />;
    return <BusinessPicker businesses={businesses} onPick={(b) => navigate(`/admin/business-analytics/${b.id}`)} />;
  }

  const { label: rangeLabel } = resolveRange(range);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => navigate("/admin/business-analytics")}
            className="text-sm font-medium mb-2 transition-opacity hover:opacity-70" style={{ color: NAVY }}>
            ← Choose a different business
          </button>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{business?.name ?? businessId}</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>How people are finding and viewing this business — the same numbers shown on their own dashboard.</p>
        </div>
        <AnalyticsRangeSelector value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="bg-white rounded-2xl p-6 text-sm" style={{ ...CARD, color: "#991B1B" }}>
          Couldn't load analytics: {error}
        </div>
      ) : loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="bg-white rounded-2xl p-6" style={CARD}>
            <h2 className="font-bold text-sm mb-1" style={{ color: NAVY }}>Profile views</h2>
            <StatHeader total={profile.total} rangeLabel={rangeLabel} />
            <AnalyticsChart series={profile.series} />
          </div>

          <div className="bg-white rounded-2xl p-6" style={CARD}>
            <h2 className="font-bold text-sm mb-1" style={{ color: NAVY }}>Articles, News & Offers</h2>
            <p className="text-xs mb-1" style={{ color: MUTED }}>Combined views across everything in their News & Articles tab.</p>
            <StatHeader total={content.total} rangeLabel={rangeLabel} />
            <AnalyticsChart series={content.series} />
          </div>

          <div className="bg-white rounded-2xl p-6" style={CARD}>
            <h2 className="font-bold text-sm mb-3" style={{ color: NAVY }}>Their content</h2>
            {breakdown.length === 0 ? (
              <p className="text-sm" style={{ color: MUTED }}>No content views yet for this period.</p>
            ) : (
              <div className="flex flex-col">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                  <span>Content</span><span className="w-20">Type</span><span className="w-20 text-right">Views</span>
                </div>
                {breakdown.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-sm" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <span className="font-semibold truncate" style={{ color: BLUE }}>{row.title}</span>
                    <span className="w-20" style={{ color: MUTED }}>{row.type}</span>
                    <span className="w-20 text-right font-semibold" style={{ color: NAVY }}>{row.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
