import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import AnalyticsChart from "../components/AnalyticsChart";
import RangeSelector from "../components/RangeSelector";
import { EditorSection, CARD, FOREST, MUTED, BORDER } from "../components/FormKit";
// Dummy data for now — swap this single import for "../api/businessAnalytics"
// once trackView() is wired up on the public site/app and real events exist.
// Every function name and return shape below is identical between the two.
import { getProfileViewsSeries, getContentViewsSeries, getContentBreakdown } from "../api/businessAnalyticsMock";

function StatHeader({ total, rangeLabel }) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <span className="text-3xl font-bold" style={{ color: FOREST }}>{total.toLocaleString()}</span>
      <span className="text-sm" style={{ color: MUTED }}>views · Last {rangeLabel}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useBusinessAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ total: 0, series: [] });
  const [content, setContent] = useState({ total: 0, series: [] });
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProfileViewsSeries(user.id, range),
      getContentViewsSeries(user.id, range),
      getContentBreakdown(user.id, range),
    ]).then(([p, c, b]) => {
      if (cancelled) return;
      setProfile(p);
      setContent(c);
      setBreakdown(b);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user.id, range]);

  const rangeLabel = { "7d": "7 days", "30d": "30 days", "3m": "3 months", "12m": "12 months" }[range];

  return (
    <BusinessLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Analytics</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>How people are finding and viewing your business.</p>
          </div>
          <RangeSelector value={range} onChange={setRange} />
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading analytics…</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-6" style={CARD}>
              <EditorSection title="Profile views">
                <StatHeader total={profile.total} rangeLabel={rangeLabel} />
                <AnalyticsChart series={profile.series} />
              </EditorSection>
            </div>

            <div className="bg-white rounded-2xl p-6" style={CARD}>
              <EditorSection title="Articles, News & Offers" hint="Combined views across everything in your News & Articles tab.">
                <StatHeader total={content.total} rangeLabel={rangeLabel} />
                <AnalyticsChart series={content.series} />
              </EditorSection>
            </div>

            <div className="bg-white rounded-2xl p-6" style={CARD}>
              <EditorSection title="Your content" hint="Click an item to see its own views over time.">
                {breakdown.length === 0 ? (
                  <p className="text-sm" style={{ color: MUTED }}>No content views yet for this period.</p>
                ) : (
                  <div className="flex flex-col">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED, borderBottom: `1px solid ${BORDER}` }}>
                      <span>Content</span>
                      <span className="w-20">Type</span>
                      <span className="w-20 text-right">Views</span>
                    </div>
                    {breakdown.map((row) => (
                      <button
                        key={row.id}
                        onClick={() => navigate(`/business/analytics/content/${row.id}`)}
                        className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                      >
                        <span className="font-semibold truncate" style={{ color: "#0F766E" }}>{row.title}</span>
                        <span className="w-20" style={{ color: MUTED }}>{row.type}</span>
                        <span className="w-20 text-right font-semibold" style={{ color: FOREST }}>{row.views.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </EditorSection>
            </div>
          </>
        )}
      </div>
    </BusinessLayout>
  );
}
