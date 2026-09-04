import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useBusinessAuth from "../hooks/useBusinessAuth";
import BusinessLayout from "../components/BusinessLayout";
import AnalyticsChart from "../components/AnalyticsChart";
import RangeSelector from "../components/RangeSelector";
import { EditorSection, CARD, FOREST, MUTED } from "../components/FormKit";
// Dummy data for now — see AnalyticsPage.jsx for the swap-to-live note.
import { getContentSeries } from "../api/businessAnalyticsMock";

export default function ContentAnalyticsDetailPage() {
  const { user } = useBusinessAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ total: 0, series: [], item: null });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getContentSeries(user.id, id, range).then((res) => {
      if (!cancelled) { setData(res); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [user.id, id, range]);

  const rangeLabel = { "7d": "7 days", "30d": "30 days", "3m": "3 months", "12m": "12 months" }[range];

  return (
    <BusinessLayout>
      <div className="flex flex-col gap-6 max-w-5xl">
        <button onClick={() => navigate("/business/analytics")} className="text-sm font-medium w-fit transition-opacity hover:opacity-70" style={{ color: FOREST }}>← Analytics</button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: FOREST }}>{data.item?.title ?? (loading ? "Loading…" : "Content")}</h1>
            {data.item && <p className="text-sm mt-1" style={{ color: MUTED }}>{data.item.type}</p>}
          </div>
          <RangeSelector value={range} onChange={setRange} />
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: MUTED }}>Loading analytics…</p>
        ) : (
          <div className="bg-white rounded-2xl p-6" style={CARD}>
            <EditorSection title="Views over time">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold" style={{ color: FOREST }}>{data.total.toLocaleString()}</span>
                <span className="text-sm" style={{ color: MUTED }}>views · Last {rangeLabel}</span>
              </div>
              <AnalyticsChart series={data.series} />
            </EditorSection>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}
