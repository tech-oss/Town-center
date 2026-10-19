import { useEffect, useState } from "react";
import useLiveTick from "../hooks/useLiveTick";
import { useNavigate } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import useAnalyticsScope from "../hooks/useAnalyticsScope";
import BusinessLayout from "../components/BusinessLayout";
import AnalyticsChart from "../components/AnalyticsChart";
import RangeSelector from "../components/RangeSelector";
import { EditorSection, CARD, FOREST, MUTED, BORDER, SAGE } from "../components/FormKit";
import { DEFAULT_RANGE, resolveRange } from "../api/analyticsRanges";
// Real views recorded by the website and app (see api/businessAnalytics.js).
import { getProfileViewsSeries, getContentViewsSeries, getContentBreakdown } from "../api/businessAnalytics";

function StatHeader({ total, web = 0, app = 0, rangeLabel }) {
  return (
    <div className="flex items-baseline gap-2 mb-4 flex-wrap">
      <span className="text-3xl font-bold" style={{ color: FOREST }}>{total.toLocaleString()}</span>
      <span className="text-sm" style={{ color: MUTED }}>views · {rangeLabel}</span>
      {total > 0 && (
        <span className="text-xs ml-auto" style={{ color: MUTED }}>
          Website {web.toLocaleString()} · App {app.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useBusinessAuth();
  // An accommodation company: all properties, or one of them.
  const { company, properties, scopeId, setScope, scopeQuery } = useAnalyticsScope();
  // An accommodation company looking at one of its properties.
  const singleProperty = company && scopeId !== user.id;
  const navigate = useNavigate();
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ total: 0, series: [] });
  const [content, setContent] = useState({ total: 0, series: [] });
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState("");
  // Refreshes every 30s and on returning to the tab, so views appear live.
  const tick = useLiveTick();
  const [loadedKey, setLoadedKey] = useState(null);
  const rangeKey = `${scopeId}|${JSON.stringify(range)}`;

  useEffect(() => {
    let cancelled = false;
    // Only a change of range shows the loading state; a live refresh updates
    // the numbers in place rather than flashing the page empty.
    if (loadedKey !== rangeKey) setLoading(true);
    Promise.all([
      getProfileViewsSeries(scopeId, range),
      getContentViewsSeries(scopeId, range),
      getContentBreakdown(scopeId, range),
    ]).then(([p, c, b]) => {
      if (cancelled) return;
      setProfile(p);
      setContent(c);
      setBreakdown(b);
      setError("");
      setLoading(false);
      setLoadedKey(rangeKey);
    }).catch((e) => {
      if (cancelled) return;
      setError(e.message ?? "Analytics couldn't be loaded.");
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId, JSON.stringify(range), tick]);

  const { label: rangeLabel } = resolveRange(range);

  function handleExportPdf() {
    const params = range.type === "custom"
      ? { type: "custom", from: range.from, to: range.to }
      : { type: "preset", key: range.key };
    navigate(`/business/analytics/report?${new URLSearchParams({ ...params, ...(scopeQuery ? { scope: scopeId } : {}) }).toString()}`);
  }

  return (
    <BusinessLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>Analytics</h1>
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {company ? "How people are finding and viewing your properties — all together, or one at a time." : "How people are finding and viewing your business."}
            </p>
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <button
              onClick={handleExportPdf}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 flex items-center gap-1.5"
              style={{ backgroundColor: "rgba(16,24,40,0.06)", color: FOREST }}
            >
              ⬇ Export as PDF
            </button>
          </div>
        </div>

        <div className={`flex gap-3 flex-wrap items-center ${company ? "justify-between" : "justify-end"}`}>
          {company && (
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold" style={{ color: FOREST }}>Showing</span>
              <select value={scopeId} onChange={(e) => setScope(e.target.value)} aria-label="Which property"
                className="rounded-xl px-3 py-2 text-sm" style={{ border: `1.5px solid ${BORDER}`, color: FOREST, backgroundColor: "#fff", minWidth: 220 }}>
                <option value={user.id}>All properties (company-wide)</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          <RangeSelector value={range} onChange={setRange} />
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading analytics…</p>
        ) : error ? (
          <p role="alert" className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: "#FEF2F2", color: "#991B1B" }}>{error}</p>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-6" style={CARD}>
              <EditorSection title={company ? (scopeId === user.id ? "Property page views (all properties)" : "Property page views") : "Profile views"}>
                <StatHeader total={profile.total} web={profile.web} app={profile.app} rangeLabel={rangeLabel} />
                <AnalyticsChart series={profile.series} />
              </EditorSection>
            </div>

            {/* One property: page views only. A company's news, offers and
                events belong to the whole company — every property page
                shows them — so their views are only shown company-wide
                (All properties), where the figures mean what they say. */}
            {singleProperty ? (
              <div className="rounded-2xl p-5 text-sm" style={{ border: `1.5px dashed ${BORDER}`, color: MUTED }}>
                Views of your news, offers and events are for the whole company. Choose <strong style={{ color: FOREST }}>All properties</strong> above to see them.
              </div>
            ) : (
            <>
            <div className="bg-white rounded-2xl p-6" style={CARD}>
              <EditorSection title="News, Offers & Events" hint="Combined views of your news and offer posts and your events.">
                <StatHeader total={content.total} web={content.web} app={content.app} rangeLabel={rangeLabel} />
                <AnalyticsChart series={content.series} />
              </EditorSection>
            </div>

            <div className="bg-white rounded-2xl p-6" style={CARD}>
              <EditorSection title="Your content" hint="Click an item to see its own views over time.">
                {breakdown.length === 0 ? (
                  <p className="text-sm" style={{ color: MUTED }}>No views of your posts or events in this period yet.</p>
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
                        onClick={() => navigate(`/business/analytics/content/${row.id}${scopeQuery ? `?${scopeQuery}` : ""}`)}
                        className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                      >
                        <span className="font-semibold truncate" style={{ color: "#2563EB" }}>{row.title}</span>
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
          </>
        )}
      </div>
    </BusinessLayout>
  );
}
