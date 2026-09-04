import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import AnalyticsChart from "../components/AnalyticsChart";
import { FOREST, SAGE, MUTED, BORDER } from "../components/FormKit";
import { resolveRange } from "../api/analyticsRanges";
// Dummy data for now — see AnalyticsPage.jsx for the swap-to-live note.
// getAllContentSeries pulls every content item's own chart, so the export
// includes each news/offer/article's graph, not just the two overall ones.
import { getProfileViewsSeries, getContentViewsSeries, getContentBreakdown, getAllContentSeries } from "../api/businessAnalyticsMock";

// Reads the range straight out of the URL so this page can be opened
// directly (a new tab, or the browser's print dialog) with the exact range
// the business owner had selected on the Analytics page — no shared state
// needed between the two pages.
function rangeFromSearchParams(params) {
  if (params.get("type") === "custom" && params.get("from") && params.get("to")) {
    return { type: "custom", from: params.get("from"), to: params.get("to") };
  }
  return { type: "preset", key: params.get("key") ?? "30d" };
}

function ReportSection({ title, total, series }) {
  return (
    <section className="mb-8 break-inside-avoid">
      <h2 className="text-base font-bold mb-1" style={{ color: FOREST }}>{title}</h2>
      <p className="text-2xl font-bold mb-3" style={{ color: FOREST }}>
        {total.toLocaleString()} <span className="text-sm font-normal" style={{ color: MUTED }}>views</span>
      </p>
      <AnalyticsChart series={series} height={180} />
    </section>
  );
}

export default function AnalyticsReportPage() {
  const { user } = useBusinessAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const range = rangeFromSearchParams(searchParams);
  const { label: rangeLabel } = resolveRange(range);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ total: 0, series: [] });
  const [content, setContent] = useState({ total: 0, series: [] });
  const [breakdown, setBreakdown] = useState([]);
  const [contentSeries, setContentSeries] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getProfileViewsSeries(user.id, range),
      getContentViewsSeries(user.id, range),
      getContentBreakdown(user.id, range),
      getAllContentSeries(user.id, range),
    ]).then(([p, c, b, cs]) => {
      if (cancelled) return;
      setProfile(p);
      setContent(c);
      setBreakdown(b);
      setContentSeries(cs);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, JSON.stringify(range)]);

  const generatedAt = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F4F8F7" }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* Screen-only toolbar — hidden entirely when printing/saving as PDF */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4" style={{ backgroundColor: "#fff", borderBottom: "1px solid rgba(16,24,40,0.08)" }}>
        <button onClick={() => navigate("/business/analytics")} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: FOREST }}>← Back to Analytics</button>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: SAGE }}
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-8 print:p-0 print:max-w-none">
        <div className="bg-white rounded-2xl p-8 print:rounded-none print:shadow-none print:p-0" style={{ boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)" }}>

          {/* Report letterhead */}
          <header className="flex items-start justify-between gap-6 pb-6 mb-8" style={{ borderBottom: `2px solid ${FOREST}` }}>
            <div className="flex items-center gap-3">
              <img src="/logo-mark.svg" alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: SAGE }}>Maidenhead Business</p>
                <p className="text-lg font-bold" style={{ color: FOREST }}>{user.businessName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: FOREST }}>Analytics Report</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>Date range: {rangeLabel}</p>
              <p className="text-xs" style={{ color: MUTED }}>Generated {generatedAt}</p>
            </div>
          </header>

          {loading ? (
            <p className="text-sm" style={{ color: MUTED }}>Loading report…</p>
          ) : (
            <>
              <ReportSection title="Profile views" total={profile.total} series={profile.series} />
              <ReportSection title="Articles, News & Offers" total={content.total} series={content.series} />

              <section className="mb-8 break-inside-avoid">
                <h2 className="text-base font-bold mb-3" style={{ color: FOREST }}>Content breakdown</h2>
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${BORDER}` }}>
                      <th className="text-left py-2 font-bold" style={{ color: MUTED }}>Content</th>
                      <th className="text-left py-2 font-bold" style={{ color: MUTED }}>Type</th>
                      <th className="text-right py-2 font-bold" style={{ color: MUTED }}>Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row) => (
                      <tr key={row.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="py-2 font-semibold" style={{ color: FOREST }}>{row.title}</td>
                        <td className="py-2" style={{ color: MUTED }}>{row.type}</td>
                        <td className="py-2 text-right font-semibold" style={{ color: FOREST }}>{row.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <h2 className="text-base font-bold mb-1" style={{ color: FOREST }}>Individual content performance</h2>
              <p className="text-xs mb-4" style={{ color: MUTED }}>Views over time for each article, news post and offer.</p>
              {contentSeries.map((c) => (
                <ReportSection key={c.id} title={`${c.title} (${c.type})`} total={c.total} series={c.series} />
              ))}

              <footer className="mt-10 pt-4 text-[10px] text-center" style={{ borderTop: `1px solid ${BORDER}`, color: MUTED }}>
                Maidenhead Business Dashboard · {user.businessName} · Report for {rangeLabel} · Generated {generatedAt}
              </footer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
